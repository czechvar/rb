'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import type { ActionResult } from '@/components/forms/action-result'
import { registerSchema } from './schema'

export async function registerAction(_p: ActionResult, formData: FormData): Promise<ActionResult> {
  // Echo of submitted values for repopulating the form on error. Password
  // is intentionally excluded — never round-trip secrets.
  const echo: Record<string, string> = {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
  }

  const parsed = registerSchema.safeParse({
    name: echo.name,
    email: echo.email,
    phone: echo.phone,
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
  })
  if (!parsed.success) {
    return {
      ok: false,
      values: echo,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path[0] as string, i.message]),
      ),
    }
  }
  const { name, email, phone, password } = parsed.data

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit({ key: `register:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 })
  if (!rl.ok) {
    return {
      ok: false,
      values: echo,
      formError: 'Too many attempts. Please try again in a few minutes.',
    }
  }

  const payload = await getPayloadClient()
  try {
    // overrideAccess bypasses Users.role's field-level update access (which
    // is isAdmin) — the action is a trusted server context and we want to
    // explicitly stamp the role on registration.
    await payload.create({
      collection: 'users',
      data: { name, email, phone, password, role: 'customer' },
      overrideAccess: true,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Match real duplicate-email markers only. The previous catch-all
    // `/email/i` clause misclassified unrelated failures (e.g. Resend
    // rejecting the recipient when sending from onboarding@resend.dev) as
    // "email already exists".
    const isDuplicate =
      /already exists|already in use|duplicate|unique constraint|23505/i.test(msg)
    if (isDuplicate) {
      return {
        ok: false,
        values: echo,
        fieldErrors: { email: 'An account with this email already exists.' },
      }
    }
    // Surface the real cause to the server log — silent failures here have
    // burned us before (sandbox Resend, broken DB connection, etc.).
    console.error('[register] payload.create failed:', err)
    return { ok: false, values: echo, formError: 'Something went wrong. Please try again.' }
  }

  redirect(`/verify-email/pending?email=${encodeURIComponent(email)}`)
}
