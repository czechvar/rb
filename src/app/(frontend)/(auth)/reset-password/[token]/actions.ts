'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult } from '@/components/forms/action-result'
import { resetSchema } from './schema'

export async function resetPasswordAction(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path[0] as string, i.message]),
      ),
    }
  }
  const { token, password } = parsed.data

  const payload = await getPayloadClient()
  let issuedToken: string | undefined
  try {
    const result = await payload.resetPassword({
      collection: 'users',
      data: { token, password },
      overrideAccess: true,
    })
    issuedToken = result.token
  } catch {
    return {
      ok: false,
      formError: 'This reset link is invalid or has expired. Request a new one.',
    }
  }

  if (issuedToken) {
    const c = await cookies()
    c.set('payload-token', issuedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }
  redirect('/account?password-reset=1')
}
