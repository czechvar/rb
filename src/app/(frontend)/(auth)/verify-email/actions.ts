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
  const echo = { email: String(formData.get('email') ?? '') }
  const parsed = resendSchema.safeParse({ email: echo.email })
  if (!parsed.success) {
    return {
      ok: false,
      values: echo,
      fieldErrors: { email: parsed.error.issues[0]?.message ?? 'Invalid email.' },
    }
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
    // overrideAccess defaults to true on Local API, but be explicit so we also
    // get `_verificationToken` back — that field has access.read = defaultAccess
    // which denies unauthenticated callers.
    overrideAccess: true,
  })
  const user = found.docs[0] as
    | undefined
    | {
        id: number | string
        name?: string
        _verified?: boolean
        _verificationToken?: string | null
        lastVerifyEmailSentAt?: string
      }
  if (!user || user._verified) {
    return { ok: true }
  }
  if (
    user.lastVerifyEmailSentAt &&
    Date.now() - Date.parse(user.lastVerifyEmailSentAt) < RESEND_THROTTLE_MS
  ) {
    return { ok: true }
  }

  // Reuse the registration token if present — Payload stores `_verificationToken`
  // raw and doesn't time-limit it, so the original link from registration is
  // still valid for an unverified user. Writes to `_verificationToken` are
  // declined by Payload's base-field access (`update: () => false`) even with
  // `overrideAccess`, so generating a new token here would email a value that
  // never reaches the DB and the verify lookup would 403 as "invalid token".
  let token = user._verificationToken
  if (!token) {
    // Edge case: unverified user with no token. Generate and persist via the
    // base-fields hook channel. If the write is silently rejected the user
    // will retry — we'd rather fail loudly than email a dead link.
    token = crypto.randomBytes(20).toString('hex')
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { _verificationToken: token } as never,
      overrideAccess: true,
    })
  }

  await payload.update({
    collection: 'users',
    id: user.id,
    data: { lastVerifyEmailSentAt: new Date().toISOString() } as never,
    overrideAccess: true,
  })
  await payload.sendEmail({
    to: email,
    subject: 'Welcome to Rockbusters — please verify your email',
    html: verifyEmailTemplate({
      token,
      name: user.name ?? 'there',
    }),
  })

  return { ok: true }
}
