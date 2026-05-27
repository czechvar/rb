import React from 'react'
import { AddressForm } from '../AddressForm'
import { addAddressAction } from '../actions'

export const metadata = { title: 'Add address — Rockbusters' }

export default function AddAddressPage() {
  return (
    <>
      <h1>Add address</h1>
      <AddressForm action={addAddressAction} submitLabel="Add address" />
    </>
  )
}
