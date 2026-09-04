// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import { PaymentGatewayError, type Transaction, type TransactionStore } from '@/payments/gateway'
import { MuzaPayGateway } from '@/payments/muzapay/gateway'

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

function makeGateway(store: TransactionStore = makeStore([])) {
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
        returnUrl:
          'https://beta.rockbusters.net/api/payments/muzapay/return?refId=uuid-benefit-1',
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
    await expect(
      makeGateway().begin(makeTransaction({ state: 'begun' })),
    ).rejects.toThrow(PaymentGatewayError)
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
      new Response(
        JSON.stringify({ paymentId: 'P', gatewayUrl: 'https://x', currency: 'CZK' }),
        { status: 200 },
      ),
    )
    await makeGateway().begin(makeTransaction({ label: 'x'.repeat(300) }))
    const init = calls.find((c) => c.url.includes('/v2/payments/init'))
    const body = JSON.parse(String(init?.init.body)) as { orderDescription: string }
    expect(body.orderDescription).toHaveLength(255)
  })
})
