'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult } from '@/components/forms/action-result'
import { addressSchema } from './schema'
import type { User } from '@/payload-types'

type Address = NonNullable<User['addresses']>[number]

function parseForm(formData: FormData) {
  return addressSchema.safeParse({
    label: formData.get('label') ?? undefined,
    isDefault: formData.get('isDefault') ?? undefined,
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    street: formData.get('street'),
    city: formData.get('city'),
    postalCode: formData.get('postalCode'),
    country: formData.get('country'),
    companyName: formData.get('companyName') ?? undefined,
    ico: formData.get('ico') ?? undefined,
    dic: formData.get('dic') ?? undefined,
  })
}

/** Echo of submitted text values so the form can repopulate on validation error. */
function echoValues(formData: FormData): Record<string, string> {
  return {
    label: String(formData.get('label') ?? ''),
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    street: String(formData.get('street') ?? ''),
    city: String(formData.get('city') ?? ''),
    postalCode: String(formData.get('postalCode') ?? ''),
    country: String(formData.get('country') ?? ''),
    companyName: String(formData.get('companyName') ?? ''),
    ico: String(formData.get('ico') ?? ''),
    dic: String(formData.get('dic') ?? ''),
  }
}

function toAddressRow(data: ReturnType<typeof addressSchema.parse>): Address {
  const row: Address = {
    label: data.label || undefined,
    isDefault: data.isDefault,
    firstName: data.firstName,
    lastName: data.lastName,
    street: data.street,
    city: data.city,
    postalCode: data.postalCode,
    country: data.country,
  }
  if (data.companyName) {
    row.company = {
      companyName: data.companyName,
      ico: data.ico || undefined,
      dic: data.dic || undefined,
    }
  }
  return row
}

function enforceSingleDefault(rows: Address[], newDefaultIdx: number | null): Address[] {
  if (newDefaultIdx === null) return rows
  return rows.map((r, i) => ({ ...r, isDefault: i === newDefaultIdx }))
}

export async function addAddressAction(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return {
      ok: false,
      values: echoValues(formData),
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
      ),
    }
  }
  const payload = await getPayloadClient()
  const newRow = toAddressRow(parsed.data)
  let next: Address[] = [...(user.addresses ?? []), newRow]
  if (newRow.isDefault) {
    next = enforceSingleDefault(next, next.length - 1)
  } else if (next.length === 1) {
    next[0] = { ...next[0], isDefault: true }
  }
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { addresses: next },
    overrideAccess: false,
    user,
  })
  redirect('/account/addresses')
}

export async function updateAddressAction(
  idx: number,
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return {
      ok: false,
      values: echoValues(formData),
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
      ),
    }
  }
  const payload = await getPayloadClient()
  const existing = user.addresses ?? []
  if (idx < 0 || idx >= existing.length) {
    return { ok: false, values: echoValues(formData), formError: 'Address not found.' }
  }
  const updatedRow = toAddressRow(parsed.data)
  let next: Address[] = existing.map((r, i) =>
    i === idx ? { ...updatedRow, id: r.id } : r,
  )
  if (updatedRow.isDefault) next = enforceSingleDefault(next, idx)
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { addresses: next },
    overrideAccess: false,
    user,
  })
  redirect('/account/addresses')
}

export async function deleteAddressAction(idx: number): Promise<void> {
  const user = await requireUser()
  const payload = await getPayloadClient()
  const existing = user.addresses ?? []
  if (idx < 0 || idx >= existing.length) return
  const wasDefault = existing[idx].isDefault
  const next = existing.filter((_, i) => i !== idx)
  if (wasDefault && next.length > 0) {
    next[0] = { ...next[0], isDefault: true }
  }
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { addresses: next },
    overrideAccess: false,
    user,
  })
  revalidatePath('/account/addresses')
}

export async function setDefaultAddressAction(idx: number): Promise<void> {
  const user = await requireUser()
  const payload = await getPayloadClient()
  const existing = user.addresses ?? []
  if (idx < 0 || idx >= existing.length) return
  const next = enforceSingleDefault(existing, idx)
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { addresses: next },
    overrideAccess: false,
    user,
  })
  revalidatePath('/account/addresses')
}
