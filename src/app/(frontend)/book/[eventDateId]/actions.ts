'use server'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult } from '@/components/forms/action-result'
import { bookingSchema } from './schema'

function parseParticipants(formData: FormData) {
  const indices = new Set<number>()
  for (const key of formData.keys()) {
    const m = key.match(/^participants\.(\d+)\./)
    if (m) indices.add(Number(m[1]))
  }
  const sorted = [...indices].sort((a, b) => a - b)
  return sorted.map((i) => ({
    firstName: String(formData.get(`participants.${i}.firstName`) ?? '').trim(),
    lastName: String(formData.get(`participants.${i}.lastName`) ?? '').trim(),
    email: String(formData.get(`participants.${i}.email`) ?? '').trim(),
    phone: String(formData.get(`participants.${i}.phone`) ?? '').trim(),
  }))
}

export async function createBookingAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const eventDateId = Number(formData.get('eventDateId'))
  if (!Number.isFinite(eventDateId)) {
    return { ok: false, formError: 'Bad request.' }
  }

  const parsed = bookingSchema.safeParse({
    participants: parseParticipants(formData),
    addressIndex: formData.get('addressIndex'),
    customerNote: formData.get('customerNote') || undefined,
  })
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path.join('.'), i.message]),
      ),
    }
  }

  const payload = await getPayloadClient()

  const ed = await payload.findByID({ collection: 'event-dates', id: eventDateId, depth: 0 })
  const edObj = ed as {
    active?: boolean; price: number; vat: number; currency: 'EUR' | 'CZK'
  }
  if (!edObj.active) {
    return { ok: false, formError: 'This date is no longer available.' }
  }
  const addresses = (user.addresses ?? []) as Array<Record<string, unknown>>
  const chosen = addresses[parsed.data.addressIndex]
  if (!chosen) {
    return { ok: false, fieldErrors: { addressIndex: 'Select a valid address.' } }
  }
  const billingAddress = {
    firstName: chosen.firstName, lastName: chosen.lastName, street: chosen.street,
    city: chosen.city, postalCode: chosen.postalCode, country: chosen.country,
    company: chosen.company,
  }

  let newOrderId: number | string
  try {
    const order = await payload.create({
      collection: 'orders',
      data: {
        user: user.id,
        eventDate: eventDateId,
        participants: parsed.data.participants,
        billingAddress,
        unitPrice: edObj.price,
        vat: edObj.vat,
        currency: edObj.currency,
        state: 'pending',
        customerNote: parsed.data.customerNote,
      } as never,
      user,
      overrideAccess: false,
    })
    newOrderId = order.id
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Booking failed. Please try again.'
    return { ok: false, formError: msg }
  }
  redirect(`/book/${eventDateId}/confirmation/${newOrderId}`)
}
