import type { PayloadRequest } from 'payload'
import { getPayloadClient } from '../payload'
import { getRemainingCapacity } from '../capacity'
import type { CheckoutItem, CheckoutQuote, QuoteInput } from './types'
import {
  balanceDeadline,
  discountedMinor,
  initialAmount,
  minorUnits,
  normalizeCart,
} from './pricing'

export async function quoteCart(input: QuoteInput, req?: PayloadRequest): Promise<CheckoutQuote> {
  const cart = normalizeCart(input.items)
  const payload = req?.payload ?? (await getPayloadClient())
  const now = new Date(),
    today = now.toISOString().slice(0, 10)
  let discount:
    | { id: number; discountPercent: number; commissionPercent?: number | null }
    | undefined
  let referral: typeof discount
  if (input.discountCode) {
    const found = await payload.find({
      collection: 'discount-codes',
      where: {
        and: [
          { code: { equals: input.discountCode.trim().toUpperCase() } },
          { active: { equals: true } },
          { validFrom: { less_than_equal: `${today}T23:59:59.999Z` } },
          { validUntil: { greater_than_equal: `${today}T00:00:00.000Z` } },
        ],
      },
      limit: 1,
      depth: 0,
      req,
    })
    discount = found.docs[0]
    if (!discount) throw new Error('This discount code is unavailable.')
  }
  if (input.referralCode) {
    const found = await payload.find({
      collection: 'referrals',
      where: {
        and: [
          { code: { equals: input.referralCode.trim().toUpperCase() } },
          { active: { equals: true } },
        ],
      },
      limit: 1,
      depth: 0,
      req,
    })
    referral = found.docs[0]
  }
  const items: CheckoutItem[] = []
  for (const selected of cart) {
    const ed = await payload.findByID({
      collection: 'event-dates',
      id: selected.eventDateId,
      depth: 1,
      req,
    })
    if (typeof ed.event !== 'object' || ed.event.state !== 'published')
      throw new Error('A selected trip is no longer available.')
    if (!ed.active || new Date(ed.dateFrom) <= now)
      throw new Error('A selected trip is no longer available.')
    const remaining = await getRemainingCapacity(ed.id, { req })
    if (selected.quantity > remaining)
      throw new Error('There are not enough places for a selected trip. Please update your cart.')
    if (ed.currency !== 'EUR' && ed.currency !== 'CZK')
      throw new Error('Unsupported trip currency.')
    const unitMinor = minorUnits(ed.price),
      base = unitMinor * selected.quantity
    const discountMinor = discountedMinor(
      base,
      discount?.discountPercent ?? referral?.discountPercent ?? 0,
    )
    const czkBase = ed.priceCzk == null ? null : minorUnits(ed.priceCzk) * selected.quantity
    const totalMinor = base - discountMinor,
      totalCzkMinor =
        czkBase == null
          ? null
          : czkBase -
            discountedMinor(czkBase, discount?.discountPercent ?? referral?.discountPercent ?? 0)
    const balanceDueAt = balanceDeadline(ed.dateFrom)
    items.push({
      ...selected,
      title: typeof ed.event === 'object' ? ed.event.title : 'Climbing trip',
      dateFrom: ed.dateFrom,
      dateTo: ed.dateTo,
      currency: ed.currency,
      unitMinor,
      totalMinor,
      totalCzkMinor,
      depositMinor: initialAmount(totalMinor, balanceDueAt, now),
      depositCzkMinor:
        totalCzkMinor == null ? null : initialAmount(totalCzkMinor, balanceDueAt, now),
      balanceDueAt,
      vat: ed.vat,
      paidMinor: 0,
      paidCzkMinor: 0,
      refundedMinor: 0,
      refundedCzkMinor: 0,
      discountCodeId: discount?.id,
      referralId: referral?.id,
      discountMinor,
      discountCommissionMinor: discountedMinor(base, discount?.commissionPercent ?? 0),
      referralCommissionMinor: discountedMinor(base, referral?.commissionPercent ?? 0),
    })
  }
  if (items.some((item) => item.currency !== items[0].currency))
    throw new Error('Trips priced in different currencies need separate checkouts.')
  return {
    items,
    currency: items[0].currency,
    totalMinor: items.reduce((sum, item) => sum + item.totalMinor, 0),
    initialMinor: items.reduce((sum, item) => sum + item.depositMinor, 0),
    benefitEligible: items.every((item) => item.totalCzkMinor != null),
  }
}
