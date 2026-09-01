// @vitest-environment node
//
// This spec builds real `Request` objects and calls `.formData()` on them.
// The project's default `jsdom` environment (vitest.config.mts) has patchy
// FormData/Request support in some versions — force the Node environment
// for this file so the webhook parsing is tested against the same
// fetch/Request implementation Next.js route handlers actually run on.
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isPaymentResult,
  PaymentGatewayError,
  type Transaction,
  type TransactionStore,
} from '@/payments/gateway'
import { ComgateGateway } from '@/payments/comgate/gateway'

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: '1',
    uuid: 'uuid-1',
    money: { amount: '199.00', amountWithoutVat: '164.46', currency: 'EUR' },
    label: 'Rockbusters RB-2026-000001',
    email: 'payer@x.test',
    state: 'created',
    paymentMethod: 'comgate-card',
    payload: {},
    callbackPayload: null,
    createdAt: '2026-08-28T00:00:00.000Z',
    updatedAt: '2026-08-28T00:00:00.000Z',
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

function makeGateway(store: TransactionStore) {
  return new ComgateGateway({
    merchant: 'M123',
    secret: 's3cr3t',
    test: true,
    backendBaseUrl: 'https://rockbusters.net',
    store,
  })
}

describe('ComgateGateway.begin', () => {
  it('builds the create request and returns the redirect + gateway id', async () => {
    let capturedBody = ''
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        capturedBody = String(init.body)
        return new Response(
          'code=0&message=OK&transId=ABCD-1234&redirect=https%3A%2F%2Fpayments.comgate.cz%2Fpay%2FABCD-1234',
          {
            status: 200,
          },
        )
      }),
    )

    const gateway = makeGateway(makeStore([]))
    const result = await gateway.begin(makeTransaction())

    expect(result).toEqual({
      redirectUrl: 'https://payments.comgate.cz/pay/ABCD-1234',
      gatewayTransactionId: 'ABCD-1234',
      payload: {
        code: '0',
        message: 'OK',
        transId: 'ABCD-1234',
        redirect: 'https://payments.comgate.cz/pay/ABCD-1234',
        redirectUrl: 'https://payments.comgate.cz/pay/ABCD-1234',
        gatewayTransactionId: 'ABCD-1234',
      },
    })

    const sent = new URLSearchParams(capturedBody)
    expect(sent.get('merchant')).toBe('M123')
    expect(sent.get('secret')).toBe('s3cr3t')
    expect(sent.get('price')).toBe('19900') // 199.00 EUR -> minor units
    expect(sent.get('curr')).toBe('EUR')
    expect(sent.get('refId')).toBe('uuid-1')
    expect(sent.get('prepareOnly')).toBe('true')
    expect(sent.get('test')).toBe('true')
    expect(sent.get('returnUrl')).toBe(
      'https://rockbusters.net/api/payments/comgate/return?refId=uuid-1',
    )
    expect(sent.get('notifyUrl')).toBe('https://rockbusters.net/api/payments/comgate/webhook')
  })

  it('converts the decimal amount to minor units without float drift', async () => {
    let capturedBody = ''
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        capturedBody = String(init.body)
        return new Response(
          'code=0&message=OK&transId=ABCD-1234&redirect=https%3A%2F%2Fpayments.comgate.cz%2Fpay%2FABCD-1234',
          {
            status: 200,
          },
        )
      }),
    )

    const gateway = makeGateway(makeStore([]))
    await gateway.begin(
      makeTransaction({ money: { amount: '19.99', amountWithoutVat: '16.52', currency: 'EUR' } }),
    )

    const sent = new URLSearchParams(capturedBody)
    // Number('19.99') * 100 === 1998.9999999999998 in floating point — this
    // must come out as exactly 1999, not a float-drifted neighbour.
    expect(sent.get('price')).toBe('1999')
  })

  it('rejects a transaction that is not in the created state', async () => {
    const gateway = makeGateway(makeStore([]))
    await expect(gateway.begin(makeTransaction({ state: 'begun' }))).rejects.toThrow(
      PaymentGatewayError,
    )
  })

  it('throws when Comgate returns a non-zero code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('code=1400&message=Invalid merchant', { status: 200 })),
    )
    const gateway = makeGateway(makeStore([]))
    await expect(gateway.begin(makeTransaction())).rejects.toThrow(/Invalid merchant/)
  })
})

describe('ComgateGateway.handleWebhook', () => {
  function webhookRequest(fields: Record<string, string>): Request {
    const body = new URLSearchParams(fields)
    return new Request('https://rockbusters.net/api/payments/comgate/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
  }

  it('maps a PAID webhook to a paid outcome', async () => {
    const txn = makeTransaction({ state: 'begun' })
    const gateway = makeGateway(makeStore([txn]))
    const result = await gateway.handleWebhook(
      webhookRequest({
        merchant: 'M123',
        secret: 's3cr3t',
        refId: 'uuid-1',
        status: 'PAID',
        transId: 'ABCD-1234',
      }),
    )
    expect(result.transactionUuid).toBe('uuid-1')
    expect(result.outcome.state).toBe('paid')
    expect(result.outcome.callbackPayload).toMatchObject({ status: 'PAID', transId: 'ABCD-1234' })
    expect(result.acknowledgement).toEqual({ status: 200, body: 'OK' })
  })

  it('strips merchant/secret from the persisted callbackPayload', async () => {
    const txn = makeTransaction({ state: 'begun' })
    const gateway = makeGateway(makeStore([txn]))
    const result = await gateway.handleWebhook(
      webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: 'uuid-1', status: 'PAID' }),
    )
    expect(result.outcome.callbackPayload).not.toHaveProperty('merchant')
    expect(result.outcome.callbackPayload).not.toHaveProperty('secret')
  })

  it('maps a CANCELLED webhook to a cancelled outcome', async () => {
    const txn = makeTransaction({ state: 'begun' })
    const gateway = makeGateway(makeStore([txn]))
    const result = await gateway.handleWebhook(
      webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: 'uuid-1', status: 'CANCELLED' }),
    )
    expect(result.outcome.state).toBe('cancelled')
  })

  it('is idempotent for a transaction already in a payment-result state', async () => {
    const txn = makeTransaction({ state: 'paid', callbackPayload: { status: 'PAID' } })
    expect(isPaymentResult(txn.state)).toBe(true)
    const gateway = makeGateway(makeStore([txn]))
    const result = await gateway.handleWebhook(
      webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: 'uuid-1', status: 'PAID' }),
    )
    expect(result.outcome.state).toBe('paid')
    expect(result.acknowledgement).toEqual({ status: 200, body: 'OK' })
  })

  it('rejects a merchant/secret mismatch', async () => {
    const gateway = makeGateway(makeStore([makeTransaction({ state: 'begun' })]))
    await expect(
      gateway.handleWebhook(
        webhookRequest({ merchant: 'WRONG', secret: 's3cr3t', refId: 'uuid-1', status: 'PAID' }),
      ),
    ).rejects.toThrow(/Merchant mismatch/)
  })

  it('rejects an unknown refId', async () => {
    const gateway = makeGateway(makeStore([]))
    await expect(
      gateway.handleWebhook(
        webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: 'nope', status: 'PAID' }),
      ),
    ).rejects.toThrow(/not found/i)
  })

  it('rejects a transaction that has not begun yet', async () => {
    const gateway = makeGateway(makeStore([makeTransaction({ state: 'created' })]))
    await expect(
      gateway.handleWebhook(
        webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: 'uuid-1', status: 'PAID' }),
      ),
    ).rejects.toThrow(/cannot be handled/i)
  })
})

describe('ComgateGateway — deferred methods', () => {
  it('handleReturn always resolves null (Comgate confirms via webhook only)', async () => {
    const gateway = makeGateway(makeStore([]))
    await expect(gateway.handleReturn(makeTransaction())).resolves.toBeNull()
  })
  it('checkStatus and cancel are not implemented in this MVP', async () => {
    const gateway = makeGateway(makeStore([]))
    await expect(gateway.checkStatus(makeTransaction())).rejects.toThrow(PaymentGatewayError)
    await expect(gateway.cancel(makeTransaction())).rejects.toThrow(PaymentGatewayError)
  })
})
