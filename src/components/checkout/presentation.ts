import type { CheckoutItem, CheckoutQuote } from '@/lib/checkout/types'

/** Fields customers need to review/payment; internal commission and attribution data stays server-side. */
export type CheckoutDisplayItem = Pick<
  CheckoutItem,
  | 'eventDateId'
  | 'quantity'
  | 'title'
  | 'dateFrom'
  | 'dateTo'
  | 'currency'
  | 'unitMinor'
  | 'totalMinor'
  | 'totalCzkMinor'
  | 'depositMinor'
  | 'depositCzkMinor'
  | 'balanceDueAt'
  | 'paidMinor'
  | 'paidCzkMinor'
>
export type CheckoutDisplayQuote = Omit<CheckoutQuote, 'items'> & { items: CheckoutDisplayItem[] }
export function checkoutDisplayItem(item: CheckoutItem): CheckoutDisplayItem {
  return {
    eventDateId: item.eventDateId,
    quantity: item.quantity,
    title: item.title,
    dateFrom: item.dateFrom,
    dateTo: item.dateTo,
    currency: item.currency,
    unitMinor: item.unitMinor,
    totalMinor: item.totalMinor,
    totalCzkMinor: item.totalCzkMinor,
    depositMinor: item.depositMinor,
    depositCzkMinor: item.depositCzkMinor,
    balanceDueAt: item.balanceDueAt,
    paidMinor: item.paidMinor,
    paidCzkMinor: item.paidCzkMinor,
  }
}
