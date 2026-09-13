import type { CheckoutRecord } from '@/lib/checkout/types'

export const operationFilters = [
  'all',
  'waiting-review',
  'unpaid',
  'balance-due',
  'reconciliation',
] as const
export type OperationFilter = (typeof operationFilters)[number]
export function matchesOperationFilter(
  record: CheckoutRecord,
  filter: OperationFilter,
  now: number,
) {
  if (filter === 'all') return true
  if (filter === 'waiting-review') return record.state === 'awaitingReview'
  if (filter === 'reconciliation') return record.state === 'reconciliation'
  if (!['reserved', 'approved'].includes(record.state)) return false
  const activeItems = record.items.filter((item) => !item.cancelledAt)
  if (!activeItems.length) return false
  if (filter === 'unpaid')
    return activeItems.every((item) => item.paidMinor === 0 && item.paidCzkMinor === 0)
  return activeItems.some((item) => {
    const paid = record.paymentMethod === 'muzapay' ? item.paidCzkMinor : item.paidMinor
    const total = record.paymentMethod === 'muzapay' ? item.totalCzkMinor : item.totalMinor
    return (
      total !== null && paid > 0 && paid < total && new Date(item.balanceDueAt).getTime() <= now
    )
  })
}
/** Parse authored currency units without floating-point multiplication or exponent notation. */
export function refundMinor(value: string): number {
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(value))
    throw new Error('Enter a positive currency amount with at most two decimal places.')
  const [whole, fraction = ''] = value.split('.')
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(minor) || minor <= 0)
    throw new Error('Enter a positive currency amount.')
  return minor
}
