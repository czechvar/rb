/** Shared checkout contract. Money is integer minor units; personal data stays server-side. */
export type CheckoutCurrency = 'EUR' | 'CZK'
export type CheckoutMethod = 'comgate-card' | 'muzapay'
export type CheckoutState =
  | 'unverified'
  | 'awaitingReview'
  | 'approved'
  | 'reserved'
  | 'cancelled'
  | 'expired'
  | 'reconciliation'
export interface CartItem {
  eventDateId: number
  quantity: number
}
export interface CheckoutContact {
  name: string
  email: string
  phone: string
}
export interface CheckoutItem extends CartItem {
  cancelledAt?: string
  cancellationReason?: string
  title: string
  dateFrom: string
  dateTo: string
  currency: CheckoutCurrency
  unitMinor: number
  totalMinor: number
  totalCzkMinor: number | null
  depositMinor: number
  depositCzkMinor: number | null
  balanceDueAt: string
  vat: number
  paidMinor: number
  paidCzkMinor: number
  refundedMinor: number
  refundedCzkMinor: number
  orderId?: number
  discountCodeId?: number
  referralId?: number
  discountMinor: number
  discountCommissionMinor: number
  referralCommissionMinor: number
}
export interface CheckoutQuote {
  items: CheckoutItem[]
  currency: CheckoutCurrency
  totalMinor: number
  initialMinor: number
  benefitEligible: boolean
}
export interface CheckoutRecord {
  id: number
  reference: string
  submissionKey: string
  requestDigest: string
  state: CheckoutState
  customerKind: 'new' | 'returning'
  user?: number | { id: number } | null
  contact: CheckoutContact
  items: CheckoutItem[]
  currency: CheckoutCurrency
  billingAddress?: Record<string, unknown> | null
  expiresAt?: string | null
  paymentMethod?: CheckoutMethod | null
  verificationHash?: string | null
  verificationExpiresAt?: string | null
  verifiedAt?: string | null
  notificationStatus?: 'pending' | 'sent' | 'failed' | 'notConfigured'
  invitationHash?: string | null
  invitationExpiresAt?: string | null
  invitedAt?: string | null
  approvedAt?: string | null
  reviewedBy?: number | { id: number } | null
  reviewNote?: string | null
  discountCode?: string | null
  referralCode?: string | null
  reconciliationReason?: string | null
  createdAt: string
  updatedAt: string
}
export interface QuoteInput {
  items: CartItem[]
  discountCode?: string
  referralCode?: string
}
