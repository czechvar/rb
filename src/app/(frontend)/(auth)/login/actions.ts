// src/app/(frontend)/(auth)/login/actions.ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { sanitizeRedirect } from '@/lib/redirect'
import type { ActionResult } from '@/components/forms/action-result'
import { loginSchema } from './schema'

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    from: formData.get('from') ?? undefined,
  })
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path[0] as string, i.message]),
      ),
    }
  }
  const { email, password, from } = parsed.data

  const payload = await getPayloadClient()
  try {
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })
    const token = result.token
    if (!token) {
      return { ok: false, formError: 'Login failed — no token returned.' }
    }
    const c = await cookies()
    c.set('payload-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/verify/i.test(msg) && /(account|email)/i.test(msg)) {
      return { ok: false, formError: `verify_required:${email}` }
    }
    if (/locked/i.test(msg)) {
      return {
        ok: false,
        formError:
          'Account temporarily locked. Try again in ~10 minutes or reset your password.',
      }
    }
    return { ok: false, formError: 'Invalid email or password.' }
  }

  const target = sanitizeRedirect(from) ?? '/account'
  redirect(target)
}
