'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import type { ActionResult } from '@/components/forms/action-result'
import { registerSchema } from './schema'

export async function registerAction(_p: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path[0] as string, i.message]),
      ),
    }
  }
  const { name, email, phone, password } = parsed.data

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit({ key: `register:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 })
  if (!rl.ok) {
    return { ok: false, formError: 'Too many attempts. Please try again in a few minutes.' }
  }

  const payload = await getPayloadClient()
  try {
    await payload.create({
      collection: 'users',
      data: { name, email, phone, password, role: 'customer' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/(already exists|already in use|duplicate)/i.test(msg) || /email/i.test(msg)) {
      return { ok: false, fieldErrors: { email: 'An account with this email already exists.' } }
    }
    return { ok: false, formError: 'Something went wrong. Please try again.' }
  }

  redirect(`/verify-email/pending?email=${encodeURIComponent(email)}`)
}
