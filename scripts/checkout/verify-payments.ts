/** Called only inside the coordinator's disposable database; no real gateway calls. */
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import type { CheckoutRecord } from '../../src/lib/checkout/types'
import { withCheckoutTransaction } from '../../src/lib/checkout/transaction'
import { getRemainingCapacity } from '../../src/lib/capacity'
import { quoteCart } from '../../src/lib/checkout/quote'
import { createCheckoutPaymentService } from '../../src/payments/checkout-payment-service'
import type { PaymentGateway, PaymentOutcome } from '../../src/payments/gateway'
export async function verifyPayments(payload: Payload): Promise<void> {
  const url = new URL(process.env.DATABASE_URL ?? '')
  assert(
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      /^\/rb_seed_verify_[a-f0-9]+$/.test(url.pathname),
  )
  const passed = (checkPassed: string) => console.log(JSON.stringify({ checkPassed }))
  const clock = new Date('2029-01-01T00:00:00Z')
  const event = await payload.create({
    collection: 'events',
    data: {
      title: '[Checkout test] Payments',
      slug: `checkout-payments-${randomUUID()}`,
      state: 'published',
    } as never,
  })
  const dates = await Promise.all(
    [1, 2].map(() =>
      payload.create({
        collection: 'event-dates',
        data: {
          event: event.id,
          dateFrom: '2030-06-15T00:00:00Z',
          dateTo: '2030-06-22T00:00:00Z',
          price: 199.99,
          priceCzk: 4999.99,
          vat: 21,
          currency: 'EUR',
          capacity: 100,
          active: true,
        },
      }),
    ),
  )
  const user = await payload.create({
    collection: 'users',
    disableVerificationEmail: true,
    data: {
      email: `payment-${randomUUID()}@example.invalid`,
      name: '[Checkout test] Payment',
      phone: '+420123456789',
      password: randomUUID(),
      _verified: true,
      role: 'customer',
    },
  })
  const billing = {
    firstName: 'Test',
    lastName: 'Payment',
    street: 'Test 1',
    city: 'Test',
    postalCode: '12345',
    country: 'CZ',
  }
  const make = () =>
    withCheckoutTransaction(payload, async (req) => {
      const quote = await quoteCart(
        { items: dates.map((date) => ({ eventDateId: date.id, quantity: 1 })) },
        req,
      )
      const checkout = await payload.create({
        collection: 'checkouts',
        req,
        overrideAccess: true,
        data: {
          reference: `payment-${randomUUID()}`,
          submissionKey: randomUUID(),
          requestDigest: 'fixture',
          state: 'reserved',
          customerKind: 'returning',
          user: user.id,
          contact: { name: user.name, email: user.email, phone: user.phone },
          billingAddress: billing,
          items: quote.items,
          currency: 'EUR',
          expiresAt: '2029-01-02T00:00:00Z',
        },
      })
      const items = []
      for (const item of quote.items) {
        const order = await payload.create({
          collection: 'orders',
          req,
          overrideAccess: true,
          data: {
            checkout: checkout.id,
            user: user.id,
            eventDate: item.eventDateId,
            participants: [],
            participantCount: 1,
            billingAddress: billing,
            unitPrice: item.unitMinor / 100,
            totalPrice: item.totalMinor / 100,
            totalPriceCzk: item.totalCzkMinor! / 100,
            vat: 21,
            currency: 'EUR',
            state: 'pending',
          } as never,
        })
        items.push({ ...item, orderId: order.id })
      }
      return (await payload.update({
        collection: 'checkouts',
        id: checkout.id,
        req,
        overrideAccess: true,
        data: { items },
      })) as unknown as CheckoutRecord
    })
  let beginCalls = 0
  let poll: PaymentOutcome | null = null
  const gateway: PaymentGateway = {
    begin: async (transaction) => {
      beginCalls++
      return {
        redirectUrl: 'https://payment-fixture.invalid/pay',
        gatewayTransactionId: transaction.uuid,
        payload: {
          gatewayTransactionId: transaction.uuid,
          redirectUrl: 'https://payment-fixture.invalid/pay',
        },
      }
    },
    checkStatus: async () => poll,
    cancel: async () => poll,
    handleReturn: async () => poll,
    handleWebhook: async () => {
      throw new Error('Fixture has no webhook transport')
    },
  }
  const service = createCheckoutPaymentService({
    payload,
    gateways: () => gateway,
    now: () => clock,
    enabled: () => true,
  })
  const attempts = async (id: number) =>
    (
      await payload.find({
        collection: 'transactions',
        where: { checkout: { equals: id } },
        depth: 0,
      })
    ).docs
  const read = async (id: number) =>
    (await payload.findByID({ collection: 'checkouts', id, depth: 0 })) as unknown as CheckoutRecord
  const c = await make()
  for (const method of ['comgate-card', 'muzapay'] as const)
    for (const purpose of ['full', 'deposit', 'balance'] as const)
      await assert.rejects(() => service.begin(c.id, user, {
        method, purpose, itemIds: [dates[0].id],
      }), /every trip/)
  assert.equal((await attempts(c.id)).length, 0)
  assert.equal(beginCalls, 0)
  passed('first-payment-subset-rejected-for-both-methods-all-purposes')
  const race = await Promise.allSettled([
    service.begin(c.id, user, { method: 'comgate-card', purpose: 'deposit' }),
    service.begin(c.id, user, { method: 'comgate-card', purpose: 'deposit' }),
  ])
  assert(race.some((result) => result.status === 'fulfilled'))
  assert.equal(beginCalls, 1)
  assert.equal((await attempts(c.id)).length, 1)
  passed('payment-initiation-race-creates-one-provider-attempt')
  await service.begin(c.id, user, { method: 'comgate-card', purpose: 'deposit' })
  assert.equal(beginCalls, 1)
  passed('pending-payment-resumes-after-jsonb-roundtrip')
  const txn = (await attempts(c.id))[0]
  assert.equal(txn.amountMinor, 10000)
  await Promise.all([
    service.applyOutcome(txn.uuid, { state: 'paid', callbackPayload: {} }),
    service.applyOutcome(txn.uuid, { state: 'paid', callbackPayload: {} }),
  ])
  const deposited = await read(c.id)
  assert.deepEqual(
    deposited.items.map((item) => item.paidMinor),
    [5000, 5000],
  )
  assert.equal(deposited.paymentMethod, 'comgate-card')
  assert.equal(deposited.expiresAt, null)
  passed('payment-callback-race-allocates-deposit-exactly-once')
  await assert.rejects(() => service.begin(c.id, user, { method: 'muzapay', purpose: 'balance' }))
  passed('settled-method-cannot-change-for-balance')
  await service.begin(c.id, user, {
    method: 'comgate-card',
    purpose: 'balance',
    itemIds: [dates[0].id],
  })
  const balance = (await attempts(c.id)).find((t) => t.uuid !== txn.uuid)!
  assert.equal(balance.amountMinor, 14999)
  await service.applyOutcome(balance.uuid, { state: 'paid', callbackPayload: {} })
  const balanced = await read(c.id)
  assert.equal(balanced.items.find((item) => item.eventDateId === dates[0].id)!.paidMinor, 19999)
  assert.equal(balanced.items.find((item) => item.eventDateId === dates[1].id)!.paidMinor, 5000)
  passed('selected-item-balance-preserves-other-item-ledger')
  const refund = [{ eventDateId: dates[0].id, orderId: c.items.find((item) => item.eventDateId === dates[0].id)!.orderId!, amountMinor: 1000 }]
  await Promise.all([
    service.recordRefund(txn.uuid, { id: user.id, role: 'admin' }, 'fixture-refund', refund),
    service.recordRefund(txn.uuid, { id: user.id, role: 'admin' }, 'fixture-refund', refund),
  ])
  assert.equal((await read(c.id)).items.find((item) => item.eventDateId === dates[0].id)!.refundedMinor, 1000)
  passed('concurrent-refund-receipt-records-once-without-provider-call')
  const beforeCapacity = await Promise.all(dates.map((date) => getRemainingCapacity(date.id)))
  await service.cancelPaid(c.id, { id: user.id, role: 'admin' }, 'Fixture selected trip cancellation', [dates[0].id])
  const cancelled = await read(c.id)
  assert(cancelled.items.find((item) => item.eventDateId === dates[0].id)!.cancelledAt)
  assert(!cancelled.items.find((item) => item.eventDateId === dates[1].id)!.cancelledAt)
  assert.equal(cancelled.state, 'reserved')
  assert.equal(await getRemainingCapacity(dates[0].id), beforeCapacity[0] + cancelled.items.find((item) => item.eventDateId === dates[0].id)!.quantity)
  assert.equal(await getRemainingCapacity(dates[1].id), beforeCapacity[1])
  await service.begin(c.id, user, { method: 'comgate-card', purpose: 'balance' })
  const remainingBalance = (await attempts(c.id)).find((t) => t.uuid !== txn.uuid && t.uuid !== balance.uuid)!
  assert.equal(remainingBalance.amountMinor, 14999)
  assert.deepEqual((remainingBalance.allocations as Array<{ eventDateId: number }>).map((row) => row.eventDateId), [dates[1].id])
  await service.applyOutcome(remainingBalance.uuid, { state: 'paid', callbackPayload: {} })
  assert.equal((await payload.findByID({ collection: 'orders', id: cancelled.items.find((item) => item.eventDateId === dates[0].id)!.orderId!, depth: 0 })).state, 'cancelled')
  passed('per-trip-cancellation-releases-only-selected-capacity-and-preserves-other-balance')
  const uncertain = await make()
  await service.begin(uncertain.id, user, { method: 'muzapay', purpose: 'full' })
  await withCheckoutTransaction(payload, (req) =>
    payload.update({
      collection: 'checkouts',
      id: uncertain.id,
      req,
      overrideAccess: true,
      data: { expiresAt: '2028-01-01T00:00:00Z' },
    }),
  )
  await service.expire(uncertain.id)
  assert.equal((await read(uncertain.id)).state, 'reconciliation')
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: uncertain.items[0].orderId!, depth: 0 }))
      .state,
    'pending',
  )
  passed('uncertain-provider-expiry-retains-seats-for-reconciliation')
  poll = { state: 'cancelled', callbackPayload: {} }
  await service.expire(uncertain.id)
  assert.equal((await read(uncertain.id)).state, 'expired')
  passed('confirmed-cancellation-allows-unpaid-hold-expiry')
  const late = (await attempts(uncertain.id))[0]
  await service.applyOutcome(late.uuid, { state: 'paid', callbackPayload: {} })
  assert.equal((await read(uncertain.id)).state, 'reconciliation')
  assert((await read(uncertain.id)).items.every((item) => item.paidCzkMinor === item.totalCzkMinor))
  assert.equal(
    (await payload.findByID({ collection: 'orders', id: uncertain.items[0].orderId!, depth: 0 }))
      .state,
    'cancelled',
  )
  passed('late-payment-recorded-without-reinstating-released-seats')
  await assert.rejects(() =>
    service.begin(
      c.id,
      { id: user.id + 10000, email: 'other@example.invalid' },
      { method: 'comgate-card', purpose: 'full' },
    ),
  )
  passed('checkout-payment-owner-isolation')
}
