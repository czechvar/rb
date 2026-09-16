import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  reserve: vi.fn(),
}))

vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.currentUser }))
vi.mock('@/lib/checkout/feature', () => ({ checkoutEnabled: () => true }))
vi.mock('@/lib/checkout/quote', () => ({ quoteCart: vi.fn() }))
vi.mock('@/lib/checkout/reservations', () => ({
  cancelCheckout: vi.fn(),
  reserveCheckout: mocks.reserve,
  updateCheckoutBilling: vi.fn(),
}))
vi.mock('@/payments/checkout-payment-service', () => ({ beginCheckoutPayment: vi.fn() }))

import { reserveCheckoutAction } from '@/app/(frontend)/checkout/actions'

beforeEach(() => vi.clearAllMocks())

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
