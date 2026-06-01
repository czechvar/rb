import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

const baseBilling = {
  firstName: 'A', lastName: 'B', street: 'Main 1', city: 'Prague', postalCode: '11000', country: 'CZ',
}

async function seed() {
  const payload = await getTestPayload()
  const event = await payload.create({
    collection: 'events',
    // @ts-expect-error slug auto-set
    data: { title: `StateTest ${Date.now()}-${Math.random()}` },
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-05-01T00:00:00.000Z',
      dateTo: '2027-05-05T00:00:00.000Z',
      price: 100, vat: 21, currency: 'EUR', capacity: 10, active: true,
    },
  })
  const user = await payload.create({
    collection: 'users',
    data: {
      name: 'S', phone: '+420 600 000 020',
      email: `state-${Date.now()}-${Math.random()}@x.test`,
      password: 'state-test-pwd',
      role: 'customer',
      _verified: true,
    } as never,
  })
  const order = await payload.create({
    collection: 'orders',
    data: {
      user: user.id, eventDate: ed.id,
      participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
      billingAddress: baseBilling,
      unitPrice: 100, vat: 21, currency: 'EUR', state: 'pending',
    } as never,
    overrideAccess: true,
  })
  return { user, order }
}

describe('orders state-transition hook', () => {
  it('allows pending -> confirmed', async () => {
    const payload = await getTestPayload()
    const { order } = await seed()
    const updated = await payload.update({
      collection: 'orders', id: order.id, data: { state: 'confirmed' }, overrideAccess: true,
    })
    expect(updated.state).toBe('confirmed')
  })
  it('allows pending -> confirmed -> paid -> completed', async () => {
    const payload = await getTestPayload()
    const { order } = await seed()
    await payload.update({ collection: 'orders', id: order.id, data: { state: 'confirmed' }, overrideAccess: true })
    await payload.update({ collection: 'orders', id: order.id, data: { state: 'paid' }, overrideAccess: true })
    const final = await payload.update({
      collection: 'orders', id: order.id, data: { state: 'completed' }, overrideAccess: true,
    })
    expect(final.state).toBe('completed')
  })
  it('rejects pending -> paid (skip)', async () => {
    const payload = await getTestPayload()
    const { order } = await seed()
    await expect(
      payload.update({ collection: 'orders', id: order.id, data: { state: 'paid' }, overrideAccess: true }),
    ).rejects.toThrow(/transition/i)
  })
  it('allows any non-terminal -> cancelled', async () => {
    const payload = await getTestPayload()
    const a = await seed()
    await payload.update({ collection: 'orders', id: a.order.id, data: { state: 'cancelled' }, overrideAccess: true })

    const b = await seed()
    await payload.update({ collection: 'orders', id: b.order.id, data: { state: 'confirmed' }, overrideAccess: true })
    await payload.update({ collection: 'orders', id: b.order.id, data: { state: 'cancelled' }, overrideAccess: true })

    const c = await seed()
    await payload.update({ collection: 'orders', id: c.order.id, data: { state: 'confirmed' }, overrideAccess: true })
    await payload.update({ collection: 'orders', id: c.order.id, data: { state: 'paid' }, overrideAccess: true })
    await payload.update({ collection: 'orders', id: c.order.id, data: { state: 'cancelled' }, overrideAccess: true })
  })
  it('rejects any transition from a terminal state', async () => {
    const payload = await getTestPayload()
    const { order } = await seed()
    await payload.update({ collection: 'orders', id: order.id, data: { state: 'cancelled' }, overrideAccess: true })
    await expect(
      payload.update({ collection: 'orders', id: order.id, data: { state: 'confirmed' }, overrideAccess: true }),
    ).rejects.toThrow(/transition/i)
  })
})
