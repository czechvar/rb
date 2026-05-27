import React from 'react'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AddressForm } from '../../AddressForm'
import { updateAddressAction } from '../../actions'
import type { ActionResult } from '@/components/forms/action-result'

export const metadata = { title: 'Edit address — Rockbusters' }

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ idx: string }>
}) {
  const { idx: idxRaw } = await params
  const idx = Number(idxRaw)
  if (!Number.isInteger(idx) || idx < 0) notFound()
  const user = (await getCurrentUser())!
  const address = (user.addresses ?? [])[idx]
  if (!address) notFound()

  async function action(prev: ActionResult, formData: FormData): Promise<ActionResult> {
    'use server'
    return updateAddressAction(idx, prev, formData)
  }

  return (
    <>
      <h1>Edit address</h1>
      <AddressForm initial={address} action={action} submitLabel="Save changes" />
    </>
  )
}
