import React from 'react'
import { deleteAddressAction, setDefaultAddressAction } from './actions'
import styles from './addresses.module.css'
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
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <strong>{address.label ?? `Address ${idx + 1}`}</strong>
        {address.isDefault && <span className={styles.badge}>Default</span>}
      </div>
      <div style={{ marginTop: 8, lineHeight: 1.5 }}>
        {address.firstName} {address.lastName}
        <br />
        {address.street}
        <br />
        {address.postalCode} {address.city}, {address.country}
        {address.company?.companyName && (
          <>
            <br />
            <em style={{ color: '#666' }}>
              {address.company.companyName}
              {address.company.ico && ` · IČO ${address.company.ico}`}
              {address.company.dic && ` · DIČ ${address.company.dic}`}
            </em>
          </>
        )}
      </div>
      <div className={styles.actions}>
        <a className={styles.action} href={`/account/addresses/${idx}/edit`}>
          Edit
        </a>
        {!address.isDefault && (
          <form action={setDefaultBound}>
            <button type="submit" className={styles.action}>
              Set as default
            </button>
          </form>
        )}
        <form action={delBound}>
          <button type="submit" className={`${styles.action} ${styles.danger}`}>
            Delete
          </button>
        </form>
      </div>
    </div>
  )
}
