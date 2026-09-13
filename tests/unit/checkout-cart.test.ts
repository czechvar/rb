import { describe, expect, it } from 'vitest'
import { addCartItem, parseCart } from '@/components/checkout/cart-storage'

describe('selection-only cart', () => {
  it('discards cached prices, personal data, corrupt rows and duplicate dates', () => {
    expect(
      parseCart(
        JSON.stringify([
          { eventDateId: 123, quantity: 2, email: 'person@example.test', unitPrice: 1 },
          { eventDateId: 123, quantity: 3 },
          { eventDateId: -1, quantity: 2 },
          { eventDateId: 456, quantity: 0 },
          { eventDateId: 789, quantity: 100 },
        ]),
      ),
    ).toEqual([
      { eventDateId: 123, quantity: 3 },
      { eventDateId: 789, quantity: 100 },
    ])
    expect(parseCart('not-json')).toEqual([])
    expect(parseCart('{"name":"person"}')).toEqual([])
  })
  it('adding an already-selected date is idempotent across reloads', () => {
    const once = addCartItem([], 123)
    expect(addCartItem(parseCart(JSON.stringify(once)), 123)).toEqual(once)
    expect(addCartItem(once, 456)).toEqual([
      { eventDateId: 123, quantity: 1 },
      { eventDateId: 456, quantity: 1 },
    ])
  })
  it('bounds quantities and unique dates', () => {
    expect(
      parseCart(
        JSON.stringify(
          Array.from({ length: 70 }, (_, index) => ({ eventDateId: index + 1, quantity: 1 })),
        ),
      ),
    ).toHaveLength(50)
    expect(
      parseCart(
        JSON.stringify([
          { eventDateId: 1, quantity: 101 },
          { eventDateId: 2, quantity: 1.5 },
        ]),
      ),
    ).toEqual([])
  })
})

it('projects public quote items without exposing internal commissions or attribution IDs', async () => {
  const { checkoutDisplayItem } = await import('@/components/checkout/presentation')
  const internal = {
    eventDateId: 123,
    quantity: 2,
    title: 'Climbing trip',
    unitMinor: 10000,
    totalMinor: 20000,
    discountCodeId: 7,
    referralId: 8,
    discountCommissionMinor: 1000,
    referralCommissionMinor: 500,
  } as import('@/lib/checkout/types').CheckoutItem
  const publicItem = checkoutDisplayItem(internal)
  expect(publicItem).toMatchObject({ eventDateId: 123, quantity: 2, totalMinor: 20000 })
  for (const name of [
    'discountCodeId',
    'referralId',
    'discountCommissionMinor',
    'referralCommissionMinor',
  ])
    expect(publicItem).not.toHaveProperty(name)
})
