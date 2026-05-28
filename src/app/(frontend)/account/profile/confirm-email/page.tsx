import React from 'react'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export const metadata = { title: 'Confirm email — Rockbusters' }

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const user = await requireUser()
  if (!token) {
    return <p>Missing token in URL.</p>
  }
  const payload = await getPayloadClient()
  const found = await payload.find({
    collection: 'users',
    where: { pendingEmailToken: { equals: token } },
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
  })
  const target = found.docs[0]
  if (!target) {
    return <p>This link is invalid.</p>
  }
  if (String(target.id) !== String(user.id)) {
    return <p>This link does not belong to your account.</p>
  }
  const pendingEmail = target.pendingEmail
  const expiresAt = target.pendingEmailExpiresAt
  if (!pendingEmail || !expiresAt || Date.parse(expiresAt) < Date.now()) {
    return <p>This link has expired.</p>
  }
  await payload.update({
    collection: 'users',
    id: target.id,
    data: {
      email: pendingEmail,
      pendingEmail: null,
      pendingEmailToken: null,
      pendingEmailExpiresAt: null,
    },
    overrideAccess: true,
  })
  redirect('/account/profile?email-changed=1')
}
