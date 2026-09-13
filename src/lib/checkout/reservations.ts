import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type { Payload, PayloadRequest } from 'payload'
import type { User } from '@/payload-types'
import { isAdminUser } from '@/access'
import { getPayloadClient } from '../payload'
import { quoteCart } from './quote'
import { normalizeCart } from './pricing'
import {
  lockCheckout,
  lockEventDates,
  lockSubmission,
  withCheckoutTransaction,
} from './transaction'
import type { CartItem, CheckoutContact, CheckoutItem, CheckoutRecord } from './types'

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-()]{6,20}$/),
})
const billingSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  street: z.string().trim().min(1).max(250),
  city: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(1).max(30),
  country: z.string().trim().min(1).max(100),
})
export function validateCheckoutContact(contact: CheckoutContact) {
  const result = contactSchema.safeParse(contact)
  if (!result.success) throw new Error('Enter your name, a valid email and phone number.')
  return result.data
}
export function validateCheckoutBilling(value: unknown) {
  const result = billingSchema.safeParse(value)
  if (!result.success) throw new Error('Complete your billing details before payment.')
  return result.data
}
export function checkoutOwner(record: CheckoutRecord, user: User) {
  return (typeof record.user === 'object' ? record.user?.id : record.user) === user.id
}
export async function isReturningPurchaser(
  payload: Payload,
  user: User,
  req?: PayloadRequest,
): Promise<boolean> {
  const orders = await payload.find({
    collection: 'orders',
    where: { and: [{ user: { equals: user.id } }, { state: { in: ['paid', 'completed'] } }] },
    limit: 1,
    depth: 0,
    req,
    overrideAccess: true,
  })
  if (orders.docs.length) return true
  const checkouts = await payload.find({
    collection: 'checkouts',
    where: { and: [{ user: { equals: user.id } }, { state: { in: ['approved', 'reserved'] } }] },
    limit: 0,
    pagination: false,
    depth: 0,
    req,
    overrideAccess: true,
  })
  return checkouts.docs.some((doc) =>
    (doc.items as CheckoutItem[]).some(
      (item) =>
        !item.cancelledAt &&
        (item.paidMinor > item.refundedMinor || item.paidCzkMinor > item.refundedCzkMinor),
    ),
  )
}
async function writeBookings(
  req: PayloadRequest,
  checkout: CheckoutRecord,
  items: CheckoutItem[],
): Promise<CheckoutItem[]> {
  const output: CheckoutItem[] = []
  for (const [index, item] of items.entries()) {
    const order = await req.payload.create({
      collection: 'orders',
      req,
      overrideAccess: true,
      data: {
        checkout: checkout.id,
        orderNumber: `${checkout.reference}-${index + 1}`,
        user: typeof checkout.user === 'object' ? checkout.user?.id : checkout.user,
        eventDate: item.eventDateId,
        participants: [],
        participantCount: item.quantity,
        ...(checkout.billingAddress ? { billingAddress: checkout.billingAddress } : {}),
        unitPrice: item.unitMinor / 100,
        unitPriceCzk: item.totalCzkMinor == null ? null : item.totalCzkMinor / 100 / item.quantity,
        totalPrice: item.totalMinor / 100,
        totalPriceCzk: item.totalCzkMinor == null ? null : item.totalCzkMinor / 100,
        vat: item.vat,
        currency: item.currency,
        state: 'pending',
        discountCode: item.discountCodeId,
        referral: item.referralId,
        discountAmount: item.discountMinor / 100,
        discountCommission: item.discountCommissionMinor / 100,
        referralCommission: item.referralCommissionMinor / 100,
      } as never,
    })
    output.push({ ...item, orderId: order.id })
  }
  return output
}
export async function reserveCheckout(
  input: {
    submissionKey: string
    contact: CheckoutContact
    items: CartItem[]
    billingAddress?: Record<string, unknown>
    discountCode?: string
    referralCode?: string
  },
  user: User,
): Promise<CheckoutRecord> {
  if (!z.string().uuid().safeParse(input.submissionKey).success)
    throw new Error('Invalid checkout request.')
  const payload = await getPayloadClient()
  if (!user._verified || !(await isReturningPurchaser(payload, user)))
    throw new Error('Please submit your first reservation for review.')
  const contact = validateCheckoutContact({ ...input.contact, email: user.email }),
    billingAddress = validateCheckoutBilling(input.billingAddress)
  const selected = normalizeCart(input.items)
  const digest = createHash('sha256')
    .update(
      JSON.stringify({
        user: user.id,
        contact,
        selected,
        billingAddress,
        discountCode: input.discountCode ?? '',
        referralCode: input.referralCode ?? '',
      }),
    )
    .digest('hex')
  return withCheckoutTransaction(payload, async (req) => {
    await lockSubmission(req, input.submissionKey)
    const prior = await payload.find({
      collection: 'checkouts',
      where: { submissionKey: { equals: input.submissionKey } },
      limit: 1,
      req,
      overrideAccess: true,
      depth: 0,
    })
    if (prior.docs[0]) {
      const existing = prior.docs[0] as unknown as CheckoutRecord
      if (existing.requestDigest !== digest || !checkoutOwner(existing, user))
        throw new Error('This request has already been used. Refresh your cart.')
      return existing
    }
    await lockEventDates(
      req,
      selected.map((item) => item.eventDateId),
    )
    const quote = await quoteCart({ ...input, items: selected }, req)
    const checkout = (await payload.create({
      collection: 'checkouts',
      req,
      overrideAccess: true,
      data: {
        reference: `RB-C-${randomUUID()}`,
        submissionKey: input.submissionKey,
        requestDigest: digest,
        state: 'reserved',
        customerKind: 'returning',
        user: user.id,
        contact,
        billingAddress,
        items: quote.items,
        currency: quote.currency,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        verifiedAt: new Date().toISOString(),
      } as never,
    })) as unknown as CheckoutRecord
    const items = await writeBookings(req, checkout, quote.items)
    return (await payload.update({
      collection: 'checkouts',
      id: checkout.id,
      req,
      overrideAccess: true,
      data: { items } as never,
    })) as unknown as CheckoutRecord
  })
}
export async function activateGuestReservation(
  checkoutId: number,
  verificationHash: string,
): Promise<CheckoutRecord> {
  const payload = await getPayloadClient()
  return withCheckoutTransaction(payload, async (req) => {
    await lockCheckout(req, checkoutId)
    const checkout = (await payload.findByID({
      collection: 'checkouts',
      id: checkoutId,
      depth: 0,
      req,
      overrideAccess: true,
    })) as unknown as CheckoutRecord
    const expected = Buffer.from(checkout.verificationHash ?? ''),
      actual = Buffer.from(verificationHash)
    if (
      !expected.length ||
      actual.length !== expected.length ||
      !timingSafeEqual(expected, actual) ||
      !checkout.verificationExpiresAt ||
      new Date(checkout.verificationExpiresAt) <= new Date()
    )
      throw new Error('This verification link has expired or is invalid.')
    if (checkout.state !== 'unverified')
      throw new Error('This verification link has already been used.')
    const selected = normalizeCart(checkout.items)
    await lockEventDates(
      req,
      selected.map((item) => item.eventDateId),
    )
    const quote = await quoteCart(
      {
        items: selected,
        discountCode: checkout.discountCode ?? undefined,
        referralCode: checkout.referralCode ?? undefined,
      },
      req,
    )
    const items = await writeBookings(req, checkout, quote.items)
    return (await payload.update({
      collection: 'checkouts',
      id: checkout.id,
      req,
      overrideAccess: true,
      data: {
        state: 'awaitingReview',
        items,
        currency: quote.currency,
        verifiedAt: new Date().toISOString(),
        verificationHash: null,
        verificationExpiresAt: null,
        expiresAt: null,
      } as never,
    })) as unknown as CheckoutRecord
  })
}
/** Caller holds the checkout lock. Financial reconciliation precedes expiry. */
export async function cancelCheckoutInTransaction(
  req: PayloadRequest,
  checkout: CheckoutRecord,
  reason = 'Cancelled by staff',
  state: 'cancelled' | 'expired' = 'cancelled',
  eventDateIds?: number[],
): Promise<void> {
  if (checkout.state === 'cancelled' || checkout.state === 'expired') return
  if (
    eventDateIds &&
    (!eventDateIds.length ||
      new Set(eventDateIds).size !== eventDateIds.length ||
      eventDateIds.some((id) => !checkout.items.some((item) => item.eventDateId === id)))
  )
    throw new Error('Invalid trip selection.')
  const selected = checkout.items.filter(
    (item) => !eventDateIds || eventDateIds.includes(item.eventDateId),
  )
  await lockEventDates(
    req,
    selected.map((item) => item.eventDateId),
  )
  for (const item of selected)
    if (item.orderId) {
      const order = await req.payload.findByID({
        collection: 'orders',
        id: item.orderId,
        req,
        depth: 0,
        overrideAccess: true,
      })
      if (order.state === 'completed')
        throw new Error('Completed bookings require staff reconciliation.')
      if (order.state !== 'cancelled')
        await req.payload.update({
          collection: 'orders',
          id: item.orderId,
          req,
          overrideAccess: true,
          data: { state: 'cancelled' },
        })
    }
  await req.payload.update({
    collection: 'checkouts',
    id: checkout.id,
    req,
    overrideAccess: true,
    data: {
      items: checkout.items.map((item) =>
        selected.some((row) => row.eventDateId === item.eventDateId)
          ? {
              ...item,
              cancelledAt: item.cancelledAt ?? new Date().toISOString(),
              cancellationReason: reason,
            }
          : item,
      ),
      state: checkout.items.every(
        (item) => item.cancelledAt || selected.some((row) => row.eventDateId === item.eventDateId),
      )
        ? state
        : checkout.state,
      reconciliationReason: reason,
      expiresAt: checkout.items.every(
        (item) => item.cancelledAt || selected.some((row) => row.eventDateId === item.eventDateId),
      )
        ? null
        : checkout.expiresAt,
    },
  })
}
export async function cancelCheckout(
  checkoutId: number,
  actor: User,
  reason?: string,
): Promise<void> {
  const payload = await getPayloadClient()
  await withCheckoutTransaction(payload, async (req) => {
    await lockCheckout(req, checkoutId)
    const checkout = (await payload.findByID({
      collection: 'checkouts',
      id: checkoutId,
      depth: 0,
      req,
      overrideAccess: true,
    })) as unknown as CheckoutRecord
    if (!isAdminUser(actor) && !checkoutOwner(checkout, actor))
      throw new Error('Reservation not found.')
    if (checkout.items.some((item) => item.paidMinor > 0 || item.paidCzkMinor > 0))
      throw new Error('Paid bookings require staff refund reconciliation.')
    const transactions = await payload.find({
      collection: 'transactions',
      where: {
        and: [
          { checkout: { equals: checkout.id } },
          { state: { in: ['created', 'begun', 'pending-payment'] } },
        ],
      },
      limit: 1,
      req,
      overrideAccess: true,
    })
    if (transactions.docs.length) throw new Error('Payment must be reconciled before cancellation.')
    await cancelCheckoutInTransaction(req, checkout, reason)
  })
}

export async function updateCheckoutBilling(
  checkoutId: number,
  user: User,
  value: unknown,
): Promise<void> {
  const billingAddress = validateCheckoutBilling(value),
    payload = await getPayloadClient()
  await withCheckoutTransaction(payload, async (req) => {
    await lockCheckout(req, checkoutId)
    const checkout = (await payload.findByID({
      collection: 'checkouts',
      id: checkoutId,
      depth: 0,
      req,
      overrideAccess: true,
    })) as unknown as CheckoutRecord
    if (!checkoutOwner(checkout, user) || !['approved', 'reserved'].includes(checkout.state))
      throw new Error('Reservation not found.')
    if (checkout.items.some((item) => item.paidMinor > 0 || item.paidCzkMinor > 0))
      throw new Error('Contact us to change billing details after payment.')
    const attempts = await payload.find({
      collection: 'transactions',
      where: {
        and: [
          { checkout: { equals: checkout.id } },
          { state: { in: ['created', 'begun', 'pending-payment'] } },
        ],
      },
      limit: 1,
      req,
      overrideAccess: true,
    })
    if (attempts.docs.length)
      throw new Error('Resolve the payment before changing billing details.')
    await payload.update({
      collection: 'checkouts',
      id: checkout.id,
      req,
      overrideAccess: true,
      data: { billingAddress },
    })
    for (const item of checkout.items)
      if (item.orderId)
        await payload.update({
          collection: 'orders',
          id: item.orderId,
          req,
          overrideAccess: true,
          data: { billingAddress },
        })
  })
}
