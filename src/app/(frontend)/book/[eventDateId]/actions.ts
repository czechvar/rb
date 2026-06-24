'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult } from '@/components/forms/action-result'
import { bookingSchema } from './schema'
import { REFERRAL_COOKIE_NAME } from '@/lib/referral'

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

async function resolveActiveDiscountCode(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  id: number,
): Promise<{ id: number } | null> {
  try {
    const dc = (await payload.findByID({
      collection: 'discount-codes',
      id,
      depth: 0,
    })) as {
      id: number
      active: boolean
      validFrom: string
      validUntil: string
    }
    if (!dc.active) return null
    const today = new Date().toISOString().slice(0, 10)
    if (today < dc.validFrom.slice(0, 10)) return null
    if (today > dc.validUntil.slice(0, 10)) return null
    return { id: dc.id }
  } catch {
    return null
  }
}

async function resolveActiveReferralByCode(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  code: string,
): Promise<{ id: number } | null> {
  const { docs } = await payload.find({
    collection: 'referrals',
    where: { and: [{ code: { equals: code } }, { active: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  const ref = docs[0] as { id: number } | undefined
  return ref ? { id: ref.id } : null
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
    discountCodeId: formData.get('discountCodeId') || undefined,
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

  // Re-validate the discount code id (don't trust the hidden form field).
  let discountCodeId: number | null = null
  if (parsed.data.discountCodeId !== undefined) {
    const dc = await resolveActiveDiscountCode(payload, parsed.data.discountCodeId)
    if (!dc) {
      return {
        ok: false,
        fieldErrors: { discountCodeId: 'This code is no longer valid.' },
      }
    }
    discountCodeId = dc.id
  }

  // Resolve the referral from the cookie (single source of truth — not a hidden form field).
  const cookieJar = await cookies()
  const refCode = cookieJar.get(REFERRAL_COOKIE_NAME)?.value
  let referralId: number | null = null
  if (refCode) {
    const ref = await resolveActiveReferralByCode(payload, refCode.trim().toUpperCase())
    if (ref) referralId = ref.id
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
        discountCode: discountCodeId ?? undefined,
        referral: referralId ?? undefined,
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
