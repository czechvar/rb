import type { CheckoutItem, CheckoutMethod, CheckoutRecord } from '@/lib/checkout/types'

export type PaymentPurpose = 'full' | 'deposit' | 'balance'
export interface PaymentAllocation {
  eventDateId: number
  orderId: number
  amountMinor: number
}
/** Compare ledger meaning, independent of JSONB object-key or array ordering. */
export function sameAllocations(a: PaymentAllocation[] | null | undefined, b: PaymentAllocation[]): boolean {
  if (!a || a.length !== b.length) return false
  const canonical = (rows: PaymentAllocation[]) => rows
    .map(({ eventDateId, orderId, amountMinor }) => [eventDateId, orderId, amountMinor])
    .sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2])
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))
}
export function assertMinor(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid payment amount.')
  return value
}
export function minorDecimal(value: number): string {
  assertMinor(value)
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`
}
export function paymentAllocations(
  checkout: CheckoutRecord,
  method: CheckoutMethod,
  purpose: PaymentPurpose,
  itemIds?: number[],
  now = new Date(),
): PaymentAllocation[] {
  const activeItems = checkout.items.filter((item) => !item.cancelledAt)
  if (!['full', 'deposit', 'balance'].includes(purpose)) throw new Error('Invalid payment purpose.')
  if (checkout.paymentMethod && checkout.paymentMethod !== method)
    throw new Error('Use the original payment method for this checkout.')
  if (
    itemIds &&
    (!itemIds.length ||
      new Set(itemIds).size !== itemIds.length ||
      itemIds.some((id) => !activeItems.some((item) => item.eventDateId === id)))
  )
    throw new Error('Invalid trip selection.')
  const hasSettlement = checkout.items.some((item) => item.paidMinor > 0 || item.paidCzkMinor > 0)
  if (!hasSettlement && activeItems.some((item) => {
    const departure = new Date(item.dateFrom).getTime()
    return !Number.isFinite(departure) || departure <= now.getTime()
  })) throw new Error('A trip has already started. Contact the team before paying this reservation.')
  if (!hasSettlement && itemIds && itemIds.length !== activeItems.length)
    throw new Error('The first payment must cover every trip in this checkout.')
  const selected = activeItems.filter((item) => !itemIds || itemIds.includes(item.eventDateId))
  return selected.flatMap((item) => {
    if (!item.orderId) throw new Error('Checkout has no reservation for this trip.')
    const benefit = method === 'muzapay'
    const total = benefit ? item.totalCzkMinor : item.totalMinor
    const deposit = benefit ? item.depositCzkMinor : item.depositMinor
    if (total === null || deposit === null)
      throw new Error('Benefit+ requires an authored CZK price for every item.')
    const paid = benefit ? item.paidCzkMinor : item.paidMinor
    assertMinor(total)
    assertMinor(deposit)
    assertMinor(paid)
    const due = new Date(item.balanceDueAt)
    if (!Number.isFinite(due.getTime())) throw new Error('Invalid balance due date.')
    const target = purpose === 'deposit' && now < due ? deposit : total
    const amountMinor = Math.max(0, target - paid)
    return amountMinor
      ? [{ eventDateId: item.eventDateId, orderId: item.orderId, amountMinor }]
      : []
  })
}
export function applyAllocations(
  items: CheckoutItem[],
  allocations: PaymentAllocation[],
  method: CheckoutMethod,
): { items: CheckoutItem[]; overpaid: boolean } {
  let overpaid = false
  const next = items.map((item) => ({ ...item }))
  const seen = new Set<number>()
  for (const allocation of allocations) {
    if (seen.has(allocation.eventDateId)) throw new Error('Duplicate transaction allocation.')
    seen.add(allocation.eventDateId)
    const item = next.find(
      (row) => row.eventDateId === allocation.eventDateId && row.orderId === allocation.orderId,
    )
    if (!item) throw new Error('Transaction does not match checkout items.')
    const amount = assertMinor(allocation.amountMinor)
    if (method === 'muzapay') {
      item.paidCzkMinor = assertMinor(item.paidCzkMinor + amount)
      overpaid ||= item.totalCzkMinor === null || item.paidCzkMinor > item.totalCzkMinor
    } else {
      item.paidMinor = assertMinor(item.paidMinor + amount)
      overpaid ||= item.paidMinor > item.totalMinor
    }
  }
  return { items: next, overpaid }
}
export function isFullyPaid(item: CheckoutItem, method: CheckoutMethod): boolean {
  return method === 'muzapay'
    ? item.totalCzkMinor !== null && item.paidCzkMinor >= item.totalCzkMinor
    : item.paidMinor >= item.totalMinor
}
