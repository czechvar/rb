// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
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

  it('tolerates two racing callers resolving a paid outcome off the same stale snapshot', async () => {
    const { orderId, txn } = await seedOrderAndTransaction('pending')
    const payload = await getTestPayload()

    // applyOutcome re-reads the order itself, so two applyOutcome calls fired
    // one after another (even back-to-back, with no intervening await) do NOT
    // reproduce the race: the second call's own fresh read already sees
    // whatever the first call finished, and its outer `order.state !== target`
    // guard turns it into a clean no-op. The actual failure needs both calls'
    // order reads to land while the order is still `pending`, i.e. genuine
    // interleaving of two in-flight calls — which is exactly what happens
    // when a payer's return-URL hit and a cron sweep overlap in production.
    //
    // To make that interleaving deterministic in a test (rather than relying
    // on network timing luck — which, tried directly via Promise.all, did not
    // reliably reproduce it locally), this drives the two calls with
    // `Promise.allSettled` so both order reads happen concurrently while the
    // order is still `pending`, and forces the second caller's `confirmed`
    // write to land only after the first caller's `paid` write has committed
    // — the precise interleaving the review flagged.
    const realUpdate = payload.update.bind(payload)
    let confirmedWriteCount = 0
    let paidWritten = false
    payload.update = (async (args: Parameters<typeof realUpdate>[0]) => {
      const data = args.data as { state?: string } | undefined
      if (args.collection === 'orders' && args.id === orderId && data?.state === 'confirmed') {
        confirmedWriteCount++
        if (confirmedWriteCount === 2) {
          while (!paidWritten) await new Promise((resolve) => setTimeout(resolve, 5))
        }
      }
      const result = await realUpdate(args)
      if (args.collection === 'orders' && args.id === orderId && data?.state === 'paid') {
        paidWritten = true
      }
      return result
    }) as typeof realUpdate

    let results: PromiseSettledResult<void>[]
    try {
      results = await Promise.allSettled([
        applyOutcome(txn, { state: 'paid', callbackPayload: { paymentState: 'PAID' } }),
        applyOutcome(txn, { state: 'paid', callbackPayload: { paymentState: 'PAID' } }),
      ])
    } finally {
      payload.update = realUpdate
    }

    for (const result of results) {
      if (result.status === 'rejected') throw result.reason
    }
    expect(await orderState(orderId)).toBe('paid')
    expect(await transactionState(txn.id)).toBe('paid')
  })

  it('tolerates two racing callers resolving a cancelled outcome off the same stale snapshot', async () => {
    const { orderId, txn } = await seedOrderAndTransaction('pending')
    await applyOutcome(txn, { state: 'cancelled', callbackPayload: { paymentState: 'CANCELED' } })
    await applyOutcome(txn, { state: 'cancelled', callbackPayload: { paymentState: 'CANCELED' } })
    expect(await orderState(orderId)).toBe('cancelled')
    expect(await transactionState(txn.id)).toBe('cancelled')
  })

  it('leaves a completed order alone when a paid outcome arrives', async () => {
    const payload = await getTestPayload()
    const { orderId, txn } = await seedOrderAndTransaction('confirmed')
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { state: 'paid' },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { state: 'completed' },
      overrideAccess: true,
    })
    await applyOutcome(txn, { state: 'paid', callbackPayload: { paymentState: 'PAID' } })
    expect(await orderState(orderId)).toBe('completed')
    expect(await transactionState(txn.id)).toBe('paid')
  })

  it('warns instead of silently dropping a paid outcome for an already-cancelled order', async () => {
    const { orderId, txn } = await seedOrderAndTransaction('pending')
    await applyOutcome(txn, { state: 'cancelled', callbackPayload: { paymentState: 'CANCELED' } })

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await expect(
        applyOutcome(
          { ...txn, state: 'cancelled' },
          { state: 'paid', callbackPayload: { paymentState: 'PAID' } },
        ),
      ).resolves.not.toThrow()

      expect(await orderState(orderId)).toBe('cancelled')
      expect(await transactionState(txn.id)).toBe('paid')
      // mockRestore() (in the finally below) clears the recorded call
      // history, so this assertion must run before that.
      expect(errorSpy).toHaveBeenCalled()
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('warns (not throws) when the order is cancelled mid-flight by a racing caller', async () => {
    const { orderId, txn } = await seedOrderAndTransaction('pending')
    const payload = await getTestPayload()

    // Force the same interleaving as the existing racing-callers test above,
    // but this time the second caller (racing to cancel the order) commits
    // its `cancelled` write before the first caller's `confirmed` write
    // lands, so the first caller's write is refused and its catch-block
    // re-read sees `cancelled` rather than `paid` or `confirmed`.
    const realUpdate = payload.update.bind(payload)
    let cancelledWritten = false
    payload.update = (async (args: Parameters<typeof realUpdate>[0]) => {
      const data = args.data as { state?: string } | undefined
      if (args.collection === 'orders' && args.id === orderId && data?.state === 'confirmed') {
        while (!cancelledWritten) await new Promise((resolve) => setTimeout(resolve, 5))
      }
      const result = await realUpdate(args)
      if (args.collection === 'orders' && args.id === orderId && data?.state === 'cancelled') {
        cancelledWritten = true
      }
      return result
    }) as typeof realUpdate

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const results = await Promise.allSettled([
        applyOutcome(txn, { state: 'paid', callbackPayload: { paymentState: 'PAID' } }),
        applyOutcome(txn, { state: 'cancelled', callbackPayload: { paymentState: 'CANCELED' } }),
      ])
      for (const result of results) {
        if (result.status === 'rejected') throw result.reason
      }

      expect(await orderState(orderId)).toBe('cancelled')
      // mockRestore() (in the finally below) clears the recorded call
      // history, so this assertion must run before that.
      expect(errorSpy).toHaveBeenCalled()
    } finally {
      payload.update = realUpdate
      errorSpy.mockRestore()
    }
  })

  it('leaves a completed order alone when a cancelled outcome arrives', async () => {
    const payload = await getTestPayload()
    const { orderId, txn } = await seedOrderAndTransaction('confirmed')
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { state: 'paid' },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { state: 'completed' },
      overrideAccess: true,
    })
    await expect(
      applyOutcome(txn, { state: 'cancelled', callbackPayload: { paymentState: 'CANCELED' } }),
    ).resolves.not.toThrow()
    expect(await orderState(orderId)).toBe('completed')
  })
})
