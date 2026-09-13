import type { CheckoutCurrency } from '@/lib/checkout/types'
export const money = (minor: number, currency: CheckoutCurrency) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(minor / 100)
export const date = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

export function checkoutStateLabel(state: string): string {
  return (
    (
      {
        unverified: 'Email verification needed',
        awaitingReview: 'Waiting for review',
        approved: 'Approved',
        reserved: 'Reserved',
        cancelled: 'Cancelled',
        expired: 'Expired',
        reconciliation: 'Staff review in progress',
      } as Record<string, string>
    )[state] || 'Reservation'
  )
}
