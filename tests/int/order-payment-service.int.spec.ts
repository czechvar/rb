// @vitest-environment node
//
// See the same note in comgate-gateway.int.spec.ts — this spec also builds
// real `Request` objects and relies on `.formData()`.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import { beginComgatePayment, applyComgateWebhook } from '@/payments/order-payment-service'

process.env.COMGATE_MERCHANT = 'M123'
process.env.COMGATE_SECRET = 's3cr3t'
process.env.COMGATE_TEST_MODE = 'true'
process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net'

afterEach(() => {
  vi.unstubAllGlobals()
})

const baseBilling = {
  firstName: 'A',
  lastName: 'B',
  street: 'Main 1',
  city: 'Prague',
  postalCode: '11000',
  country: 'CZ',
}

async function seedOrder() {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: { title: `PayTest ${unique}`, slug: `paytest-${unique}`, state: 'published' },
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
    },
  })
  const user = await payload.create({
    collection: 'users',
    data: {
      name: 'Payer',
      phone: '+420 600 000 030',
      email: `payer-${Date.now()}-${Math.random()}@x.test`,
      password: 'pay-test-pwd',
      role: 'customer',
      _verified: true,
    } as never,
  })
  const order = await payload.create({
    collection: 'orders',
    data: {
      user: user.id,
      eventDate: ed.id,
      participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
      billingAddress: baseBilling,
      unitPrice: 100,
      vat: 21,
      currency: 'EUR',
      state: 'pending',
    } as never,
    overrideAccess: true,
  })
  return { user, order }
}

function stubComgateCreate(response: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(response, { status: 200 })),
  )
}

describe('beginComgatePayment', () => {
  it('creates a transaction, calls Comgate, and returns the redirect URL', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder()
    stubComgateCreate(
      'code=0&message=OK&transId=TXN-1&redirect=https%3A%2F%2Fpayments.comgate.cz%2Fpay%2FTXN-1',
    )

    const { redirectUrl } = await beginComgatePayment(order.id, { id: user.id, email: user.email })
    expect(redirectUrl).toBe('https://payments.comgate.cz/pay/TXN-1')

    const { docs } = await payload.find({
      collection: 'transactions',
      where: { order: { equals: order.id } },
      overrideAccess: true,
    })
    expect(docs).toHaveLength(1)
    expect(docs[0].state).toBe('begun')
    expect(docs[0].payload).toMatchObject({ gatewayTransactionId: 'TXN-1' })
    // order.totalPrice=100, vat=21 -> 100/1.21 = 82.644628... which must be rounded
    // to a clean 2dp value before persisting, not stored with float noise.
    expect(docs[0].amountWithoutVat).toBe(82.64)

    const refreshedOrder = await payload.findByID({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
    })
    expect(refreshedOrder.state).toBe('pending') // begin() never touches order state
  })

  it("refuses to start a payment for someone else's order", async () => {
    const { order } = await seedOrder()
    stubComgateCreate('code=0&message=OK&transId=TXN-2&redirect=https%3A%2F%2Fx')
    await expect(
      beginComgatePayment(order.id, { id: 999_999, email: 'attacker@x.test' }),
    ).rejects.toThrow()
  })
})

describe('applyComgateWebhook', () => {
  async function beginAndGetUuid(orderId: number, user: { id: number; email: string }) {
    stubComgateCreate(
      'code=0&message=OK&transId=TXN-3&redirect=https%3A%2F%2Fpayments.comgate.cz%2Fpay%2FTXN-3',
    )
    await beginComgatePayment(orderId, user)
    const payload = await getTestPayload()
    const { docs } = await payload.find({
      collection: 'transactions',
      where: { order: { equals: orderId } },
      overrideAccess: true,
      sort: '-createdAt',
      limit: 1,
    })
    return docs[0].uuid as string
  }

  function webhookRequest(fields: Record<string, string>): Request {
    return new Request('https://rockbusters.net/api/payments/comgate/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    })
  }

  it('chains pending -> confirmed -> paid on a PAID webhook', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder()
    const uuid = await beginAndGetUuid(order.id, { id: user.id, email: user.email })

    const response = await applyComgateWebhook(
      webhookRequest({
        merchant: 'M123',
        secret: 's3cr3t',
        refId: uuid,
        status: 'PAID',
        transId: 'TXN-3',
      }),
    )
    expect(response.status).toBe(200)

    const refreshedOrder = await payload.findByID({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
    })
    expect(refreshedOrder.state).toBe('paid')

    const txn = await payload.find({
      collection: 'transactions',
      where: { uuid: { equals: uuid } },
      overrideAccess: true,
    })
    expect(txn.docs[0].state).toBe('paid')
  })

  it('moves the order to cancelled on a CANCELLED webhook', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder()
    const uuid = await beginAndGetUuid(order.id, { id: user.id, email: user.email })

    await applyComgateWebhook(
      webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: uuid, status: 'CANCELLED' }),
    )
    const refreshedOrder = await payload.findByID({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
    })
    expect(refreshedOrder.state).toBe('cancelled')
  })

  it('is idempotent — a duplicate PAID webhook does not re-run the order transition', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder()
    const uuid = await beginAndGetUuid(order.id, { id: user.id, email: user.email })

    await applyComgateWebhook(
      webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: uuid, status: 'PAID' }),
    )
    const secondResponse = await applyComgateWebhook(
      webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: uuid, status: 'PAID' }),
    )
    expect(secondResponse.status).toBe(200)
    const refreshedOrder = await payload.findByID({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
    })
    expect(refreshedOrder.state).toBe('paid') // not re-thrown as an invalid same-state transition
  })
})
