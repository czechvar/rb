import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  reserve: vi.fn(),
  reserveReview: vi.fn(),
  quote: vi.fn(),
  DiscountUnavailableError: class DiscountUnavailableError extends Error {},
}))

vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.currentUser }))
vi.mock('@/lib/checkout/feature', () => ({ checkoutEnabled: () => true }))
vi.mock('@/lib/checkout/quote', () => ({
  quoteCart: mocks.quote,
  DiscountUnavailableError: mocks.DiscountUnavailableError,
}))
vi.mock('@/lib/checkout/reservations', () => ({
  cancelCheckout: vi.fn(),
  reserveCheckout: mocks.reserve,
  reserveCheckoutForReview: mocks.reserveReview,
  updateCheckoutBilling: vi.fn(),
}))
vi.mock('@/payments/checkout-payment-service', () => ({ beginCheckoutPayment: vi.fn() }))

import {
  quoteCartAction,
  reserveCheckoutAction,
  reserveCheckoutForReviewAction,
} from '@/app/(frontend)/checkout/actions'

beforeEach(() => vi.clearAllMocks())

it('flags a rejected discount code so the cart can drop it, but not other pricing failures', async () => {
  const input = { items: [{ eventDateId: 1, quantity: 1 }], discountCode: 'EXPIRED' }
  mocks.quote.mockRejectedValueOnce(new mocks.DiscountUnavailableError())
  await expect(quoteCartAction(input)).resolves.toMatchObject({
    ok: false,
    discountRejected: true,
  })

  mocks.quote.mockRejectedValueOnce(new Error('A selected trip is no longer available.'))
  const soldOut = await quoteCartAction(input)
  expect(soldOut.ok).toBe(false)
  expect('discountRejected' in soldOut).toBe(false)
})

it('reuses a saved address for a signed-in customer without purchase history', async () => {
  const user = {
    id: 7,
    name: 'Ada Lovelace',
    email: 'ada@example.test',
    phone: '+420123456789',
    addresses: [
      {
        firstName: 'Ada',
        lastName: 'Lovelace',
        street: 'Saved street 1',
        city: 'Prague',
        postalCode: '11000',
        country: 'Czechia',
        isDefault: true,
      },
    ],
  }
  mocks.currentUser.mockResolvedValue(user)
  mocks.reserve.mockResolvedValue({ id: 42 })
  const data = new FormData()
  data.set('submissionKey', 'ecd1649c-42ca-47a9-99f6-b3f20d5a59f3')
  data.set('items', JSON.stringify([{ eventDateId: 1, quantity: 1 }]))

  await expect(reserveCheckoutAction(null, data)).resolves.toEqual({
    ok: true,
    redirect: '/account/checkouts/42',
  })
  expect(mocks.reserve).toHaveBeenCalledWith(
    expect.objectContaining({
      billingAddress: expect.objectContaining({
        firstName: 'Ada',
        street: 'Saved street 1',
        country: 'Czechia',
      }),
    }),
    user,
  )
})

it('keeps an authenticated reserve-now checkout in staff review', async () => {
  const user = {
    id: 7,
    name: 'Ada Lovelace',
    email: 'ada@example.test',
    phone: '+420123456789',
    addresses: [],
  }
  mocks.currentUser.mockResolvedValue(user)
  mocks.reserveReview.mockResolvedValue({ id: 43 })
  const data = new FormData()
  data.set('submissionKey', 'ecd1649c-42ca-47a9-99f6-b3f20d5a59f3')
  data.set('items', JSON.stringify([{ eventDateId: 1, quantity: 1 }]))

  await expect(reserveCheckoutForReviewAction(null, data)).resolves.toEqual({
    ok: true,
    redirect: '/account/checkouts/43',
  })
  expect(mocks.reserveReview).toHaveBeenCalledWith(expect.any(Object), user)
  expect(mocks.reserve).not.toHaveBeenCalled()
})
