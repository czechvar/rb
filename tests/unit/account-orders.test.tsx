// tests/unit/account-orders.test.tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'
import checkout from '@/components/checkout/checkout.module.css'

const event = { id: 5, title: 'Europe Climbing Trip' }
const eventDate = {
  id: 9,
  event,
  dateFrom: '2030-06-01T00:00:00.000Z',
  dateTo: '2030-06-08T00:00:00.000Z',
  tripVariant: {
    id: 51,
    event: 5,
    title: 'Gorges du Tarn',
    editorial: {
      hero: {
        titleParts: [
          { text: 'ROCK & ROAD EUROPE:' },
          { text: 'GORGES DU TARN', accent: true, breakBefore: true },
        ],
      },
    },
  },
}
const baseOrder = {
  id: 456,
  orderNumber: 'RB-2030-000456',
  state: 'pending',
  user: 9,
  eventDate,
  participantCount: 1,
  participants: [
    { firstName: 'Test', lastName: 'Customer', email: 'test@example.test', phone: '+420123456789' },
  ],
  billingAddress: {
    firstName: 'Test',
    lastName: 'Customer',
    street: 'Saved street 1',
    city: 'Prague',
    postalCode: '11000',
    country: 'CZ',
  },
  unitPrice: 950,
  totalPrice: 950,
  currency: 'EUR',
  vat: 21,
}
const fixture = vi.hoisted(() => ({
  overrides: {} as Record<string, unknown>,
  docs: null as unknown[] | null,
  findByIdArgs: null as Record<string, unknown> | null,
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUser: async () => ({ id: 9, name: 'Test Customer', email: 'test@example.test' }),
}))
vi.mock('@/lib/payload', () => ({
  getPayloadClient: async () => ({
    find: async () => ({ docs: fixture.docs ?? [{ ...baseOrder, ...fixture.overrides }] }),
    findByID: async (args: Record<string, unknown>) => {
      fixture.findByIdArgs = args
      return { ...baseOrder, ...fixture.overrides }
    },
  }),
}))
vi.mock('next/navigation', () => ({ notFound: vi.fn(), redirect: vi.fn() }))
vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))
vi.mock('@/app/(frontend)/account/orders/[id]/actions', () => ({ cancelMyOrderAction: vi.fn() }))

import OrdersPage from '@/app/(frontend)/account/orders/page'
import OrderDetailPage from '@/app/(frontend)/account/orders/[id]/page'

const detail = async () =>
  renderToStaticMarkup(await OrderDetailPage({ params: Promise.resolve({ id: '456' }) }))

beforeEach(() => {
  fixture.overrides = {}
  fixture.docs = null
  fixture.findByIdArgs = null
  delete process.env.BANK_TRANSFER_DETAILS
})

it('lists orders as reservation-style cards with the authored name, a badge and one price', async () => {
  const html = renderToStaticMarkup(await OrdersPage())
  expect(html).toContain('<h1>Your orders</h1>')
  expect(html).toContain(`<section class="${checkout.panel} ${checkout.reservationCard}">`)
  expect(html).toContain('ROCK &amp; ROAD EUROPE: GORGES DU TARN')
  expect(html).not.toContain('Europe Climbing Trip')
  expect(html).toContain('1 Jun 2030 – 8 Jun 2030')
  expect(html).toContain('RB-2030-000456')
  expect(html).toContain(`<span class="${checkout.statusBadge}">Pending</span>`)
  expect(html.match(/€950\.00/g)).toHaveLength(1)
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/orders\/456">View order<\/a>/)
  expect(html).not.toContain('style=')
})

it('falls back to "Trip" when the event is not populated', async () => {
  fixture.overrides = { eventDate: { ...eventDate, event: 5 } }
  expect(renderToStaticMarkup(await OrdersPage())).toContain('>Trip</a>')
})

it('shows an empty-state notice that leads to the trips', async () => {
  fixture.docs = []
  const html = renderToStaticMarkup(await OrdersPage())
  expect(html).toContain(`<div class="${checkout.notice}">`)
  expect(html).toMatch(/class="btn-primary[^"]*" href="\/trips">Browse trips<\/a>/)
})

it('presents an order like a reservation: header, two columns, one total', async () => {
  const html = await detail()
  expect(fixture.findByIdArgs).toMatchObject({ collection: 'orders', depth: 2, overrideAccess: false })
  expect(html).toContain('>Your order</p>')
  expect(html).toContain('<h1>ROCK &amp; ROAD EUROPE: GORGES DU TARN</h1>')
  expect(html).toContain(`<span class="${checkout.statusBadge}">Pending</span>`)
  expect(html).toContain('Order number')
  expect(html).toContain('<code>RB-2030-000456</code>')
  expect(html).toContain(`<div class="${checkout.layout}">`)
  expect(html).toContain('data-type="card-lg">Participants</h2>')
  expect(html).toContain('data-type="card-lg">Your details</h2>')
  expect(html).toContain('data-type="card-lg">Your trip</h2>')
  expect(html).toContain('data-type="card-lg">Order summary</h2>')
  expect(html).toContain('1 participant')
  expect(html).toContain('VAT 21% included.')
  expect(html).not.toContain('Subtotal')
  expect(html).not.toContain('Discount')
  expect(html).not.toContain('per person')
  expect(html.match(/€950\.00/g)).toHaveLength(1)
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/orders">All orders<\/a>/)
  expect(html).not.toContain('style=')
})

it('offers an outline "Cancel booking" only while the order is pending', async () => {
  expect(await detail()).toMatch(/<button type="submit" class="btn-ghost[^"]*">Cancel booking<\/button>/)
  fixture.overrides = { state: 'paid' }
  expect(await detail()).not.toContain('Cancel booking')
})

it('shows payment instructions with the variable symbol only when confirmed', async () => {
  process.env.BANK_TRANSFER_DETAILS = 'IBAN CZ00 0000\nBeneficiary Rockbusters'
  expect(await detail()).not.toContain('Payment instructions')
  fixture.overrides = { state: 'confirmed' }
  const html = await detail()
  expect(html).toContain('data-type="card-lg">Payment instructions</h2>')
  expect(html).toContain('IBAN CZ00 0000')
  expect(html).toContain('Variable symbol: <strong>RB-2030-000456</strong>')
  expect(html.indexOf('Payment instructions')).toBeLessThan(html.indexOf('Participants'))
})

it('adds subtotal and discount rows only when a discount applied, and a per-person price for groups', async () => {
  fixture.overrides = {
    participantCount: 2,
    totalPrice: 1800,
    discountAmount: 100,
    discountCode: { id: 1, code: 'CRAG100', title: 'Crag' },
    customerNote: 'Vegetarian',
  }
  const html = await detail()
  expect(html).toContain('Subtotal')
  expect(html).toContain('€1,900.00')
  expect(html).toContain('Discount (CRAG100)')
  expect(html).toContain('−€100.00')
  expect(html).toContain('€1,800.00')
  expect(html).toContain('2 participants · €950.00 per person')
  expect(html).toContain('data-type="card-lg">Your note</h2>')
  expect(html).toContain('Vegetarian')
})
