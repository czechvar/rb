import React from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { checkoutEnabled } from '@/lib/checkout/feature'
import { FormBanner } from '@/components/forms/FormBanner'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountPage } from './AccountPage'
import styles from './account.module.css'

export const metadata = { title: 'Account — Rockbusters' }

const counted = (count: number, one: string, many: string, none: string) =>
  count === 0 ? none : `${count} ${count === 1 ? one : many}`

function LinkPanel({
  title,
  href,
  action,
  children,
}: {
  title: string
  href: string
  action: string
  children: React.ReactNode
}) {
  return (
    <section className={`${checkout.panel} ${styles.linkPanel}`}>
      <h2 data-type="card-lg">{title}</h2>
      {children}
      <Link className={`btn-ghost ${checkout.button} ${styles.panelAction}`} href={href}>
        {action}
      </Link>
    </section>
  )
}

export default async function AccountOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ ['password-reset']?: string }>
}) {
  const sp = await searchParams
  const user = (await getCurrentUser())!
  const payload = await getPayloadClient()
  const reservationsOn = checkoutEnabled()
  const mine = { where: { user: { equals: user.id } }, user, overrideAccess: false }
  const [orders, reservations] = await Promise.all([
    payload.count({ collection: 'orders', ...mine }),
    reservationsOn ? payload.count({ collection: 'checkouts', ...mine }) : null,
  ])
  const addressCount = user.addresses?.length ?? 0
  const firstName = user.name.trim().split(/\s+/)[0]
  return (
    <AccountPage
      title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
      lead="Your trips, orders and details in one place."
    >
      {sp['password-reset'] === '1' && (
        <FormBanner kind="success">Password changed. You&apos;re signed in.</FormBanner>
      )}
      <div className={styles.panelGrid}>
        {reservations && (
          <LinkPanel title="Trip reservations" href="/account/checkouts" action="View reservations">
            <p className={checkout.muted}>
              {counted(reservations.totalDocs, 'reservation', 'reservations', 'No reservations yet.')}
            </p>
          </LinkPanel>
        )}
        <LinkPanel title="Orders" href="/account/orders" action="View orders">
          <p className={checkout.muted}>
            {counted(orders.totalDocs, 'order', 'orders', 'No orders yet.')}
          </p>
        </LinkPanel>
        <LinkPanel title="Your details" href="/account/profile" action="Edit details">
          <p>{user.name}</p>
          <p className={checkout.muted}>{[user.email, user.phone].filter(Boolean).join(' · ')}</p>
        </LinkPanel>
        <LinkPanel title="Addresses" href="/account/addresses" action="Manage addresses">
          <p className={checkout.muted}>
            {counted(addressCount, 'address on file', 'addresses on file', 'No addresses on file.')}
          </p>
        </LinkPanel>
      </div>
    </AccountPage>
  )
}
