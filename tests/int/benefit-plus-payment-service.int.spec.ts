// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import { getTestPayload } from '../helpers/payload'
import {
  beginBenefitPlusPayment,
  resolveBenefitPlusPayment,
} from '@/payments/order-payment-service'

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

async function seedOrder({ priceCzk }: { priceCzk: number | null }) {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: { title: `Benefit ${unique}`, slug: `benefit-${unique}`, state: 'published' } as never,
    overrideAccess: true,
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-05-01T00:00:00.000Z',
      dateTo: '2027-05-05T00:00:00.000Z',
      price: 100,
      priceCzk: priceCzk ?? undefined,
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
      name: 'Benefit Payer',
      phone: '+420 600 000 050',
      email: `benefit-${unique}@x.test`,
      password: 'benefit-test-pwd',
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
      unitPriceCzk: priceCzk ?? null,
      vat: 21,
      currency: 'EUR',
      state: 'pending',
    } as never,
    overrideAccess: true,
  })
  return { user, order, eventTitle: `Benefit ${unique}` }
}

function stubInit() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).includes('/v2/auth/token')) {
        return new Response(
          JSON.stringify({
            accessToken: 'tok-1',
            validTo: new Date(Date.now() + 600_000).toISOString(),
          }),
          { status: 200 },
        )
      }
      return new Response(
        JSON.stringify({
          paymentId: 'PAY-SVC-1',
          gatewayUrl: 'https://gate.pay.muza.cz/p/PAY-SVC-1',
          currency: 'CZK',
          beneficiaryId: 'BEN-1',
        }),
        { status: 200 },
      )
    }),
  )
}

describe('beginBenefitPlusPayment', () => {
  it('creates a CZK transaction and returns the gateway URL', async () => {
    const payload = await getTestPayload()
    const { user, order, eventTitle } = await seedOrder({ priceCzk: 2490 })
    stubInit()

    const { redirectUrl } = await beginBenefitPlusPayment(order.id, {
      id: user.id,
      email: user.email,
    })
    expect(redirectUrl).toBe('https://gate.pay.muza.cz/p/PAY-SVC-1')

    const { docs } = await payload.find({
      collection: 'transactions',
      where: { order: { equals: order.id } },
      overrideAccess: true,
    })
    expect(docs).toHaveLength(1)
    expect(docs[0].state).toBe('begun')
    expect(docs[0].paymentMethod).toBe('muzapay')
    expect(docs[0].currency).toBe('CZK')
    expect(docs[0].amount).toBe(2490)
    // 2490 / 1.21 = 2057.851... rounded to 2dp before persisting.
    expect(docs[0].amountWithoutVat).toBe(2057.85)
    // The label is what the payer sees on the gateway.
    expect(docs[0].label).toBe(eventTitle)
    expect(docs[0].orderReference).toBe(order.orderNumber)

    const refreshed = await payload.findByID({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
    })
    expect(refreshed.state).toBe('pending') // begin() never touches order state
  })

  it('refuses when the trip has no CZK price', async () => {
    const { user, order } = await seedOrder({ priceCzk: null })
    stubInit()
    await expect(
      beginBenefitPlusPayment(order.id, { id: user.id, email: user.email }),
    ).rejects.toThrow(/Benefit\+/i)
  })

  it("refuses someone else's order", async () => {
    const { order } = await seedOrder({ priceCzk: 2490 })
    stubInit()
    await expect(
      beginBenefitPlusPayment(order.id, { id: 999_999, email: 'attacker@x.test' }),
    ).rejects.toThrow()
  })

  it('refuses an order that is already paid', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder({ priceCzk: 2490 })
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { state: 'confirmed' },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { state: 'paid' },
      overrideAccess: true,
    })
    stubInit()
    await expect(
      beginBenefitPlusPayment(order.id, { id: user.id, email: user.email }),
    ).rejects.toThrow(/cannot be paid/i)
  })
})

function stubState(paymentState: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).includes('/v2/auth/token')) {
        return new Response(
          JSON.stringify({
            accessToken: 'tok-1',
            validTo: new Date(Date.now() + 600_000).toISOString(),
          }),
          { status: 200 },
        )
      }
      return new Response(JSON.stringify({ paymentState }), { status: 200 })
    }),
  )
}

async function begunTransactionUuid(orderId: number, user: { id: number; email: string }) {
  stubInit()
  await beginBenefitPlusPayment(orderId, user)
  const payload = await getTestPayload()
  const { docs } = await payload.find({
    collection: 'transactions',
    where: { order: { equals: orderId } },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
  })
  return docs[0].uuid as string
}

describe('resolveBenefitPlusPayment', () => {
  it('marks the order paid when the gateway reports PAID', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder({ priceCzk: 2490 })
    const uuid = await begunTransactionUuid(order.id, { id: user.id, email: user.email })

    stubState('PAID')
    await resolveBenefitPlusPayment(uuid)

    const refreshed = await payload.findByID({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
    })
    expect(refreshed.state).toBe('paid')
  })

  it('leaves the order pending while the payment is in progress', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder({ priceCzk: 2490 })
    const uuid = await begunTransactionUuid(order.id, { id: user.id, email: user.email })

    stubState('IN_PROGRESS_UNPAID')
    await resolveBenefitPlusPayment(uuid)

    const refreshed = await payload.findByID({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
    })
    expect(refreshed.state).toBe('pending')
  })

  it('leaves the order payable after a decline', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder({ priceCzk: 2490 })
    const uuid = await begunTransactionUuid(order.id, { id: user.id, email: user.email })

    stubState('DECLINED')
    await resolveBenefitPlusPayment(uuid)

    const refreshed = await payload.findByID({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
    })
    expect(refreshed.state).toBe('pending')
    const { docs } = await payload.find({
      collection: 'transactions',
      where: { uuid: { equals: uuid } },
      overrideAccess: true,
    })
    expect(docs[0].state).toBe('failed')
  })

  it('is a no-op for an unknown uuid', async () => {
    stubState('PAID')
    await expect(resolveBenefitPlusPayment('no-such-uuid')).resolves.toBeUndefined()
  })
})
