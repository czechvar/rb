'use server'

import { headers } from 'next/headers'
import crypto from 'crypto'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import { verifyEmailTemplate } from '@/lib/email/templates'
import type { ActionResult } from '@/components/forms/action-result'
import { resendSchema } from './schema'

const RESEND_THROTTLE_MS = 60 * 1000

export async function resendVerificationAction(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resendSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { ok: false, fieldErrors: { email: parsed.error.issues[0]?.message ?? 'Invalid email.' } }
  }
  const { email } = parsed.data

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit({ key: `resend:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 })
  if (!rl.ok) {
    return { ok: true }
  }

  const payload = await getPayloadClient()
  const found = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    showHiddenFields: true,
  })
  const user = found.docs[0]
  if (!user || (user as { _verified?: boolean })._verified) {
    return { ok: true }
  }
  const last = (user as { lastVerifyEmailSentAt?: string }).lastVerifyEmailSentAt
  if (last && Date.now() - Date.parse(last) < RESEND_THROTTLE_MS) {
    return { ok: true }
  }

  const token = crypto.randomBytes(20).toString('hex')
  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      _verificationToken: token,
      lastVerifyEmailSentAt: new Date().toISOString(),
    } as never,
    overrideAccess: true,
  })
  await payload.sendEmail({
    to: email,
    subject: 'Welcome to Rockbusters — please verify your email',
    html: verifyEmailTemplate({
      token,
      name: (user as { name?: string }).name ?? 'there',
    }),
  })

  return { ok: true }
}
