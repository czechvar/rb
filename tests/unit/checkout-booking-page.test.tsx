import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BookPage from '@/app/(frontend)/book/[eventDateId]/page'

const mocks = vi.hoisted(() => ({
  findByID: vi.fn(),
  remaining: vi.fn(),
}))

vi.mock('@/lib/checkout/feature', () => ({ checkoutEnabled: () => false }))
vi.mock('@/lib/auth', () => ({
  getCurrentUser: async () => ({ id: 9, email: 'person@example.test', addresses: [] }),
}))
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ findByID: mocks.findByID }) }))
vi.mock('@/lib/capacity', () => ({ getRemainingCapacity: mocks.remaining }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/link', () => ({ default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a> }))
vi.mock('@/app/(frontend)/book/[eventDateId]/BookingForm', () => ({
  BookingForm: () => <div data-booking-form />,
}))

const occurrence = (dateFrom: string, dateTo: string) => ({
  id: 77,
  active: true,
  dateFrom,
  dateTo,
  capacity: 8,
  price: 100,
  vat: 0,
  currency: 'EUR',
  event: { title: 'Test trip', slug: 'test-trip' },
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.remaining.mockResolvedValue(4)
})

describe('legacy booking page occurrence cutoff', () => {
  it.each([
    ['in progress', '2000-01-01T00:00:00.000Z', '2999-01-01T00:00:00.000Z'],
    ['ended', '2000-01-01T00:00:00.000Z', '2000-01-08T00:00:00.000Z'],
  ])('shows the unavailable state instead of the form when the occurrence is %s', async (_state, dateFrom, dateTo) => {
    mocks.findByID.mockResolvedValueOnce(occurrence(dateFrom, dateTo))

    const html = renderToStaticMarkup(await BookPage({ params: Promise.resolve({ eventDateId: '77' }) }))

    expect(html).toContain('This date is not available')
    expect(html).not.toContain('data-booking-form')
  })

  it('still renders the form for a future eligible occurrence', async () => {
    mocks.findByID.mockResolvedValueOnce(occurrence('2999-01-01T00:00:00.000Z', '2999-01-08T00:00:00.000Z'))

    const html = renderToStaticMarkup(await BookPage({ params: Promise.resolve({ eventDateId: '77' }) }))

    expect(html).toContain('data-booking-form')
    expect(html).not.toContain('This date is not available')
  })
})
