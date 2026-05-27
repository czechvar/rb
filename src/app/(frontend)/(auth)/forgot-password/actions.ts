'use server'

import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import type { ActionResult } from '@/components/forms/action-result'
import { forgotSchema } from './schema'

export async function forgotPasswordAction(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const echo = { email: String(formData.get('email') ?? '') }
  const parsed = forgotSchema.safeParse({ email: echo.email })
  if (!parsed.success) {
    return {
      ok: false,
      values: echo,
      fieldErrors: { email: parsed.error.issues[0]?.message ?? 'Invalid email.' },
    }
  }
  const { email } = parsed.data

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit({ key: `forgot:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 })
  if (!rl.ok) {
    return { ok: true }
  }

  const payload = await getPayloadClient()
  try {
    await payload.forgotPassword({ collection: 'users', data: { email } })
  } catch {
    // intentional no-leak
  }
  return { ok: true }
}
