import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'
import { sql } from 'drizzle-orm'
import type { Payload } from 'payload'
import type { ActionResult } from '@/components/forms/action-result'
import { contactSchema } from './schema'
import { notifyContact } from './notification'

const failure: ActionResult = {
  ok: false,
  formError: 'Your enquiry could not be saved. Please try again or contact us directly.',
}

export function parseContactInput(formData: FormData) {
  const fields = [
    'name',
    'email',
    'level',
    'interest',
    'message',
    'preferredContact',
    'phone',
  ] as const
  return contactSchema.safeParse(
    Object.fromEntries(fields.map((field) => [field, formData.get(field) ?? ''])),
  )
}

/** Trust only Vercel's overwritten header on Vercel; elsewhere share one conservative bucket. */
export function contactNetwork(
  headers: { get(name: string): string | null },
  onVercel: boolean,
): string {
  const address = onVercel ? headers.get('x-vercel-forwarded-for')?.trim() : undefined
  if (!address || !isIP(address)) return 'unknown'
  if (isIP(address) === 4) return address
  // Group IPv6 clients by /64 so changing an interface address does not reset their limit.
  const normalized = new URL(`http://[${address}]/`).hostname.slice(1, -1)
  const [left, right] = normalized.split('::')
  const start = left ? left.split(':') : []
  const end = right ? right.split(':') : []
  const parts =
    right === undefined
      ? start
      : [...start, ...Array(8 - start.length - end.length).fill('0'), ...end]
  return parts
    .slice(0, 4)
    .map((part) => part.padStart(4, '0'))
    .join(':')
}

export async function intakeContact(
  formData: FormData,
  payload: Payload,
  network: string,
  secret: string,
  notify: typeof notifyContact = notifyContact,
): Promise<ActionResult> {
  if (!secret || formData.get('website')) return failure
  const submissionId = formData.get('submissionId')
  if (
    typeof submissionId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)
  )
    return failure
  const parsed = parseContactInput(formData)
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      ),
    }

  const hash = (value: string) => createHmac('sha256', secret).update(value).digest('hex')
  const payloadDigest = hash(JSON.stringify(parsed.data))
  try {
    const drizzle = payload.db.drizzle
    // The global gate bounds identity-bucket growth even when attackers rotate addresses.
    // Rate limiting precedes duplicate lookup so repeated IDs cannot bypass abuse controls.
    const limits = [
      { key: hash(`network:${network}`), limit: 5 },
      { key: hash(`email:${parsed.data.email.toLowerCase()}`), limit: 3 },
    ].sort((a, b) => a.key.localeCompare(b.key))
    const rows = sql.join(
      limits.map((item) => sql`(${item.key}::varchar, ${item.limit}::integer)`),
      sql`, `,
    )
    const result = await drizzle.execute(sql`
      WITH global_gate AS (
        INSERT INTO contact_intake_rate_limits (key, count, expires_at)
        VALUES (${hash('global')}, 1, now() + interval '10 minutes')
        ON CONFLICT (key) DO UPDATE SET
          count = CASE WHEN contact_intake_rate_limits.expires_at <= now() THEN 1 ELSE contact_intake_rate_limits.count + 1 END,
          expires_at = CASE WHEN contact_intake_rate_limits.expires_at <= now() THEN now() + interval '10 minutes' ELSE contact_intake_rate_limits.expires_at END
        WHERE contact_intake_rate_limits.expires_at <= now() OR contact_intake_rate_limits.count < 100
        RETURNING key
      ), requested(key, maximum) AS (VALUES ${rows}), admitted AS (
        INSERT INTO contact_intake_rate_limits (key, count, expires_at)
        SELECT key, 1, now() + interval '10 minutes' FROM requested WHERE EXISTS (SELECT 1 FROM global_gate) ORDER BY key
        ON CONFLICT (key) DO UPDATE SET
          count = CASE WHEN contact_intake_rate_limits.expires_at <= now() THEN 1 ELSE contact_intake_rate_limits.count + 1 END,
          expires_at = CASE WHEN contact_intake_rate_limits.expires_at <= now() THEN now() + interval '10 minutes' ELSE contact_intake_rate_limits.expires_at END
        WHERE contact_intake_rate_limits.expires_at <= now() OR contact_intake_rate_limits.count < (SELECT maximum FROM requested WHERE requested.key = contact_intake_rate_limits.key)
        RETURNING key
      ) SELECT ((SELECT count(*) FROM admitted) + (SELECT count(*) FROM global_gate))::integer AS admitted
    `)
    if (result.rows[0]?.admitted !== 3)
      return {
        ok: false,
        formError: 'Too many attempts. Please wait ten minutes or contact us directly.',
      }
    await drizzle.execute(
      sql`DELETE FROM contact_intake_rate_limits WHERE expires_at <= now() AND key IN (SELECT key FROM contact_intake_rate_limits WHERE expires_at <= now() ORDER BY expires_at LIMIT 100)`,
    )

    const existing = await payload.find({
      collection: 'contact-enquiries',
      where: { submissionId: { equals: submissionId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs[0])
      return existing.docs[0].payloadDigest === payloadDigest ? { ok: true } : failure
    try {
      const saved = await payload.create({
        collection: 'contact-enquiries',
        data: {
          ...parsed.data,
          submissionId,
          payloadDigest,
          source: 'contact-page',
          status: 'new',
          notificationStatus: 'pending',
        },
        overrideAccess: true,
      })
      // Only the successful creator owns notification; duplicate retries never resend.
      // Persistence is authoritative even if the notification adapter unexpectedly throws.
      try {
        await notify(payload, { ...parsed.data, id: saved.id })
      } catch {
        /* Saved successfully. */
      }
      return { ok: true }
    } catch {
      // A concurrent identical retry may win the unique insert; acknowledge only its exact payload.
      const retry = await payload.find({
        collection: 'contact-enquiries',
        where: { submissionId: { equals: submissionId } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      return retry.docs[0]?.payloadDigest === payloadDigest ? { ok: true } : failure
    }
  } catch {
    return failure
  }
}
