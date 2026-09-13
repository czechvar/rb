import { afterEach, describe, expect, it, vi } from 'vitest'
import { ComgateGateway } from '@/payments/comgate/gateway'
import type { Transaction } from '@/payments/gateway'
afterEach(() => vi.unstubAllGlobals())
const transaction: Transaction = {
  id: '1',
  checkoutId: 1,
  uuid: 'fixture-uuid',
  money: { amount: '19.99', amountWithoutVat: '16.52', currency: 'EUR' },
  label: 'Fixture',
  email: 'fixture@example.invalid',
  state: 'begun',
  paymentMethod: 'comgate-card',
  payload: { gatewayTransactionId: 'fixture-id' },
  callbackPayload: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}
const gateway = () =>
  new ComgateGateway({
    merchant: 'fixture-merchant',
    secret: 'fixture-secret',
    test: true,
    backendBaseUrl: 'https://fixture.invalid',
    store: {
      findByUuid: async () => transaction,
      findByGatewayTransactionId: async () => transaction,
    },
  })
const status = (state: string, price = '1999') =>
  `code=0&status=${state}&transId=fixture-id&refId=fixture-uuid&curr=EUR&price=${price}&secret=fixture-secret`
describe('Comgate reconciliation against mocked provider transport', () => {
  it('polls authenticated status, verifies amount and excludes credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(status('PAID'))),
    )
    expect(await gateway().checkStatus(transaction)).toEqual({
      state: 'paid',
      callbackPayload: {
        status: 'PAID',
        transId: 'fixture-id',
        refId: 'fixture-uuid',
        curr: 'EUR',
        price: '1999',
      },
    })
  })
  it('rejects a mismatched amount rather than allocating payment', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(status('PAID', '999'))),
    )
    await expect(gateway().checkStatus(transaction)).rejects.toThrow('mismatch')
  })
  it('rechecks status after cancel race and records the actual paid outcome', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(status('PENDING')))
      .mockResolvedValueOnce(new Response('code=1400'))
      .mockResolvedValueOnce(new Response(status('PAID')))
    vi.stubGlobal('fetch', fetch)
    expect((await gateway().cancel(transaction))?.state).toBe('paid')
    expect(fetch).toHaveBeenCalledTimes(3)
  })
  it('does not cancel an already paid payment', async () => {
    const fetch = vi.fn(async () => new Response(status('PAID')))
    vi.stubGlobal('fetch', fetch)
    expect((await gateway().cancel(transaction))?.state).toBe('paid')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('keeps unknown and pending statuses unresolved', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(status('PENDING'))),
    )
    expect(await gateway().checkStatus(transaction)).toBeNull()
  })
})
