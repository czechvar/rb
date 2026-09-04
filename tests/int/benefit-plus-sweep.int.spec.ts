// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync, randomUUID } from 'node:crypto'
import { getTestPayload } from '../helpers/payload'
import { sweepBenefitPlusPayments } from '@/payments/order-payment-service'

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

process.env.MUZAPAY_BASE_URL = 'https://api.gate.int.pay.muza.cz'
process.env.MUZAPAY_ESHOP_ID = 'ESHOP1'
process.env.MUZAPAY_ESHOP_PASSWORD = 'pw'
process.env.MUZAPAY_PRIVATE_KEY = Buffer.from(privateKey).toString('base64')
process.env.NEXT_PUBLIC_SITE_URL = 'https://beta.rockbusters.net'

afterEach(() => {
  vi.unstubAllGlobals()
})

const billing = {
  firstName: 'A',
  lastName: 'B',
  street: 'Main 1',
  city: 'Prague',
  postalCode: '11000',
  country: 'CZ',
}

/** Seeds an order plus a `begun` muzapay transaction, bypassing the gateway. */
async function seedBegunTransaction(paymentId: string) {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: { title: `Sweep ${unique}`, slug: `sweep-${unique}`, state: 'published' } as never,
    overrideAccess: true,
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-05-01T00:00:00.000Z',
      dateTo: '2027-05-05T00:00:00.000Z',
      price: 100,
      priceCzk: 2490,
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
      name: 'Sweep',
      phone: '+420 600 000 060',
      email: `sweep-${unique}@x.test`,
      password: 'sweep-test-pwd',
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
      unitPriceCzk: 2490,
      vat: 21,
      currency: 'EUR',
      state: 'pending',
    } as never,
    overrideAccess: true,
  })
  const txn = await payload.create({
    collection: 'transactions',
    data: {
      uuid: randomUUID(),
      order: order.id,
      amount: 2490,
      amountWithoutVat: 2057.85,
      currency: 'CZK',
      label: `Sweep ${unique}`,
      orderReference: order.orderNumber,
      email: user.email,
      state: 'begun',
      paymentMethod: 'muzapay',
      payload: { gatewayTransactionId: paymentId },
    } as never,
    overrideAccess: true,
  })
  return { orderId: order.id as number, txnId: txn.id as number }
}

function stubStates(byPaymentId: Record<string, string>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const u = String(url)
      if (u.includes('/v2/auth/token')) {
        return new Response(
          JSON.stringify({
            accessToken: 'tok-1',
            validTo: new Date(Date.now() + 600_000).toISOString(),
          }),
          { status: 200 },
        )
      }
      const match = u.match(/\/v2\/payments\/([^/]+)\//)
      const paymentState = match ? byPaymentId[match[1]] : undefined
      if (!paymentState) return new Response('{}', { status: 404 })
      return new Response(JSON.stringify({ paymentState }), { status: 200 })
    }),
  )
}

async function orderState(orderId: number): Promise<string> {
  const payload = await getTestPayload()
  const o = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
  return o.state as string
}

describe('sweepBenefitPlusPayments', () => {
  it('resolves a payment that completed after the payer closed the tab', async () => {
    const id = `PAY-SWEEP-${Date.now()}`
    const { orderId } = await seedBegunTransaction(id)
    stubStates({ [id]: 'PAID' })

    const summary = await sweepBenefitPlusPayments()

    expect(summary.checked).toBeGreaterThanOrEqual(1)
    expect(await orderState(orderId)).toBe('paid')
  })

  it('leaves an in-progress payment alone', async () => {
    const id = `PAY-INPROG-${Date.now()}`
    const { orderId } = await seedBegunTransaction(id)
    stubStates({ [id]: 'IN_PROGRESS_UNPAID' })

    await sweepBenefitPlusPayments()

    expect(await orderState(orderId)).toBe('pending')
  })

  it('keeps going when one transaction throws', async () => {
    const good = `PAY-GOOD-${Date.now()}`
    const bad = `PAY-BAD-${Date.now()}`
    const { orderId: goodOrder } = await seedBegunTransaction(good)
    await seedBegunTransaction(bad)
    // `bad` is absent from the map, so its state call 404s and throws.
    stubStates({ [good]: 'PAID' })

    const summary = await sweepBenefitPlusPayments()

    expect(summary.failed).toBeGreaterThanOrEqual(1)
    expect(await orderState(goodOrder)).toBe('paid')
  })
})
