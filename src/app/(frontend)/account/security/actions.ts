'use server'

import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult } from '@/components/forms/action-result'
import { changePasswordSchema } from './schema'

export async function changePasswordAction(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
      ),
    }
  }
  const payload = await getPayloadClient()
  try {
    await payload.login({
      collection: 'users',
      data: { email: user.email, password: parsed.data.currentPassword },
    })
  } catch {
    return { ok: false, fieldErrors: { currentPassword: 'Incorrect password.' } }
  }
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { password: parsed.data.password } as never,
    overrideAccess: false,
    user,
  })
  return { ok: true }
}
