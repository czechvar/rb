// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { getTestPayload } from '../helpers/payload'
import { applyOutcome } from '@/payments/order-transitions'
import type { TransactionDoc } from '@/payments/transaction-store'

const billing = {
  firstName: 'A',
  lastName: 'B',
  street: 'Main 1',
  city: 'Prague',
  postalCode: '11000',
  country: 'CZ',
}

async function seedOrderAndTransaction(orderState: 'pending' | 'confirmed' = 'pending') {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: { title: `TransTest ${unique}`, slug: `transtest-${unique}`, state: 'published' } as never,
    overrideAccess: true,
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-05-01T00:00:00.000Z',
      dateTo: '2027-05-05T00:00:00.000Z',
      price: 100,
      vat: 21,
      currency: 'EUR',
      capacity: 10,
      active: true,
    } as never,
    overrideAccess: true,
  })
  const user = await payload.create({
    collection: 'users',
    data: {
      name: 'Trans',
      phone: '+420 600 000 040',
      email: `trans-${unique}@x.test`,
      password: 'trans-test-pwd',
      role: 'customer',
      _verified: true,
    } as never,
    overrideAccess: true,
  })
  const order = await payload.create({
    collection: 'orders',
    data: {
      user: user.id,
      eventDate: ed.id,
      participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
      billingAddress: billing,
      unitPrice: 100,
      vat: 21,
      currency: 'EUR',
      state: 'pending',
    } as never,
    overrideAccess: true,
  })
  if (orderState !== 'pending') {
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { state: orderState },
      overrideAccess: true,
    })
  }
  const txn = (await payload.create({
    collection: 'transactions',
    data: {
      uuid: randomUUID(),
      order: order.id,
      amount: 100,
      amountWithoutVat: 82.64,
      currency: 'EUR',
      label: 'Rockbusters test',
      email: user.email,
      state: 'begun',
      paymentMethod: 'muzapay',
    } as never,
    overrideAccess: true,
  })) as unknown as TransactionDoc
  return { orderId: order.id as number, txn }
}

async function orderState(orderId: number): Promise<string> {
  const payload = await getTestPayload()
  const o = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
  return o.state as string
}

async function transactionState(id: number): Promise<string> {
  const payload = await getTestPayload()
  const t = await payload.findByID({ collection: 'transactions', id, overrideAccess: true })
  return t.state as string
}

describe('applyOutcome', () => {
  it('chains pending -> confirmed -> paid and marks the transaction paid', async () => {
    const { orderId, txn } = await seedOrderAndTransaction('pending')
    await applyOutcome(txn, { state: 'paid', callbackPayload: { paymentState: 'PAID' } })
    expect(await orderState(orderId)).toBe('paid')
    expect(await transactionState(txn.id)).toBe('paid')
  })

  it('goes straight to paid from confirmed', async () => {
    const { orderId, txn } = await seedOrderAndTransaction('confirmed')
    await applyOutcome(txn, { state: 'paid', callbackPayload: {} })
    expect(await orderState(orderId)).toBe('paid')
  })

  it('cancels the order on a cancelled outcome', async () => {
    const { orderId, txn } = await seedOrderAndTransaction('pending')
    await applyOutcome(txn, { state: 'cancelled', callbackPayload: { paymentState: 'CANCELED' } })
    expect(await orderState(orderId)).toBe('cancelled')
    expect(await transactionState(txn.id)).toBe('cancelled')
  })

  it('leaves the order payable on a failed outcome so the payer can retry', async () => {
    const { orderId, txn } = await seedOrderAndTransaction('pending')
    await applyOutcome(txn, { state: 'failed', callbackPayload: { paymentState: 'DECLINED' } })
    expect(await orderState(orderId)).toBe('pending')
    expect(await transactionState(txn.id)).toBe('failed')
  })

  it('is a no-op when the transaction already carries the outcome state', async () => {
    const payload = await getTestPayload()
    const { orderId, txn } = await seedOrderAndTransaction('pending')
    await payload.update({
      collection: 'transactions',
      id: txn.id,
      data: { state: 'paid' },
      overrideAccess: true,
    })
    await applyOutcome({ ...txn, state: 'paid' }, { state: 'paid', callbackPayload: {} })
    // The order was never advanced, proving the duplicate was short-circuited
    // rather than replayed.
    expect(await orderState(orderId)).toBe('pending')
  })
})
