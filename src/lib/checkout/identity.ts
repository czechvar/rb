import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Payload, PayloadRequest } from 'payload'
import type { User } from '@/payload-types'
import { isAdminUser } from '@/access'
import type { CheckoutRecord } from './types'
import { checkoutEnabled } from './feature'
import { quoteCart } from './quote'
import { checkoutRateLimitConfig, checkoutRateLimitWindowLabel } from './rate-limit'
import { activateGuestReservation, cancelCheckout } from './reservations'
import {
  checkoutDatabase,
  lockCheckout,
  lockSubmission,
  withCheckoutTransaction,
} from './transaction'
import {
  checkoutEmailAvailable,
  sendCheckoutInvitationLink,
  sendCheckoutVerificationCode,
} from './notifications'

export const guestCheckoutSchema = z.object({
  submissionKey: z.string().uuid(),
  contact: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.preprocess(
      (value) => value ?? '',
      z
        .string()
        .trim()
        .refine((value) => !value || /^\+?[\d\s()-]{6,20}$/.test(value)),
    ),
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

export function generateCheckoutVerificationCode(): string {
  return randomInt(1_000_000).toString().padStart(6, '0')
}

export function checkoutVerificationCodeHash(code: string, secret: string): string {
  if (!/^\d{6}$/.test(code) || !secret) throw new Error('Checkout is not available.')
  return createHmac('sha256', secret).update(`checkout:verification-code:${code}`).digest('hex')
}

function verificationCodeHash(code: string): string {
  return checkoutVerificationCodeHash(code, process.env.PAYLOAD_SECRET ?? '')
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

export async function checkoutJourneyForEmail(
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
  return found.docs[0] ? 'login' : 'new'
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
  return checkoutJourneyForEmail(payload, normalized)
}

/** Separate committed limiter transaction: business rollback must not refund an abuse attempt. */
async function rateIdentity(payload: Payload, network: string, identity: string): Promise<void> {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('Checkout is not available.')
  const limits = checkoutRateLimitConfig()
  const hash = (value: string) =>
    createHmac('sha256', secret).update(`checkout:${value}`).digest('hex')
  const admitted = await withCheckoutTransaction(payload, async (req) => {
    const db = await checkoutDatabase(req)
    const keys = [
      { key: hash(`network:${network}`), limit: limits.networkMax },
      { key: hash(`identity:${identity}`), limit: limits.emailMax },
    ].sort((a, b) => a.key.localeCompare(b.key))
    const rows = sql.join(
      keys.map((value) => sql`(${value.key}::varchar, ${value.limit}::integer)`),
      sql`, `,
    )
    const result = (await db.execute(sql`
      WITH gate AS (
        INSERT INTO contact_intake_rate_limits (key,count,expires_at) VALUES (${hash('global')},1,now()+(${limits.windowSeconds} * interval '1 second'))
        ON CONFLICT (key) DO UPDATE SET count=CASE WHEN contact_intake_rate_limits.expires_at<=now() THEN 1 ELSE contact_intake_rate_limits.count+1 END, expires_at=CASE WHEN contact_intake_rate_limits.expires_at<=now() THEN now()+(${limits.windowSeconds} * interval '1 second') ELSE contact_intake_rate_limits.expires_at END
        WHERE contact_intake_rate_limits.expires_at<=now() OR contact_intake_rate_limits.count<${limits.globalMax} RETURNING key
      ), requested(key,maximum) AS (VALUES ${rows}), admitted AS (
        INSERT INTO contact_intake_rate_limits (key,count,expires_at) SELECT key,1,now()+(${limits.windowSeconds} * interval '1 second') FROM requested WHERE EXISTS(SELECT 1 FROM gate) ORDER BY key
        ON CONFLICT (key) DO UPDATE SET count=CASE WHEN contact_intake_rate_limits.expires_at<=now() THEN 1 ELSE contact_intake_rate_limits.count+1 END, expires_at=CASE WHEN contact_intake_rate_limits.expires_at<=now() THEN now()+(${limits.windowSeconds} * interval '1 second') ELSE contact_intake_rate_limits.expires_at END
        WHERE contact_intake_rate_limits.expires_at<=now() OR contact_intake_rate_limits.count<(SELECT maximum FROM requested WHERE requested.key=contact_intake_rate_limits.key) RETURNING key
      ) SELECT ((SELECT count(*) FROM admitted)+(SELECT count(*) FROM gate))::integer AS admitted
    `)) as { rows?: Array<{ admitted?: number }> }
    await db.execute(
      sql`DELETE FROM contact_intake_rate_limits WHERE expires_at<=now() AND key IN(SELECT key FROM contact_intake_rate_limits WHERE expires_at<=now() ORDER BY expires_at LIMIT 100)`,
    )
    return result.rows?.[0]?.admitted === 3
  })
  if (!admitted)
    throw new Error(
      `Too many attempts. Please wait ${checkoutRateLimitWindowLabel()} before trying again.`,
    )
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
  const code = generateCheckoutVerificationCode()
  const verificationHash = verificationCodeHash(code)
  const requestDigest = createHash('sha256').update(JSON.stringify(input)).digest('hex')
  const checkout = await withCheckoutTransaction(payload, async (req) => {
    if ((await checkoutJourneyForEmail(payload, input.contact.email, req)) === 'login')
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
      verificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
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
  const status = await sendCheckoutVerificationCode(payload, {
    email: input.contact.email,
    code,
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
  credential: string,
  network: string,
): Promise<CheckoutRecord> {
  enabled()
  const isCode = /^\d{6}$/.test(credential)
  const isLegacyToken = /^[A-Za-z0-9_-]{43}$/.test(credential)
  if (!Number.isSafeInteger(id) || id <= 0 || (!isCode && !isLegacyToken))
    throw new Error('This verification code is invalid or expired.')
  await rateIdentity(await client(), network, `verify:${id}`)
  return activateGuestReservation(
    id,
    isCode ? verificationCodeHash(credential) : checkoutTokenHash(credential),
  )
}

export async function reviewGuestCheckout(
  id: number,
  actor: User,
  decision: 'approve' | 'decline',
  note: string,
): Promise<void> {
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
  const status = await sendCheckoutInvitationLink(payload, {
    id,
    reference: checkout.reference,
    email: checkout.contact.email,
    token,
    items: checkout.items,
  })
  await recordNotification(payload, id, invitationHash, 'invite', status)
  if (status !== 'sent')
    throw new Error(
      'Approval was saved but the invitation could not be sent. Use resend invitation to retry.',
    )
}

export type CheckoutInvitationState =
  | { kind: 'create'; name: string; email: string }
  | { kind: 'login' | 'continue' | 'invalid' }

export async function invitationKind(
  id: number,
  token: string,
  actor: User | null,
): Promise<CheckoutInvitationState> {
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
    return { kind: 'invalid' }
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: record.contact.email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (!existing.docs[0])
    return { kind: 'create', name: record.contact.name, email: record.contact.email }
  return { kind: actor?.id === existing.docs[0].id ? 'continue' : 'login' }
}

export async function acceptCheckoutInvitation(
  id: number,
  token: string,
  account: { name?: string; password?: string },
  actor: User | null,
  network: string,
): Promise<{ created: boolean; email: string }> {
  enabled()
  const payload = await client()
  await rateIdentity(payload, network, `invite:${id}`)
  return withCheckoutTransaction(payload, async (req) => {
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
    let created = false
    if (user) {
      if (actor?.id !== user.id)
        throw new Error('Sign in to the existing account before accepting this invitation.')
    } else {
      const name = z.string().trim().min(2).max(100).parse(account.name)
      const password = z.string().min(8).max(128).parse(account.password)
      user = await payload.create({
        collection: 'users',
        data: {
          name,
          email: record.contact.email,
          ...(record.contact.phone ? { phone: record.contact.phone } : {}),
          role: 'customer',
          password,
          _verified: true,
        },
        disableVerificationEmail: true,
        overrideAccess: true,
        req,
      })
      created = true
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
    return { created, email: record.contact.email }
  })
}
