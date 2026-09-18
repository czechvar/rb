import React from 'react'
import { AccountPage } from '../../AccountPage'
import { AddressForm } from '../AddressForm'
import { addAddressAction } from '../actions'

export const metadata = { title: 'Add address — Rockbusters' }

export default function AddAddressPage() {
  return (
    <AccountPage title="Add address">
      <AddressForm action={addAddressAction} submitLabel="Add address" />
    </AccountPage>
  )
}
