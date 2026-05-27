'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult } from '@/components/forms/action-result'
import { profileSchema } from './schema'

export async function updateProfileAction(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    currentEmail: user.email,
    currentPassword: formData.get('currentPassword') ?? undefined,
  })
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
      ),
    }
  }
  const { name, phone, email } = parsed.data
  const payload = await getPayloadClient()

  if (email === user.email) {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { name, phone },
      overrideAccess: false,
      user,
    })
    revalidatePath('/account/profile')
    return { ok: true }
  }

  // Email-change branch is implemented in Task 21.
  return {
    ok: false,
    formError: 'Email change is being implemented — try again shortly.',
  }
}
