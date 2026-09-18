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

/**
 * Page title for an order. Short on purpose: the h1 is display size, where an authored trip name
 * runs to five lines, so the name lives in "Your trip" as it does on the reservation page.
 */
export const ORDER_TITLE: Record<Order['state'], string> = {
  pending: 'Booking received',
  confirmed: 'Booking confirmed',
  paid: 'Booking paid',
  completed: 'Trip completed',
  cancelled: 'Booking cancelled',
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
