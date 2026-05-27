'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { confirmEmailChangeTemplate } from '@/lib/email/templates'
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

  // Email-change branch — pessimistic. Keep old email until new is confirmed.
  const currentPassword = parsed.data.currentPassword as string

  // Re-auth.
  try {
    await payload.login({
      collection: 'users',
      data: { email: user.email, password: currentPassword },
    })
  } catch {
    return { ok: false, fieldErrors: { currentPassword: 'Incorrect password.' } }
  }

  // Reject if the new email is already in use by another user.
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })
  if (existing.docs[0] && String(existing.docs[0].id) !== String(user.id)) {
    return { ok: false, fieldErrors: { email: 'That email is already in use.' } }
  }

  const token = crypto.randomBytes(20).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      name,
      phone,
      pendingEmail: email,
      pendingEmailToken: token,
      pendingEmailExpiresAt: expiresAt,
    },
    overrideAccess: true,
  })
  await payload.sendEmail({
    to: email,
    subject: 'Confirm your new Rockbusters email',
    html: confirmEmailChangeTemplate({ token, name: user.name }),
  })
  revalidatePath('/account/profile')
  return { ok: true }
}

export async function cancelPendingEmailChangeAction(): Promise<void> {
  const user = await requireUser()
  const payload = await getPayloadClient()
  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      pendingEmail: null,
      pendingEmailToken: null,
      pendingEmailExpiresAt: null,
    },
    overrideAccess: true,
  })
  revalidatePath('/account/profile')
}
