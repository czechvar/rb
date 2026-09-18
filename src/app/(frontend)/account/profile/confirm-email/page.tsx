import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountPage } from '../../AccountPage'
import styles from '../../account.module.css'

export const metadata = { title: 'Confirm email — Rockbusters' }

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <AccountPage title="Confirm email">
      <div className={checkout.notice}>
        <p className={styles.noticeBody}>{children}</p>
        <div className={checkout.actions}>
          <Link className={`btn-ghost ${checkout.button}`} href="/account/profile">
            Back to your details
          </Link>
        </div>
      </div>
    </AccountPage>
  )
}

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const user = await requireUser()
  if (!token) {
    return <Problem>Missing token in URL.</Problem>
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
    return <Problem>This link is invalid.</Problem>
  }
  if (String(target.id) !== String(user.id)) {
    return <Problem>This link does not belong to your account.</Problem>
  }
  const pendingEmail = target.pendingEmail
  const expiresAt = target.pendingEmailExpiresAt
  // eslint-disable-next-line react-hooks/purity -- server component, runs once per request; current-time expiry check is intended
  if (!pendingEmail || !expiresAt || Date.parse(expiresAt) < Date.now()) {
    return <Problem>This link has expired.</Problem>
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
