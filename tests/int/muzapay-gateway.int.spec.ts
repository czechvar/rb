// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import { PaymentGatewayError, type Transaction, type TransactionStore } from '@/payments/gateway'
import { MuzaPayGateway, type MuzaPayGatewayConfig } from '@/payments/muzapay/gateway'

afterEach(() => {
  vi.unstubAllGlobals()
})

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: '1',
    uuid: 'uuid-benefit-1',
    money: { amount: '2490.00', amountWithoutVat: '2057.85', currency: 'CZK' },
    label: 'Vysoké Tatry — zimní přechod',
    orderReference: 'RB-2026-000123',
    email: 'payer@x.test',
    state: 'created',
    paymentMethod: 'muzapay',
    payload: {},
    callbackPayload: null,
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
    ...overrides,
  }
}

function makeStore(transactions: Transaction[]): TransactionStore {
  return {
    async findByUuid(uuid) {
      return transactions.find((t) => t.uuid === uuid) ?? null
    },
    async findByGatewayTransactionId(id) {
      return transactions.find((t) => t.payload.gatewayTransactionId === id) ?? null
    },
  }
}

function makeGateway(
  store: TransactionStore = makeStore([]),
  overrides: Partial<MuzaPayGatewayConfig> = {},
) {
  return new MuzaPayGateway({
    baseUrl: 'https://api.gate.int.pay.muza.cz',
    eshopId: 'ESHOP1',
    eshopPassword: 'pw',
    country: 'CZ',
    tokenScope: 'SINGLE_PAYMENT',
    privateKeyPem: privateKey,
    signatureDelimiter: '|',
    productCode: 'LEISURE',
    language: 'cs',
    backendBaseUrl: 'https://beta.rockbusters.net',
    store,
    ...overrides,
  })
}

/**
 * Stubs the auth call, then returns each subsequent response in order.
 * Every MuzaPay call is preceded by a token fetch on a fresh gateway.
 */
function stubMuzaPay(...responses: Response[]) {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const queue = [...responses]
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), init })
      if (String(url).includes('/v2/auth/token')) {
        return new Response(
          JSON.stringify({
            accessToken: 'tok-1',
            validTo: new Date(Date.now() + 600_000).toISOString(),
          }),
          { status: 200 },
        )
      }
      const next = queue.shift()
      if (!next) throw new Error(`Unexpected call to ${url}`)
      return next
    }),
  )
  return calls
}

describe('MuzaPayGateway.begin', () => {
  it('signs and posts the init request, returning the gateway URL', async () => {
    const calls = stubMuzaPay(
      new Response(
        JSON.stringify({
          paymentId: 'PAY-1',
          gatewayUrl: 'https://gate.pay.muza.cz/p/PAY-1',
          currency: 'CZK',
          beneficiaryId: 'BEN-1',
        }),
        { status: 200 },
      ),
    )

    const gateway = makeGateway()
    const result = await gateway.begin(makeTransaction())

    expect(result.redirectUrl).toBe('https://gate.pay.muza.cz/p/PAY-1')
    expect(result.gatewayTransactionId).toBe('PAY-1')

    const init = calls.find((c) => c.url.includes('/v2/payments/init'))
    expect(init).toBeDefined()
    expect(init?.url).toMatch(/\/v2\/payments\/init\?signature=/)

    const headers = init?.init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok-1')
    expect(headers['x-correlation-id']).toBe('uuid-benefit-1')

    // Field order is signature-critical: the body must serialise in exactly
    // this order, because the signature is built over these values in order.
    expect(init?.init.body).toBe(
      JSON.stringify({
        amount: '249000',
        productCode: 'LEISURE',
        orderReferenceCode: 'RB-2026-000123',
        orderDescription: 'Vysoké Tatry — zimní přechod',
        merchantData: Buffer.from('uuid-benefit-1').toString('base64'),
        returnUrl: 'https://beta.rockbusters.net/api/payments/muzapay/return?refId=uuid-benefit-1',
        language: 'cs',
      }),
    )
  })

  it('persists the init response on the payload', async () => {
    stubMuzaPay(
      new Response(
        JSON.stringify({
          paymentId: 'PAY-2',
          gatewayUrl: 'https://gate.pay.muza.cz/p/PAY-2',
          currency: 'CZK',
          beneficiaryId: 'BEN-2',
        }),
        { status: 200 },
      ),
    )
    const result = await makeGateway().begin(makeTransaction())
    expect(result.payload).toMatchObject({
      gatewayTransactionId: 'PAY-2',
      redirectUrl: 'https://gate.pay.muza.cz/p/PAY-2',
      beneficiaryId: 'BEN-2',
      orderReferenceCode: 'RB-2026-000123',
    })
  })

  it('refuses a transaction that has already begun', async () => {
    stubMuzaPay()
    await expect(makeGateway().begin(makeTransaction({ state: 'begun' }))).rejects.toThrow(
      PaymentGatewayError,
    )
  })

  it('refuses a transaction with no order reference', async () => {
    stubMuzaPay()
    await expect(
      makeGateway().begin(makeTransaction({ orderReference: undefined })),
    ).rejects.toThrow(/order reference/i)
  })

  it('throws when the init response is missing required fields', async () => {
    stubMuzaPay(new Response(JSON.stringify({ paymentId: 'PAY-3' }), { status: 200 }))
    await expect(makeGateway().begin(makeTransaction())).rejects.toThrow(/missing/i)
  })

  it('truncates an over-long description to 255 characters', async () => {
    const calls = stubMuzaPay(
      new Response(JSON.stringify({ paymentId: 'P', gatewayUrl: 'https://x', currency: 'CZK' }), {
        status: 200,
      }),
    )
    await makeGateway().begin(makeTransaction({ label: 'x'.repeat(300) }))
    const init = calls.find((c) => c.url.includes('/v2/payments/init'))
    const body = JSON.parse(String(init?.init.body)) as { orderDescription: string }
    expect(body.orderDescription).toHaveLength(255)
  })
})

describe('MuzaPayGateway.checkStatus', () => {
  function begunTransaction() {
    return makeTransaction({
      state: 'begun',
      payload: { gatewayTransactionId: 'PAY-1' },
    })
  }

  it('signs the payment id and queries the state endpoint', async () => {
    const calls = stubMuzaPay(
      new Response(JSON.stringify({ paymentState: 'PAID' }), { status: 200 }),
    )
    const outcome = await makeGateway().checkStatus(begunTransaction())

    const state = calls.find((c) => c.url.includes('/state'))
    expect(state?.url).toMatch(/\/v2\/payments\/PAY-1\/state\?signature=/)
    expect((state?.init.headers as Record<string, string>).Authorization).toBe('Bearer tok-1')
    expect(outcome).toEqual({ state: 'paid', callbackPayload: { paymentState: 'PAID' } })
  })

  it.each([
    ['PAID', 'paid'],
    ['CANCELED', 'cancelled'],
    ['DECLINED', 'failed'],
    ['EXPIRED', 'failed'],
  ])('maps %s to %s', async (paymentState, expected) => {
    stubMuzaPay(new Response(JSON.stringify({ paymentState }), { status: 200 }))
    const outcome = await makeGateway().checkStatus(begunTransaction())
    expect(outcome?.state).toBe(expected)
  })

  it.each(['IN_PROGRESS_UNPAID', 'PENDING_INFO', 'SOMETHING_NEW', ''])(
    'returns null for the non-terminal state %s',
    async (paymentState) => {
      stubMuzaPay(new Response(JSON.stringify({ paymentState }), { status: 200 }))
      expect(await makeGateway().checkStatus(begunTransaction())).toBeNull()
    },
  )

  it('accepts a lower-case state', async () => {
    stubMuzaPay(new Response(JSON.stringify({ paymentState: 'paid' }), { status: 200 }))
    expect((await makeGateway().checkStatus(begunTransaction()))?.state).toBe('paid')
  })

  it('returns null without calling the gateway when the transaction has not begun', async () => {
    const calls = stubMuzaPay()
    expect(await makeGateway().checkStatus(makeTransaction({ state: 'created' }))).toBeNull()
    expect(calls).toHaveLength(0)
  })

  it('throws when the transaction has no gateway payment id', async () => {
    stubMuzaPay()
    await expect(
      makeGateway().checkStatus(makeTransaction({ state: 'begun', payload: {} })),
    ).rejects.toThrow(/payment id/i)
  })
})

describe('MuzaPayGateway.handleWebhook', () => {
  it('refuses — Benefit+ has no webhook', async () => {
    await expect(
      makeGateway().handleWebhook(new Request('https://x/api/payments/muzapay/webhook')),
    ).rejects.toThrow(/does not send webhooks/i)
  })
})

describe('MuzaPayGateway.handleReturn', () => {
  it('delegates to checkStatus rather than trusting the redirect', async () => {
    stubMuzaPay(new Response(JSON.stringify({ paymentState: 'PAID' }), { status: 200 }))
    const outcome = await makeGateway().handleReturn(
      makeTransaction({ state: 'begun', payload: { gatewayTransactionId: 'PAY-1' } }),
    )
    expect(outcome?.state).toBe('paid')
  })
})

describe('MuzaPayGateway.cancel', () => {
  function begunTransaction() {
    return makeTransaction({ state: 'begun', payload: { gatewayTransactionId: 'PAY-1' } })
  }

  it('submits the cancel and reports the confirmed outcome', async () => {
    const calls = stubMuzaPay(
      new Response('', { status: 202 }),
      new Response(JSON.stringify({ paymentState: 'CANCELED' }), { status: 200 }),
    )

    const outcome = await makeGateway().cancel(begunTransaction())

    const cancel = calls.find((c) => c.url.includes('/cancel'))
    expect(cancel?.init.method).toBe('PUT')
    expect(cancel?.url).toMatch(/\/v2\/payments\/PAY-1\/cancel\?signature=/)
    expect(outcome).toEqual({ state: 'cancelled', callbackPayload: { paymentState: 'CANCELED' } })
  })

  it('returns null when the payment did not actually cancel', async () => {
    stubMuzaPay(
      new Response('', { status: 202 }),
      new Response(JSON.stringify({ paymentState: 'IN_PROGRESS_UNPAID' }), { status: 200 }),
    )
    expect(await makeGateway().cancel(begunTransaction())).toBeNull()
  })

  it('reports a payment that turned out to be paid rather than cancelling it', async () => {
    // A race: the payer completed while the sweep decided the payment was stale.
    stubMuzaPay(
      new Response('', { status: 202 }),
      new Response(JSON.stringify({ paymentState: 'PAID' }), { status: 200 }),
    )
    expect((await makeGateway().cancel(begunTransaction()))?.state).toBe('paid')
  })

  it('refuses a transaction that has not begun', async () => {
    stubMuzaPay()
    await expect(makeGateway().cancel(makeTransaction({ state: 'created' }))).rejects.toThrow(
      PaymentGatewayError,
    )
  })
})

describe('MuzaPay token sharing across gateway instances', () => {
  function begunTransactionWithId(paymentId: string) {
    return makeTransaction({ state: 'begun', payload: { gatewayTransactionId: paymentId } })
  }

  it('shares one cached token across two gateways built from the same config', async () => {
    const calls = stubMuzaPay(
      new Response(JSON.stringify({ paymentState: 'PAID' }), { status: 200 }),
      new Response(JSON.stringify({ paymentState: 'PAID' }), { status: 200 }),
    )

    const gateway1 = makeGateway(undefined, { eshopId: 'ESHOP-SHARE-SAME' })
    await gateway1.checkStatus(begunTransactionWithId('PAY-SHARE-1'))

    // A freshly constructed gateway, same credentials — mirrors the
    // per-operation gateway construction pattern used by callers.
    const gateway2 = makeGateway(undefined, { eshopId: 'ESHOP-SHARE-SAME' })
    await gateway2.checkStatus(begunTransactionWithId('PAY-SHARE-1'))

    const authCalls = calls.filter((c) => c.url.includes('/v2/auth/token'))
    expect(authCalls).toHaveLength(1)
  })

  it('authenticates separately for a gateway built with a different eshopId', async () => {
    const calls = stubMuzaPay(
      new Response(JSON.stringify({ paymentState: 'PAID' }), { status: 200 }),
      new Response(JSON.stringify({ paymentState: 'PAID' }), { status: 200 }),
    )

    const gatewayA = makeGateway(undefined, { eshopId: 'ESHOP-SHARE-A' })
    await gatewayA.checkStatus(begunTransactionWithId('PAY-SHARE-2'))

    const gatewayB = makeGateway(undefined, { eshopId: 'ESHOP-SHARE-B' })
    await gatewayB.checkStatus(begunTransactionWithId('PAY-SHARE-2'))

    const authCalls = calls.filter((c) => c.url.includes('/v2/auth/token'))
    expect(authCalls).toHaveLength(2)
  })
})
