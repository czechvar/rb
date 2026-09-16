// src/app/(frontend)/(auth)/login/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { authenticateWithPassword } from '@/lib/password-login'
import { sanitizeRedirect } from '@/lib/redirect'
import type { ActionResult } from '@/components/forms/action-result'

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const authenticated = await authenticateWithPassword({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!authenticated.ok) return authenticated
  const from = formData.get('from')
  const target = sanitizeRedirect(typeof from === 'string' ? from : undefined) ?? '/account'
  redirect(target)
}
