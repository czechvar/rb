import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import { getRemainingCapacity } from '@/lib/capacity'

async function makeEventWithDate(capacity: number) {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: { title: `Cap Event ${unique}`, slug: `cap-event-${unique}`, state: 'published' },
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-01-01T00:00:00.000Z',
      dateTo: '2027-01-05T00:00:00.000Z',
      price: 100,
      vat: 21,
      currency: 'EUR',
      capacity,
      active: true,
    },
  })
  return ed.id
}

async function makeUser(role: 'customer' | 'admin' = 'customer') {
  const payload = await getTestPayload()
  return payload.create({
    collection: 'users',
    data: {
      name: 'C',
      phone: '+420 600 000 000',
      email: `cap-${Date.now()}-${Math.random()}@x.test`,
      password: 'cap-test-pwd',
      role,
      _verified: true,
    } as never,
  })
}

async function makeOrder(eventDateId: number, userId: number, participantCount: number, state: string) {
  const payload = await getTestPayload()
  const participants = Array.from({ length: participantCount }, (_, i) => ({
    firstName: `P${i}`,
    lastName: 'X',
    email: `p${i}-${Date.now()}@x.test`,
    phone: '+420 600 000 001',
  }))
  return payload.create({
    collection: 'orders',
    data: {
      user: userId,
      eventDate: eventDateId,
      participants,
      billingAddress: {
        firstName: 'C',
        lastName: 'Last',
        street: 'Main 1',
        city: 'Prague',
        postalCode: '11000',
        country: 'CZ',
      },
      unitPrice: 100,
      vat: 21,
      currency: 'EUR',
      state,
    } as never,
    overrideAccess: true,
  })
}

describe('getRemainingCapacity', () => {
  it('returns full capacity when no orders exist', async () => {
    const ed = await makeEventWithDate(10)
    expect(await getRemainingCapacity(ed)).toBe(10)
  })
  it('subtracts participant counts in pending / confirmed / paid', async () => {
    const ed = await makeEventWithDate(10)
    const u = await makeUser()
    await makeOrder(ed, u.id, 2, 'pending')
    await makeOrder(ed, u.id, 1, 'confirmed')
    await makeOrder(ed, u.id, 3, 'paid')
    expect(await getRemainingCapacity(ed)).toBe(10 - 6)
  })
  it('ignores cancelled and completed', async () => {
    const ed = await makeEventWithDate(10)
    const u = await makeUser()
    await makeOrder(ed, u.id, 4, 'cancelled')
    await makeOrder(ed, u.id, 5, 'completed')
    expect(await getRemainingCapacity(ed)).toBe(10)
  })
  it('clamps at zero (never negative even if oversold by historic data)', async () => {
    // Capacity hook prevents creating oversold rows via the normal path, so we
    // simulate legacy oversold state by reducing capacity AFTER booking.
    const payload = await getTestPayload()
    const ed = await makeEventWithDate(10)
    const u = await makeUser()
    await makeOrder(ed, u.id, 5, 'pending')
    await payload.update({
      collection: 'event-dates',
      id: ed,
      data: { capacity: 2 },
      overrideAccess: true,
    })
    expect(await getRemainingCapacity(ed)).toBe(0)
  })
  it('throws when event-date does not exist', async () => {
    await expect(getRemainingCapacity(999999999)).rejects.toThrow()
  })
})
