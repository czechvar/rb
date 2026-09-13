import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Payload, PayloadRequest } from 'payload'
import type { User } from '@/payload-types'
import { isAdminUser } from '@/access'
import type { CheckoutRecord } from './types'
import { checkoutEnabled } from './feature'
import { quoteCart } from './quote'
import { activateGuestReservation, cancelCheckout, isReturningPurchaser } from './reservations'
import {
  checkoutDatabase,
  lockCheckout,
  lockSubmission,
  withCheckoutTransaction,
} from './transaction'
import { checkoutEmailAvailable, sendCheckoutLink } from './notifications'

export const guestCheckoutSchema = z.object({
  submissionKey: z.string().uuid(),
  contact: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s()-]{6,20}$/),
  }),
  items: z
    .array(
      z.object({
        eventDateId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(20),
  discountCode: z.string().trim().max(100).optional(),
  referralCode: z.string().trim().max(100).optional(),
})

export function checkoutTokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
export function validCheckoutToken(
  token: string,
  hash: string | null | undefined,
  expiresAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (
    !/^[A-Za-z0-9_-]{43}$/.test(token) ||
    !hash ||
    !/^[a-f0-9]{64}$/.test(hash) ||
    !expiresAt ||
    Date.parse(expiresAt) <= now ||
    !Number.isFinite(Date.parse(expiresAt))
  )
    return false
  return timingSafeEqual(Buffer.from(checkoutTokenHash(token), 'hex'), Buffer.from(hash, 'hex'))
}

function enabled() {
  if (!checkoutEnabled()) throw new Error('Checkout is not available.')
}
async function client() {
  const { getPayloadClient } = await import('@/lib/payload')
  return getPayloadClient()
}

async function journeyForEmail(
  payload: Payload,
  email: string,
  req?: PayloadRequest,
): Promise<'login' | 'new'> {
  const found = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  return found.docs[0] && (await isReturningPurchaser(payload, found.docs[0], req))
    ? 'login'
    : 'new'
}

/** Accepted email-first routing exposes only the journey, never account/profile details. */
export async function lookupCheckoutJourney(
  email: string,
  network: string,
): Promise<'login' | 'new'> {
  enabled()
  const normalized = z.string().trim().toLowerCase().email().max(254).parse(email)
  const payload = await client()
  await rateIdentity(payload, network, normalized)
  return journeyForEmail(payload, normalized)
}

/** Separate committed limiter transaction: business rollback must not refund an abuse attempt. */
async function rateIdentity(payload: Payload, network: string, identity: string): Promise<void> {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('Checkout is not available.')
  const hash = (value: string) =>
    createHmac('sha256', secret).update(`checkout:${value}`).digest('hex')
  const admitted = await withCheckoutTransaction(payload, async (req) => {
    const db = await checkoutDatabase(req)
    const keys = [
      { key: hash(`network:${network}`), limit: 10 },
      { key: hash(`identity:${identity}`), limit: 3 },
    ].sort((a, b) => a.key.localeCompare(b.key))
    const rows = sql.join(
      keys.map((value) => sql`(${value.key}::varchar, ${value.limit}::integer)`),
      sql`, `,
    )
    const result = (await db.execute(sql`
      WITH gate AS (
        INSERT INTO contact_intake_rate_limits (key,count,expires_at) VALUES (${hash('global')},1,now()+interval '10 minutes')
        ON CONFLICT (key) DO UPDATE SET count=CASE WHEN contact_intake_rate_limits.expires_at<=now() THEN 1 ELSE contact_intake_rate_limits.count+1 END, expires_at=CASE WHEN contact_intake_rate_limits.expires_at<=now() THEN now()+interval '10 minutes' ELSE contact_intake_rate_limits.expires_at END
        WHERE contact_intake_rate_limits.expires_at<=now() OR contact_intake_rate_limits.count<100 RETURNING key
      ), requested(key,maximum) AS (VALUES ${rows}), admitted AS (
        INSERT INTO contact_intake_rate_limits (key,count,expires_at) SELECT key,1,now()+interval '10 minutes' FROM requested WHERE EXISTS(SELECT 1 FROM gate) ORDER BY key
        ON CONFLICT (key) DO UPDATE SET count=CASE WHEN contact_intake_rate_limits.expires_at<=now() THEN 1 ELSE contact_intake_rate_limits.count+1 END, expires_at=CASE WHEN contact_intake_rate_limits.expires_at<=now() THEN now()+interval '10 minutes' ELSE contact_intake_rate_limits.expires_at END
        WHERE contact_intake_rate_limits.expires_at<=now() OR contact_intake_rate_limits.count<(SELECT maximum FROM requested WHERE requested.key=contact_intake_rate_limits.key) RETURNING key
      ) SELECT ((SELECT count(*) FROM admitted)+(SELECT count(*) FROM gate))::integer AS admitted
    `)) as { rows?: Array<{ admitted?: number }> }
    await db.execute(
      sql`DELETE FROM contact_intake_rate_limits WHERE expires_at<=now() AND key IN(SELECT key FROM contact_intake_rate_limits WHERE expires_at<=now() ORDER BY expires_at LIMIT 100)`,
    )
    return result.rows?.[0]?.admitted === 3
  })
  if (!admitted) throw new Error('Too many attempts. Please wait ten minutes before trying again.')
}

async function recordNotification(
  payload: Payload,
  id: number,
  tokenHash: string,
  kind: 'verify' | 'invite',
  notificationStatus: 'sent' | 'failed' | 'notConfigured',
) {
  await withCheckoutTransaction(payload, async (req) => {
    await lockCheckout(req, id)
    const current = (await payload.findByID({
      collection: 'checkouts',
      id,
      overrideAccess: true,
      req,
    })) as unknown as CheckoutRecord
    if ((kind === 'verify' ? current.verificationHash : current.invitationHash) !== tokenHash)
      return
    await payload.update({
      collection: 'checkouts',
      id,
      data: { notificationStatus },
      overrideAccess: true,
      req,
    })
  })
}

export async function createGuestCheckout(raw: unknown, network: string): Promise<number> {
  enabled()
  const input = guestCheckoutSchema.parse(raw)
  if (!checkoutEmailAvailable())
    throw new Error('Verification email is not configured. Please contact us directly.')
  const payload = await client()
  await rateIdentity(payload, network, input.contact.email)
  const token = randomBytes(32).toString('base64url')
  const verificationHash = checkoutTokenHash(token)
  const requestDigest = createHash('sha256').update(JSON.stringify(input)).digest('hex')
  const checkout = await withCheckoutTransaction(payload, async (req) => {
    if ((await journeyForEmail(payload, input.contact.email, req)) === 'login')
      throw new Error('Sign in to your existing purchaser account to continue.')
    await lockSubmission(req, input.submissionKey)
    const previous = await payload.find({
      collection: 'checkouts',
      where: { submissionKey: { equals: input.submissionKey } },
      limit: 1,
      overrideAccess: true,
      req,
    })
    let existing = previous.docs[0] as unknown as CheckoutRecord | undefined
    if (existing) {
      await lockCheckout(req, existing.id)
      existing = (await payload.findByID({
        collection: 'checkouts',
        id: existing.id,
        overrideAccess: true,
        req,
      })) as unknown as CheckoutRecord
      if (existing.requestDigest !== requestDigest || existing.state !== 'unverified')
        throw new Error('Start a new checkout for this request.')
    }
    const quote = await quoteCart(input, req)
    const data = {
      submissionKey: input.submissionKey,
      requestDigest,
      reference: existing?.reference ?? `RB-${randomBytes(6).toString('hex').toUpperCase()}`,
      state: 'unverified' as const,
      customerKind: 'new' as const,
      contact: input.contact,
      items: quote.items,
      currency: quote.currency,
      discountCode: input.discountCode,
      referralCode: input.referralCode,
      verificationHash,
      verificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      notificationStatus: 'pending' as const,
    }
    return (existing
      ? payload.update({
          collection: 'checkouts',
          id: existing.id,
          data,
          overrideAccess: true,
          req,
        })
      : payload.create({
          collection: 'checkouts',
          data,
          overrideAccess: true,
          req,
        })) as unknown as Promise<CheckoutRecord>
  })
  const status = await sendCheckoutLink(payload, {
    id: checkout.id,
    email: input.contact.email,
    token,
    kind: 'verify',
  })
  await recordNotification(payload, checkout.id, verificationHash, 'verify', status)
  if (status !== 'sent')
    throw new Error(
      'The verification email could not be sent. Please retry or contact us directly.',
    )
  return checkout.id
}

export async function verifyGuestCheckout(
  id: number,
  token: string,
  network: string,
): Promise<CheckoutRecord> {
  enabled()
  if (!Number.isSafeInteger(id) || id <= 0 || !/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new Error('This confirmation link is invalid or expired.')
  await rateIdentity(await client(), network, `verify:${id}`)
  return activateGuestReservation(id, checkoutTokenHash(token))
}

export async function reviewGuestCheckout(
  id: number,
  actor: User,
  decision: 'approve' | 'decline',
  note: string,
): Promise<void> {
  enabled()
  if (!isAdminUser(actor)) throw new Error('Staff access required.')
  if (!Number.isSafeInteger(id) || id <= 0 || note.length > 2000)
    throw new Error('Invalid review request.')
  if (decision === 'decline') {
    await cancelCheckout(id, actor, note)
    return
  }
  if (!checkoutEmailAvailable()) throw new Error('Invitation email is not configured.')
  const payload = await client()
  const token = randomBytes(32).toString('base64url')
  const invitationHash = checkoutTokenHash(token)
  const checkout = await withCheckoutTransaction(payload, async (req) => {
    await lockCheckout(req, id)
    const record = (await payload.findByID({
      collection: 'checkouts',
      id,
      overrideAccess: true,
      req,
    })) as unknown as CheckoutRecord
    if (record.customerKind !== 'new' || !['awaitingReview', 'approved'].includes(record.state))
      throw new Error('This checkout is not awaiting review.')
    if (record.state === 'awaitingReview') {
      for (const item of record.items)
        if (item.orderId && !item.cancelledAt)
          await payload.update({
            collection: 'orders',
            id: item.orderId,
            data: { state: 'confirmed' },
            overrideAccess: true,
            req,
          })
    }
    await payload.update({
      collection: 'checkouts',
      id,
      data: {
        state: 'approved',
        approvedAt: record.approvedAt ?? new Date().toISOString(),
        reviewedBy: actor.id,
        reviewNote: note,
        invitationHash,
        invitationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        invitedAt: new Date().toISOString(),
        notificationStatus: 'pending',
      },
      overrideAccess: true,
      req,
    })
    return record
  })
  const status = await sendCheckoutLink(payload, {
    id,
    email: checkout.contact.email,
    token,
    kind: 'invite',
  })
  await recordNotification(payload, id, invitationHash, 'invite', status)
  if (status !== 'sent')
    throw new Error(
      'Approval was saved but the invitation could not be sent. Use resend invitation to retry.',
    )
}

export async function invitationKind(
  id: number,
  token: string,
  actor: User | null,
): Promise<'create' | 'login' | 'continue' | 'invalid'> {
  enabled()
  const payload = await client()
  const record = (await payload.findByID({
    collection: 'checkouts',
    id,
    overrideAccess: true,
    depth: 0,
  })) as unknown as CheckoutRecord
  if (
    record.state !== 'approved' ||
    !validCheckoutToken(token, record.invitationHash, record.invitationExpiresAt)
  )
    return 'invalid'
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: record.contact.email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (!existing.docs[0]) return 'create'
  return actor?.id === existing.docs[0].id ? 'continue' : 'login'
}

export async function acceptCheckoutInvitation(
  id: number,
  token: string,
  password: string,
  actor: User | null,
  network: string,
): Promise<void> {
  enabled()
  const payload = await client()
  await rateIdentity(payload, network, `invite:${id}`)
  await withCheckoutTransaction(payload, async (req) => {
    await lockCheckout(req, id)
    const record = (await payload.findByID({
      collection: 'checkouts',
      id,
      overrideAccess: true,
      depth: 0,
      req,
    })) as unknown as CheckoutRecord
    if (
      record.state !== 'approved' ||
      !validCheckoutToken(token, record.invitationHash, record.invitationExpiresAt)
    )
      throw new Error('This invitation is invalid or expired.')
    await lockSubmission(req, `account:${record.contact.email.toLowerCase()}`)
    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: record.contact.email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    let user = users.docs[0]
    if (user) {
      if (actor?.id !== user.id)
        throw new Error('Sign in to the existing account before accepting this invitation.')
    } else {
      z.string().min(8).max(128).parse(password)
      user = await payload.create({
        collection: 'users',
        data: {
          name: record.contact.name,
          email: record.contact.email,
          phone: record.contact.phone,
          role: 'customer',
          password,
          _verified: true,
        },
        disableVerificationEmail: true,
        overrideAccess: true,
        req,
      })
    }
    for (const item of record.items)
      if (item.orderId)
        await payload.update({
          collection: 'orders',
          id: item.orderId,
          data: { user: user.id },
          overrideAccess: true,
          req,
        })
    await payload.update({
      collection: 'checkouts',
      id,
      data: { user: user.id, invitationHash: null, invitationExpiresAt: null },
      overrideAccess: true,
      req,
    })
  })
}
