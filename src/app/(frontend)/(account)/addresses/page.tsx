import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { AddressCard } from './AddressCard'
import styles from './addresses.module.css'

export const metadata = { title: 'Addresses — Rockbusters' }

export default async function AddressesPage() {
  const user = (await getCurrentUser())!
  const addresses = user.addresses ?? []
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1>Addresses</h1>
        <a className={styles.action} href="/account/addresses/new">
          Add address
        </a>
      </div>
      {addresses.length === 0 ? (
        <div className={styles.empty}>
          <p>You haven&apos;t added an address yet.</p>
          <p>
            <a href="/account/addresses/new">Add your first address →</a>
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {addresses.map((a, idx) => (
            <AddressCard key={a.id ?? idx} idx={idx} address={a} />
          ))}
        </div>
      )}
    </>
  )
}
