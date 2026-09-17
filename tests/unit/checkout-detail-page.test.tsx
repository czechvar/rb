import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'

vi.mock('@/lib/checkout/feature', () => ({ checkoutEnabled: () => true }))
vi.mock('@/lib/auth', () => ({
  getCurrentUser: async () => ({ id: 9, name: 'Test Customer', email: 'test@example.test' }),
}))
vi.mock('@/lib/payload', () => ({
  getPayloadClient: async () => ({
    find: async () => ({
      docs: [
        {
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
        },
      ],
    }),
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

it('keeps payment primary and collapses payer and order details in the right rail', async () => {
  const html = renderToStaticMarkup(
    await CheckoutDetailPage({ params: Promise.resolve({ id: '42' }) }),
  )

  expect(html.indexOf('data-checkout-payment')).toBeLessThan(html.indexOf('Order details'))
  expect(html).toContain('<summary><span>Order details</span>')
  expect(html).toContain('<summary><span>Payer details</span>')
  expect(html).toContain('Order summary')
  expect(html).toContain('Payment pending')
  expect(html).toContain('Reservation reference')
  expect(html).toContain('Your trip')
  expect(html).toContain('Outstanding')
  expect(html).toContain('Test climbing trip')
  expect(html).toContain('€100.00')
  expect(html).not.toContain('<details open=""')
})
