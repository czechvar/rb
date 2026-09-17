import { beforeEach, expect, it, vi } from 'vitest'
import {
  canQuickApproveCheckout,
  matchesOperationFilter,
  operationFilterWhere,
  refundMinor,
  requiresItemFiltering,
} from '@/components/admin/checkouts/operations'
import { adminCheckoutOperationAction } from '@/components/admin/checkouts/actions'
import type { CheckoutRecord } from '@/lib/checkout/types'
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  find: vi.fn(),
  cancel: vi.fn(),
  refund: vi.fn(),
  reconcile: vi.fn(),
  expiry: vi.fn(),
}))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.user, requireUser: mocks.user }))
vi.mock('@/lib/checkout/identity', () => ({ reviewGuestCheckout: vi.fn() }))
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ find: mocks.find }) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/payments/checkout-payment-service', () => ({
  cancelPaidCheckout: mocks.cancel,
  recordCheckoutRefund: mocks.refund,
  reconcileCheckoutPayment: mocks.reconcile,
  reconcileCheckoutExpiry: mocks.expiry,
}))
beforeEach(() => {
  vi.resetAllMocks()
  mocks.user.mockResolvedValue({ id: 1, role: 'admin' })
  mocks.find.mockResolvedValue({
    docs: [{ allocations: [{ eventDateId: 20, orderId: 30, amountMinor: 10000 }] }],
  })
})
function input(operation = 'refund') {
  const data = new FormData()
  data.set('operation', operation)
  data.set('checkoutId', '10')
  data.set('confirmed', 'yes')
  data.set('uuid', '12345678-1234-4234-8234-123456789abc')
  data.set('providerReference', 'provider-refund-1')
  data.set('amount-20', '12.34')
  return data
}
it('parses exact positive currency amounts and rejects exponent/fractional-minor input', () => {
  expect(refundMinor('12.34')).toBe(1234)
  expect(refundMinor('0.01')).toBe(1)
  for (const value of ['1e2', '-1', '0', '1.001', 'Infinity'])
    expect(() => refundMinor(value)).toThrow()
})
it('guards all operations with admin access independently of the public checkout flag', async () => {
  mocks.user.mockResolvedValue({ id: 2, role: 'customer' })
  expect((await adminCheckoutOperationAction({ ok: false }, input())).ok).toBe(false)
  expect(mocks.find).not.toHaveBeenCalled()
  expect(mocks.refund).not.toHaveBeenCalled()
})
it('derives refund order IDs from the original scoped receipt and requires confirmation', async () => {
  const data = input()
  data.set('orderId', '999')
  expect((await adminCheckoutOperationAction({ ok: false }, data)).ok).toBe(true)
  expect(mocks.refund).toHaveBeenCalledWith(
    data.get('uuid'),
    { id: 1, role: 'admin' },
    'provider-refund-1',
    [{ eventDateId: 20, orderId: 30, amountMinor: 1234 }],
  )
  expect(mocks.find.mock.calls[0][0].where.and[1]).toEqual({ checkout: { equals: 10 } })
  mocks.refund.mockClear()
  data.delete('confirmed')
  expect((await adminCheckoutOperationAction({ ok: false }, data)).ok).toBe(false)
  expect(mocks.refund).not.toHaveBeenCalled()
})
it('refuses a receipt from another checkout and suppresses provider error details', async () => {
  mocks.find.mockResolvedValue({ docs: [] })
  expect((await adminCheckoutOperationAction({ ok: false }, input())).ok).toBe(false)
  expect(mocks.refund).not.toHaveBeenCalled()
  mocks.expiry.mockRejectedValue(new Error('private provider diagnostic'))
  const result = await adminCheckoutOperationAction({ ok: false }, input('expiry'))
  expect(JSON.stringify(result)).not.toContain('private provider diagnostic')
})
it('distinguishes unpaid, overdue balances and reconciliation using settled currency', () => {
  const record = {
    state: 'approved',
    paymentMethod: 'muzapay',
    items: [
      {
        paidMinor: 0,
        paidCzkMinor: 500,
        totalMinor: 100,
        totalCzkMinor: 1000,
        balanceDueAt: '2030-01-01',
      },
    ],
  } as CheckoutRecord
  expect(matchesOperationFilter(record, 'unpaid', Date.parse('2030-02-01'))).toBe(false)
  expect(matchesOperationFilter(record, 'balance-due', Date.parse('2030-02-01'))).toBe(true)
  expect(matchesOperationFilter(record, 'balance-due', Date.parse('2029-02-01'))).toBe(false)
  record.state = 'reconciliation'
  expect(matchesOperationFilter(record, 'reconciliation', 0)).toBe(true)
  expect(matchesOperationFilter(record, 'balance-due', Date.parse('2030-02-01'))).toBe(false)
})

it('pushes state-only queue filters into Payload and reserves item scans for JSON predicates', () => {
  expect(operationFilterWhere('waiting-review')).toEqual({ state: { equals: 'awaitingReview' } })
  expect(operationFilterWhere('reconciliation')).toEqual({
    state: { equals: 'reconciliation' },
  })
  expect(operationFilterWhere('unpaid')).toEqual({ state: { in: ['reserved', 'approved'] } })
  expect(operationFilterWhere('all')).toBeUndefined()
  expect(requiresItemFiltering('unpaid')).toBe(true)
  expect(requiresItemFiltering('balance-due')).toBe(true)
  expect(requiresItemFiltering('waiting-review')).toBe(false)
})

it('offers quick approval for every checkout awaiting review', () => {
  const record = { customerKind: 'new', state: 'awaitingReview' } as CheckoutRecord
  expect(canQuickApproveCheckout(record)).toBe(true)
  expect(canQuickApproveCheckout({ ...record, customerKind: 'returning' })).toBe(true)
  expect(canQuickApproveCheckout({ ...record, state: 'approved' })).toBe(false)
})

it('cancels only selected trip IDs and requires a reason and selection', async () => {
  const data = input('cancel')
  data.set('reason', 'Customer requested one trip cancellation')
  expect((await adminCheckoutOperationAction({ ok: false }, data)).ok).toBe(false)
  data.append('itemIds', '20')
  expect((await adminCheckoutOperationAction({ ok: false }, data)).ok).toBe(true)
  expect(mocks.cancel).toHaveBeenCalledWith(
    10,
    { id: 1, role: 'admin' },
    'Customer requested one trip cancellation',
    [20],
  )
})
