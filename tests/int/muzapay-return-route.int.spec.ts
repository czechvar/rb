// @vitest-environment node
//
// Benefit+ has no webhook, so this route is the payer's own path back into the
// site and the first chance to resolve their payment. The identification rules
// are the interesting part: we append `refId` ourselves, but Benefit+ documents
// that it calls the return URL with its own `paymentId` parameter, and does not
// say whether our query string survives. Both must work.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync, randomUUID } from 'node:crypto'
import { getTestPayload } from '../helpers/payload'
import { GET } from '@/app/api/payments/muzapay/return/route'

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

const RETURN_URL = 'https://beta.rockbusters.net/api/payments/muzapay/return'

afterEach(() => {
  vi.unstubAllGlobals()
})

/**
 * Answers the auth call and reports the payment as still in progress, so the
 * status check is exercised without driving any order-state change — these
 * tests are about which transaction the route finds, not about outcomes.
 */
function stubStillInProgress() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).includes('/auth/token')) {
        return new Response(
          JSON.stringify({
            accessToken: 'tok-1',
            validTo: new Date(Date.now() + 600_000).toISOString(),
          }),
          { status: 200 },
        )
      }
      return new Response(JSON.stringify({ paymentState: 'IN_PROGRESS_UNPAID' }), { status: 200 })
    }),
  )
}

const billing = {
  firstName: 'A',
  lastName: 'B',
  street: 'Main 1',
  city: 'Prague',
  postalCode: '11000',
  country: 'CZ',
}

async function seedBegunTransaction(gatewayTransactionId: string) {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: { title: `Return ${unique}`, slug: `return-${unique}`, state: 'published' } as never,
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
      name: 'Return',
      phone: '+420 600 000 070',
      email: `return-${unique}@x.test`,
      password: 'return-test-pwd',
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
  const uuid = randomUUID()
  await payload.create({
    collection: 'transactions',
    data: {
      uuid,
      order: order.id,
      amount: 2490,
      amountWithoutVat: 2057.85,
      currency: 'CZK',
      label: `Return ${unique}`,
      orderReference: order.orderNumber,
      email: user.email,
      state: 'begun',
      paymentMethod: 'muzapay',
      payload: { gatewayTransactionId },
    } as never,
    overrideAccess: true,
  })
  return { uuid, orderId: order.id as number }
}

describe('GET /api/payments/muzapay/return', () => {
  it('finds the transaction by our own refId', async () => {
    stubStillInProgress()
    const { uuid, orderId } = await seedBegunTransaction(`PAY-RET-A-${Date.now()}`)

    const res = await GET(new Request(`${RETURN_URL}?refId=${uuid}`))

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(
      `https://beta.rockbusters.net/account/orders/${orderId}`,
    )
  })

  it("finds the transaction by Benefit+'s paymentId when our refId is absent", async () => {
    // The documented contract: Benefit+ calls the return URL with `paymentId`.
    // If it replaces our query string rather than appending to it, this is the
    // only identifier we get — without the fallback the payer lands on `/`.
    stubStillInProgress()
    const gatewayId = `PAY-RET-B-${Date.now()}`
    const { orderId } = await seedBegunTransaction(gatewayId)

    const res = await GET(new Request(`${RETURN_URL}?paymentId=${gatewayId}`))

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(
      `https://beta.rockbusters.net/account/orders/${orderId}`,
    )
  })

  it('falls back to paymentId when refId is present but unknown', async () => {
    stubStillInProgress()
    const gatewayId = `PAY-RET-C-${Date.now()}`
    const { orderId } = await seedBegunTransaction(gatewayId)

    const res = await GET(
      new Request(`${RETURN_URL}?refId=${randomUUID()}&paymentId=${gatewayId}`),
    )

    expect(res.headers.get('location')).toBe(
      `https://beta.rockbusters.net/account/orders/${orderId}`,
    )
  })

  it('redirects home when neither identifier is present', async () => {
    stubStillInProgress()
    const res = await GET(new Request(RETURN_URL))

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://beta.rockbusters.net/')
  })

  it('redirects home when nothing matches', async () => {
    stubStillInProgress()
    const res = await GET(new Request(`${RETURN_URL}?refId=${randomUUID()}&paymentId=NOPE`))

    expect(res.headers.get('location')).toBe('https://beta.rockbusters.net/')
  })

  it('still redirects the payer when the status check throws', async () => {
    // The sweep is the safety net; a gateway failure must never surface to the
    // payer as an error page.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('MuzaPay unreachable')
      }),
    )
    const { uuid, orderId } = await seedBegunTransaction(`PAY-RET-D-${Date.now()}`)

    const res = await GET(new Request(`${RETURN_URL}?refId=${uuid}`))

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(
      `https://beta.rockbusters.net/account/orders/${orderId}`,
    )
  })
})
