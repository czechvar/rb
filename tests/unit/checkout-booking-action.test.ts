import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBookingAction } from '@/app/(frontend)/book/[eventDateId]/actions'

const mocks = vi.hoisted(() => ({
  findByID: vi.fn(),
  create: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`) }),
}))

vi.mock('@/lib/checkout/feature', () => ({ checkoutEnabled: () => false }))
vi.mock('@/lib/auth', () => ({
  requireUser: async () => ({
    id: 9,
    addresses: [{ firstName: 'Ada', lastName: 'Lovelace', street: '1 Test St', city: 'Berlin', postalCode: '10115', country: 'DE' }],
  }),
}))
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ findByID: mocks.findByID, create: mocks.create }) }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))

function validBooking(): FormData {
  const form = new FormData()
  form.set('eventDateId', '77')
  form.set('participants.0.firstName', 'Ada')
  form.set('participants.0.lastName', 'Lovelace')
  form.set('participants.0.email', 'ada@example.test')
  form.set('participants.0.phone', '+49 1234567')
  form.set('addressIndex', '0')
  return form
}

const occurrence = (dateFrom: string, dateTo: string) => ({
  id: 77,
  active: true,
  dateFrom,
  dateTo,
  capacity: 8,
  remainingSeats: 4,
  price: 100,
  priceCzk: null,
  vat: 0,
  currency: 'EUR',
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('legacy booking action occurrence cutoff', () => {
  it.each([
    ['in progress', '2000-01-01T00:00:00.000Z', '2999-01-01T00:00:00.000Z'],
    ['ended', '2000-01-01T00:00:00.000Z', '2000-01-08T00:00:00.000Z'],
  ])('rejects an active occurrence that is %s before creating an order', async (_state, dateFrom, dateTo) => {
    mocks.findByID.mockResolvedValueOnce(occurrence(dateFrom, dateTo))

    await expect(createBookingAction({ ok: false }, validBooking())).resolves.toEqual({
      ok: false,
      formError: 'This date is no longer available.',
    })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('still creates a pending order for a future eligible occurrence', async () => {
    mocks.findByID.mockResolvedValueOnce(occurrence('2999-01-01T00:00:00.000Z', '2999-01-08T00:00:00.000Z'))
    mocks.create.mockResolvedValueOnce({ id: 101 })

    await expect(createBookingAction({ ok: false }, validBooking())).rejects.toThrow(
      'REDIRECT:/book/77/confirmation/101',
    )
    expect(mocks.create).toHaveBeenCalledOnce()
  })
})
