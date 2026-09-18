import type { Order } from '@/payload-types'
import { tripPlainTitle } from '@/lib/trip-card-content'
import { date, money } from '@/components/checkout/format'

export const ORDER_STATE_LABEL: Record<Order['state'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  paid: 'Paid',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const populatedEventDate = (order: Pick<Order, 'eventDate'>) =>
  typeof order.eventDate === 'object' && order.eventDate ? order.eventDate : null

/** The authored trip name, from the same Event → Trip Variant → Event Date chain the cart uses. */
export function orderTripTitle(order: Pick<Order, 'eventDate'>): string {
  const eventDate = populatedEventDate(order)
  const event = eventDate && typeof eventDate.event === 'object' ? eventDate.event : null
  return event && eventDate ? tripPlainTitle(event, eventDate) : 'Trip'
}

export function orderDateRange(order: Pick<Order, 'eventDate'>): string {
  const eventDate = populatedEventDate(order)
  return eventDate ? `${date(eventDate.dateFrom)} – ${date(eventDate.dateTo)}` : ''
}

/** Orders store prices in major units; the checkout formatter takes minor units. */
export const orderMoney = (major: number, currency: Order['currency']) =>
  money(Math.round(major * 100), currency)
