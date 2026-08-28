import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

// `order` is a real FK-constrained relationship at the DB level (see
// src/collections/Orders.ts), so a placeholder int id like `1` fails
// insertion once the test DB has accumulated fixtures from other suites.
// Seed a minimal, valid order the same way tests/int/orders.int.spec.ts does.
async function seedOrder() {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: { title: `TxnTest ${unique}`, slug: `txntest-${unique}`, state: 'published' },
  })
  const eventDate = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-03-01T00:00:00.000Z',
      dateTo: '2027-03-05T00:00:00.000Z',
      price: 199,
      vat: 21,
      currency: 'EUR',
      capacity: 10,
      active: true,
    },
  })
  const user = await payload.create({
    collection: 'users',
    data: {
      name: 'Test User',
      phone: '+420 600 000 003',
      email: `txn-${unique}@x.test`,
      password: 'txn-test-pwd',
      role: 'customer',
      _verified: true,
    } as never,
  })
  const order = await payload.create({
    collection: 'orders',
    data: {
      user: user.id,
      eventDate: eventDate.id,
      participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+420 1' }],
      billingAddress: {
        firstName: 'A',
        lastName: 'B',
        street: 'Main 1',
        city: 'Prague',
        postalCode: '11000',
        country: 'CZ',
      },
      unitPrice: 199,
      vat: 21,
      currency: 'EUR',
      state: 'pending',
    } as never,
    overrideAccess: true,
  })
  return order.id
}

describe('transactions collection', () => {
  it('creates a transaction with defaults and enforces the uuid unique index', async () => {
    const payload = await getTestPayload()
    const uuid = `11111111-0000-4000-8000-${Date.now()}`
    const orderId = await seedOrder()

    const doc = await payload.create({
      collection: 'transactions',
      data: {
        uuid,
        order: orderId,
        amount: 199,
        amountWithoutVat: 164.46,
        currency: 'EUR',
        label: 'Rockbusters RB-2026-000001',
        email: 'payer@x.test',
        paymentMethod: 'comgate-card',
      } as never,
      overrideAccess: true,
    })

    expect(doc.state).toBe('created')
    expect(doc.payload).toBeFalsy()
    expect(doc.callbackPayload).toBeFalsy()

    await expect(
      payload.create({
        collection: 'transactions',
        data: {
          uuid, // duplicate
          order: orderId,
          amount: 50,
          amountWithoutVat: 41.32,
          currency: 'EUR',
          label: 'dup',
          email: 'other@x.test',
          paymentMethod: 'comgate-card',
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('blocks writes through the public API (create/update/delete all denied without overrideAccess)', async () => {
    const payload = await getTestPayload()
    await expect(
      payload.create({
        collection: 'transactions',
        data: {
          uuid: `no-access-${Date.now()}`,
          order: 1,
          amount: 10,
          amountWithoutVat: 8.26,
          currency: 'EUR',
          label: 'x',
          email: 'x@x.test',
          paymentMethod: 'comgate-card',
        } as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await expect(
      payload.update({
        collection: 'transactions',
        id: 1,
        data: { state: 'paid' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await expect(
      payload.delete({ collection: 'transactions', id: 1, overrideAccess: false }),
    ).rejects.toThrow()
  })
})
