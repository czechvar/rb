import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import type { CheckoutItem, CheckoutRecord } from '@/lib/checkout/types'
import { applyAllocations, paymentAllocations, sameAllocations } from '@/payments/checkout-ledger'
import { createCheckoutPaymentService } from '@/payments/checkout-payment-service'

vi.mock('@/lib/payload', () => ({ getPayloadClient: vi.fn() }))
vi.mock('@/lib/checkout/transaction', () => ({
  withCheckoutTransaction: async (payload: unknown, work: (req: unknown) => unknown) =>
    work({ payload, transactionID: 'fixture', context: { checkoutEngine: true } }),
  lockCheckout: vi.fn(),
  checkoutDatabase: async () => ({ execute: vi.fn() }),
}))
vi.mock('@/lib/checkout/reservations', () => ({
  validateCheckoutBilling: vi.fn(),
  cancelCheckoutInTransaction: async (
    req: { payload: Payload },
    checkout: CheckoutRecord,
    reason: string,
    state: 'cancelled' | 'expired',
  ) =>
    req.payload.update({
      collection: 'checkouts',
      id: checkout.id,
      data: { state, reconciliationReason: reason },
      req: req as never,
    }),
}))
const now = new Date('2026-01-01T00:00:00Z')
function item(id = 10): CheckoutItem {
  return {
    eventDateId: id,
    orderId: id,
    quantity: 1,
    title: 'Fixture trip',
    dateFrom: '2026-06-01',
    dateTo: '2026-06-08',
    currency: 'EUR',
    unitMinor: 10001,
    totalMinor: 10001,
    totalCzkMinor: 250001,
    depositMinor: 2500,
    depositCzkMinor: 62500,
    balanceDueAt: '2026-05-02',
    vat: 21,
    paidMinor: 0,
    paidCzkMinor: 0,
    refundedMinor: 0,
    refundedCzkMinor: 0,
    discountMinor: 0,
    discountCommissionMinor: 0,
    referralCommissionMinor: 0,
  }
}
function checkout(): CheckoutRecord {
  return {
    id: 1,
    reference: 'FIXTURE',
    submissionKey: 'fixture',
    requestDigest: 'fixture',
    state: 'reserved',
    customerKind: 'returning',
    user: 1,
    contact: { name: 'Fixture', email: 'fixture@example.invalid', phone: '+420000000001' },
    items: [item()],
    currency: 'EUR',
    expiresAt: '2026-01-02T00:00:00Z',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}
describe('checkout payment allocation ledger', () => {
  it('selects exact deposit minor units and full amount at the balance deadline', () => {
    const c = checkout()
    c.items.push({ ...item(11), balanceDueAt: '2026-01-01' })
    expect(
      paymentAllocations(c, 'comgate-card', 'deposit', undefined, now).map((a) => a.amountMinor),
    ).toEqual([2500, 10001])
    c.items[0].paidMinor = 2500
    expect(paymentAllocations(c, 'comgate-card', 'balance', [10], now)[0].amountMinor).toBe(7501)
  })
  it('uses authored CZK, rejects switching and invalid selections', () => {
    const c = checkout()
    expect(paymentAllocations(c, 'muzapay', 'deposit', undefined, now)[0].amountMinor).toBe(62500)
    c.paymentMethod = 'comgate-card'
    expect(() => paymentAllocations(c, 'muzapay', 'full')).toThrow()
    expect(() => paymentAllocations(c, 'comgate-card', 'full', [999])).toThrow()
  })
  it('requires all initial obligations for either method and any purpose', () => {
    const c = checkout()
    c.items.push(item(11))
    for (const method of ['comgate-card', 'muzapay'] as const)
      for (const purpose of ['full', 'deposit', 'balance'] as const) {
        expect(() => paymentAllocations(c, method, purpose, [10], now)).toThrow('every trip')
        expect(paymentAllocations(c, method, purpose, [11, 10], now)).toHaveLength(2)
      }
  })
  it('blocks first payment after departure but preserves later balance collection', () => {
    const c = checkout()
    c.items[0].dateFrom = now.toISOString()
    for (const purpose of ['full', 'deposit', 'balance'] as const)
      expect(() => paymentAllocations(c, 'comgate-card', purpose, undefined, now)).toThrow('already started')
    c.items[0].paidMinor = 2500
    expect(paymentAllocations(c, 'comgate-card', 'balance', undefined, now)[0].amountMinor).toBe(7501)
  })
  it('excludes cancelled trips from new payments and initial obligations', () => {
    const c = checkout()
    c.items.push({ ...item(11), cancelledAt: now.toISOString() })
    expect(paymentAllocations(c, 'comgate-card', 'deposit', [10], now)).toHaveLength(1)
    expect(() => paymentAllocations(c, 'comgate-card', 'balance', [11], now)).toThrow('selection')
    c.items[0].paidMinor = 2500
    expect(paymentAllocations(c, 'comgate-card', 'balance', undefined, now)).toEqual([
      { eventDateId: 10, orderId: 10, amountMinor: 7501 },
    ])
  })
  it('compares allocations semantically after JSONB property reordering', () => {
    const a = [{ eventDateId: 10, orderId: 20, amountMinor: 100 }]
    expect(sameAllocations(a, [{ amountMinor: 100, orderId: 20, eventDateId: 10 }])).toBe(true)
    expect(sameAllocations(a, [{ amountMinor: 101, orderId: 20, eventDateId: 10 }])).toBe(false)
  })
  it('records overpayments without silently truncating incoming money', () => {
    const result = applyAllocations(
      [item()],
      [{ eventDateId: 10, orderId: 10, amountMinor: 10002 }],
      'comgate-card',
    )
    expect(result.overpaid).toBe(true)
    expect(result.items[0].paidMinor).toBe(10002)
  })
})
describe('checkout payment service with isolated provider/persistence adapters', () => {
  let c: CheckoutRecord
  let txns: Record<string, unknown>[]
  let order: { id: number; state: string }
  let gateway: {
    begin: ReturnType<typeof vi.fn>
    checkStatus: ReturnType<typeof vi.fn>
    cancel: ReturnType<typeof vi.fn>
    handleReturn: ReturnType<typeof vi.fn>
    handleWebhook: ReturnType<typeof vi.fn>
  }
  let service: ReturnType<typeof createCheckoutPaymentService>
  beforeEach(() => {
    c = checkout()
    txns = []
    order = { id: 10, state: 'pending' }
    gateway = {
      begin: vi.fn(async () => ({
        redirectUrl: 'https://provider.invalid/pay',
        gatewayTransactionId: 'fixture-provider',
        payload: {
          redirectUrl: 'https://provider.invalid/pay',
          gatewayTransactionId: 'fixture-provider',
        },
      })),
      checkStatus: vi.fn(async () => null),
      cancel: vi.fn(async () => null),
      handleReturn: vi.fn(),
      handleWebhook: vi.fn(),
    }
    const payload = {
      findByID: vi.fn(async ({ collection, id }) =>
        structuredClone(
          collection === 'checkouts'
            ? c
            : collection === 'orders'
              ? order
              : txns.find((t) => t.id === id),
        ),
      ),
      find: vi.fn(async ({ where }) => ({
        docs: structuredClone(where.uuid ? txns.filter((t) => t.uuid === where.uuid.equals) : txns),
      })),
      create: vi.fn(async ({ data, req }) => {
        expect(req.transactionID).toBe('fixture')
        const t = {
          id: txns.length + 1,
          ...data,
          payload: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        }
        txns.push(t)
        return structuredClone(t)
      }),
      update: vi.fn(async ({ collection, id, data, req }) => {
        expect(req.transactionID).toBe('fixture')
        const target =
          collection === 'checkouts'
            ? c
            : collection === 'orders'
              ? order
              : txns.find((t) => t.id === id)
        Object.assign(target!, data)
        return structuredClone(target)
      }),
    } as unknown as Payload
    service = createCheckoutPaymentService({
      payload,
      gateways: () => gateway as import('@/payments/gateway').PaymentGateway,
      now: () => now,
      enabled: () => true,
    })
  })
  const full = { method: 'comgate-card' as const, purpose: 'full' as const }
  it('resumes the same open attempt, then allocates a paid outcome once', async () => {
    await service.begin(1, { id: 1, email: c.contact.email }, full)
    await service.begin(1, { id: 1, email: c.contact.email }, full)
    expect(gateway.begin).toHaveBeenCalledTimes(1)
    const uuid = txns[0].uuid as string
    await service.applyOutcome(uuid, { state: 'paid', callbackPayload: {} })
    await service.applyOutcome(uuid, { state: 'paid', callbackPayload: {} })
    expect(c.items[0].paidMinor).toBe(10001)
    expect(order.state).toBe('paid')
    expect(c.paymentMethod).toBe('comgate-card')
  })
  it('records late money allocated to a cancelled item without reviving its order', async () => {
    await service.begin(1, { id: 1, email: c.contact.email }, full)
    c.items[0].cancelledAt = now.toISOString()
    order.state = 'cancelled'
    await service.applyOutcome(txns[0].uuid as string, { state: 'paid', callbackPayload: {} })
    expect(c.items[0].paidMinor).toBe(10001)
    expect(c.state).toBe('reconciliation')
    expect(order.state).toBe('cancelled')
  })
  it('rejects other owners and does not cancel a reservation after a failed attempt', async () => {
    await expect(service.begin(1, { id: 2, email: 'other@example.invalid' }, full)).rejects.toThrow(
      'belong',
    )
    await service.begin(1, { id: 1, email: c.contact.email }, full)
    await service.applyOutcome(txns[0].uuid as string, { state: 'cancelled', callbackPayload: {} })
    expect(c.state).toBe('reserved')
    expect(order.state).toBe('pending')
  })
  it('retains a paid deposit and enforces the original method for its balance', async () => {
    await service.begin(
      1,
      { id: 1, email: c.contact.email },
      { method: 'muzapay', purpose: 'deposit' },
    )
    await service.applyOutcome(txns[0].uuid as string, { state: 'paid', callbackPayload: {} })
    expect(c.items[0].paidCzkMinor).toBe(62500)
    expect(order.state).toBe('confirmed')
    expect(c.expiresAt).toBeNull()
    await expect(service.begin(1, { id: 1, email: c.contact.email }, full)).rejects.toThrow(
      'original',
    )
  })
  it('queues uncertain initiation instead of creating another charge or releasing seats', async () => {
    gateway.begin.mockRejectedValue(new Error('fixture transport failure'))
    await expect(service.begin(1, { id: 1, email: c.contact.email }, full)).rejects.toThrow(
      'retained',
    )
    expect(c.state).toBe('reconciliation')
    expect(order.state).toBe('pending')
    expect(txns[0].state).toBe('created')
  })
  it('records a late payment and requests reconciliation without restoring cancelled orders', async () => {
    await service.begin(1, { id: 1, email: c.contact.email }, full)
    c.state = 'cancelled'
    order.state = 'cancelled'
    txns[0].state = 'cancelled'
    await service.applyOutcome(txns[0].uuid as string, { state: 'paid', callbackPayload: {} })
    expect(c.state).toBe('reconciliation')
    expect(c.items[0].paidMinor).toBe(10001)
    expect(order.state).toBe('cancelled')
  })
  it('queues pending expiry, but releases only after a confirmed terminal provider outcome', async () => {
    await service.begin(1, { id: 1, email: c.contact.email }, full)
    c.expiresAt = '2025-12-31'
    await service.expire(1)
    expect(c.state).toBe('reconciliation')
    expect(gateway.cancel).toHaveBeenCalledTimes(1)
    gateway.checkStatus.mockResolvedValue({ state: 'cancelled', callbackPayload: {} })
    await service.expire(1)
    expect(c.state).toBe('expired')
  })
  it('records a manual refund receipt idempotently and rejects over-refunds', async () => {
    await service.begin(1, { id: 1, email: c.contact.email }, full)
    const uuid = txns[0].uuid as string
    await service.applyOutcome(uuid, { state: 'paid', callbackPayload: {} })
    const allocations = [{ eventDateId: 10, orderId: 10, amountMinor: 5000 }]
    await service.recordRefund(uuid, { id: 1, role: 'admin' }, 'fixture-receipt', allocations)
    await service.recordRefund(uuid, { id: 1, role: 'admin' }, 'fixture-receipt', allocations)
    expect(c.items[0].refundedMinor).toBe(5000)
    await expect(
      service.recordRefund(uuid, { id: 1, role: 'admin' }, 'second', [
        { ...allocations[0], amountMinor: 6000 },
      ]),
    ).rejects.toThrow('exceeds')
  })
})
