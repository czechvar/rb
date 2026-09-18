import React from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountPage } from '../AccountPage'
import styles from '../account.module.css'
import { AddressCard } from './AddressCard'

export const metadata = { title: 'Addresses — Rockbusters' }

export default async function AddressesPage() {
  const user = (await getCurrentUser())!
  const addresses = user.addresses ?? []
  return (
    <AccountPage
      title="Addresses"
      lead="Billing addresses you can reuse when you book."
      actions={
        addresses.length > 0 && (
          <Link className={`btn-ghost ${checkout.button}`} href="/account/addresses/new">
            Add address
          </Link>
        )
      }
    >
      {addresses.length === 0 ? (
        <div className={checkout.notice}>
          <p className={styles.noticeBody}>You haven&apos;t added an address yet.</p>
          <div className={checkout.actions}>
            <Link className={`btn-primary ${checkout.button}`} href="/account/addresses/new">
              Add address
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.panelGrid}>
          {addresses.map((a, idx) => (
            <AddressCard key={a.id ?? idx} idx={idx} address={a} />
          ))}
        </div>
      )}
    </AccountPage>
  )
}
