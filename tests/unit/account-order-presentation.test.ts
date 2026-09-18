import { expect, it } from 'vitest'
import type { Order } from '@/payload-types'
import {
  orderDateRange,
  orderMoney,
  orderTripTitle,
} from '@/app/(frontend)/account/orders/presentation'

it('formats major-unit order prices through the checkout money formatter', () => {
  expect(orderMoney(950, 'EUR')).toBe('€950.00')
  expect(orderMoney(949.99, 'EUR')).toBe('€949.99')
  // 19.99 * 100 is 1998.9999999999998 in floating point.
  expect(orderMoney(19.99, 'EUR')).toBe('€19.99')
  expect(orderMoney(23500, 'CZK')).toBe('CZK\u00a023,500.00')
})

it('degrades to a generic title and no dates when the event date is only an id', () => {
  const order = { eventDate: 9 } as Pick<Order, 'eventDate'>
  expect(orderTripTitle(order)).toBe('Trip')
  expect(orderDateRange(order)).toBe('')
})
