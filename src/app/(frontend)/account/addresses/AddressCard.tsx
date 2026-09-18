import React from 'react'
import Link from 'next/link'
import { deleteAddressAction, setDefaultAddressAction } from './actions'
import checkout from '@/components/checkout/checkout.module.css'
import styles from '../account.module.css'
import type { User } from '@/payload-types'

type Address = NonNullable<User['addresses']>[number]

async function setDefault(idx: number) {
  'use server'
  await setDefaultAddressAction(idx)
}
async function del(idx: number) {
  'use server'
  await deleteAddressAction(idx)
}

export function AddressCard({ idx, address }: { idx: number; address: Address }) {
  const setDefaultBound = setDefault.bind(null, idx)
  const delBound = del.bind(null, idx)
  const company = address.company?.companyName
    ? [
        address.company.companyName,
        address.company.ico && `IČO ${address.company.ico}`,
        address.company.dic && `DIČ ${address.company.dic}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''
  const ghost = `btn-ghost ${checkout.button} ${styles.compactButton}`
  return (
    <section className={checkout.panel}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle} data-type="card-lg">
          {address.label || `Address ${idx + 1}`}
        </h2>
        {address.isDefault && <span className={checkout.statusBadge}>Default</span>}
      </div>
      <address className={styles.addressBody}>
        {address.firstName} {address.lastName}
        <br />
        {address.street}
        <br />
        {address.postalCode} {address.city}, {address.country}
      </address>
      {company && <p className={checkout.muted}>{company}</p>}
      <div className={styles.cardActions}>
        <Link className={ghost} href={`/account/addresses/${idx}/edit`}>
          Edit
        </Link>
        {!address.isDefault && (
          <form action={setDefaultBound}>
            <button type="submit" className={ghost}>
              Set as default
            </button>
          </form>
        )}
        <form action={delBound}>
          <button type="submit" className={ghost}>
            Delete
          </button>
        </form>
      </div>
    </section>
  )
}
