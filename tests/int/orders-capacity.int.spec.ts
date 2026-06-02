import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

const baseBilling = {
  firstName: 'A',
  lastName: 'B',
  street: 'Main 1',
  city: 'Prague',
  postalCode: '11000',
  country: 'CZ',
}

async function seedDate(capacity: number) {
  const payload = await getTestPayload()
  const event = await payload.create({
    collection: 'events',
    // @ts-expect-error slug auto-set
    data: { title: `CapHook ${Date.now()}-${Math.random()}` },
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-04-01T00:00:00.000Z',
      dateTo: '2027-04-05T00:00:00.000Z',
      price: 100,
      vat: 21,
      currency: 'EUR',
      capacity,
      active: true,
    },
  })
  return ed.id
}

async function seedUser() {
  const payload = await getTestPayload()
  return payload.create({
    collection: 'users',
    data: {
      name: 'C',
      phone: '+420 600 000 010',
      email: `caphook-${Date.now()}-${Math.random()}@x.test`,
      password: 'pwd-test',
      role: 'customer',
      _verified: true,
    } as never,
  })
}

async function createOrder(eventDateId: number, userId: number, participants: number) {
  const payload = await getTestPayload()
  return payload.create({
    collection: 'orders',
    data: {
      user: userId,
      eventDate: eventDateId,
      participants: Array.from({ length: participants }, (_, i) => ({
        firstName: `P${i}`,
        lastName: 'X',
        email: `p${i}-${Math.random()}@x.test`,
        phone: '+1',
      })),
      billingAddress: baseBilling,
      unitPrice: 100,
      vat: 21,
      currency: 'EUR',
      state: 'pending',
    } as never,
    overrideAccess: true,
  })
}

describe('orders capacity check', () => {
  it('allows orders up to remaining capacity', async () => {
    const ed = await seedDate(3)
    const u = await seedUser()
    await createOrder(ed, u.id, 2)
    await createOrder(ed, u.id, 1)
  })
  it('rejects an order that exceeds remaining capacity', async () => {
    const ed = await seedDate(2)
    const u = await seedUser()
    await createOrder(ed, u.id, 2)
    await expect(createOrder(ed, u.id, 1)).rejects.toThrow(/sold out|capacity/i)
  })
  it('does not count cancelled orders against capacity', async () => {
    const payload = await getTestPayload()
    const ed = await seedDate(2)
    const u = await seedUser()
    const o = await createOrder(ed, u.id, 2)
    await payload.update({
      collection: 'orders',
      id: o.id,
      data: { state: 'cancelled' },
      overrideAccess: true,
    })
    await createOrder(ed, u.id, 2)
  })
})
