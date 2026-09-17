import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'

vi.mock('@/lib/checkout/feature', () => ({ checkoutEnabled: () => true }))
vi.mock('@/lib/auth', () => ({
  getCurrentUser: async () => ({ id: 9, name: 'Test Customer', email: 'test@example.test' }),
}))
const fixture = vi.hoisted(() => ({
  overrides: {} as Record<string, unknown>,
}))
const baseCheckout = {
  id: 42,
  reference: 'RB-C-42',
  state: 'approved',
  customerKind: 'returning',
  user: 9,
  contact: {
    name: 'Test Customer',
    email: 'test@example.test',
    phone: '+420123456789',
  },
  currency: 'EUR',
  billingAddress: {
    firstName: 'Test',
    lastName: 'Customer',
    street: 'Saved street 1',
    city: 'Prague',
    postalCode: '11000',
    country: 'Czechia',
  },
  items: [
    {
      eventDateId: 123,
      orderId: 456,
      title: 'Test climbing trip',
      dateFrom: '2030-06-01',
      dateTo: '2030-06-08',
      quantity: 1,
      currency: 'EUR',
      unitMinor: 10000,
      totalMinor: 10000,
      depositMinor: 2500,
      paidMinor: 0,
      paidCzkMinor: 0,
      refundedMinor: 0,
      refundedCzkMinor: 0,
      discountMinor: 0,
      discountCommissionMinor: 0,
      referralCommissionMinor: 0,
      balanceDueAt: '2030-05-02',
      vat: 0,
    },
  ],
}
vi.mock('@/lib/payload', () => ({
  getPayloadClient: async () => ({
    find: async () => ({ docs: [{ ...baseCheckout, ...fixture.overrides }] }),
  }),
}))
vi.mock('@/payments/checkout-payment-service', () => ({
  availableCheckoutMethods: () => ({ card: true, benefit: false }),
}))
vi.mock('next/navigation', () => ({ notFound: vi.fn(), redirect: vi.fn() }))
vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))
vi.mock('@/components/checkout/CheckoutPayment', () => ({
  CheckoutPayment: () => <div data-checkout-payment="true">Payment action</div>,
}))

import CheckoutDetailPage from '@/app/(frontend)/account/checkouts/[id]/page'

beforeEach(() => {
  fixture.overrides = {}
})

it('keeps payment primary and shows one price in a right rail without repeated sections', async () => {
  const html = renderToStaticMarkup(
    await CheckoutDetailPage({ params: Promise.resolve({ id: '42' }) }),
  )

  expect(html.indexOf('data-checkout-payment')).toBeLessThan(html.indexOf('Your trip'))
  expect(html).not.toContain('Order details')
  expect(html).not.toContain('Payer details')
  expect(html).not.toContain('<details')
  expect(html).toContain('Order summary')
  expect(html).toContain('Upcoming trips')
  expect(html).not.toContain('Payment pending</h1>')
  expect(html).toContain('Reservation reference')
  expect(html).toContain('Your trip')
  // Nothing is paid yet, so the total is the only price shown.
  expect(html).not.toContain('Outstanding')
  expect(html.match(/€100\.00/g)).toHaveLength(1)
  expect(html).toContain('data-type="card-lg">Test climbing trip</h3>')
  expect(html).toContain('href="/account/orders/456"')
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/checkouts"/)
})

it('does not call a lapsed reservation an upcoming trip and keeps cancelled trips counted', async () => {
  fixture.overrides = {
    state: 'expired',
    items: baseCheckout.items.map((item) => ({ ...item, cancelledAt: '2030-01-02T00:00:00.000Z' })),
  }
  const html = renderToStaticMarkup(
    await CheckoutDetailPage({ params: Promise.resolve({ id: '42' }) }),
  )

  expect(html).toContain('Reservation expired')
  expect(html).not.toContain('Upcoming trips')
  expect(html).toContain('1 trip')
  expect(html).toContain('Cancelled 2 Jan 2030')
})
