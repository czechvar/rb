import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { checkoutEnabled } from '@/lib/checkout/feature'
import { availableCheckoutMethods } from '@/payments/checkout-payment-service'
import type { CheckoutRecord } from '@/lib/checkout/types'
import { checkoutDisplayItem } from '@/components/checkout/presentation'
import { CheckoutPayment, type BillingAddressValues } from '@/components/checkout/CheckoutPayment'
import { ReservationHeader } from '@/components/checkout/ReservationHeader'
import { money, date } from '@/components/checkout/format'
import styles from '@/components/checkout/checkout.module.css'
export const metadata = { title: 'Your reservation — Rockbusters' }
const states = {
  unverified: 'Verify your email',
  awaitingReview: 'Waiting for our review',
  approved: 'Approved — ready for payment',
  reserved: 'Places reserved — payment pending',
  cancelled: 'Cancelled',
  expired: 'Reservation expired',
  reconciliation: 'Staff are checking this reservation',
}
export default async function CheckoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!checkoutEnabled()) notFound()
  const { id } = await params
  if (!/^\d+$/.test(id)) notFound()
  const user = await getCurrentUser()
  if (!user) redirect(`/login?from=${encodeURIComponent(`/account/checkouts/${id}`)}`)
  const payload = await getPayloadClient()
  const rows = await payload.find({
    collection: 'checkouts',
    where: { and: [{ id: { equals: Number(id) } }, { user: { equals: user.id } }] },
    limit: 1,
    depth: 0,
    user,
    overrideAccess: false,
  })
  if (!rows.docs[0]) notFound()
  const checkout = rows.docs[0] as unknown as CheckoutRecord
  const activeItems = checkout.items.filter((item) => !item.cancelledAt)
  const fullyPaid =
    activeItems.length > 0 &&
    activeItems.every((item) =>
      checkout.paymentMethod === 'muzapay'
        ? item.totalCzkMinor != null && item.paidCzkMinor >= item.totalCzkMinor
        : item.paidMinor >= item.totalMinor,
    )
  const partlyPaid = activeItems.some((item) => item.paidMinor > 0 || item.paidCzkMinor > 0)
  // Server request snapshot is serialized to the client so payment amounts hydrate consistently.
  // eslint-disable-next-line react-hooks/purity
  const asOf = Date.now()
  // The expiry sweep runs daily, so a hold can lapse while the state still says reserved; payment is refused then.
  const lapsed = Boolean(checkout.expiresAt) && new Date(checkout.expiresAt!).getTime() <= asOf
  const state = lapsed ? 'expired' : checkout.state
  const active = state === 'reserved' || state === 'approved'
  const statusLabel =
    active && fullyPaid
      ? 'Paid in full'
      : active && partlyPaid
        ? 'Payment received — balance outstanding'
        : states[state]
  const headerTitle = fullyPaid
    ? 'Reservation paid'
    : state === 'cancelled'
      ? 'Reservation cancelled'
      : state === 'awaitingReview'
        ? 'Reservation received'
        : state === 'expired'
          ? 'Reservation expired'
          : state === 'reconciliation'
            ? 'Reservation under review'
            : active
              ? 'Upcoming trips'
              : 'Your reservation'
  const billingAddress =
    checkout.billingAddress &&
    ['firstName', 'lastName', 'street', 'city', 'postalCode', 'country'].every(
      (field) =>
        typeof checkout.billingAddress?.[field] === 'string' &&
        String(checkout.billingAddress[field]).trim(),
    )
      ? (Object.fromEntries(
          ['firstName', 'lastName', 'street', 'city', 'postalCode', 'country'].map((field) => [
            field,
            String(checkout.billingAddress?.[field]),
          ]),
        ) as BillingAddressValues)
      : undefined
  const displayCurrency = checkout.paymentMethod === 'muzapay' ? 'CZK' : checkout.currency
  const totalMinor = activeItems.reduce(
    (sum, item) =>
      sum + (checkout.paymentMethod === 'muzapay' ? item.totalCzkMinor || 0 : item.totalMinor),
    0,
  )
  const paidMinor = activeItems.reduce(
    (sum, item) =>
      sum + (checkout.paymentMethod === 'muzapay' ? item.paidCzkMinor : item.paidMinor),
    0,
  )
  const refundedMinor = activeItems.reduce(
    (sum, item) =>
      sum + (checkout.paymentMethod === 'muzapay' ? item.refundedCzkMinor : item.refundedMinor),
    0,
  )
  const itemBalanceMinor = (item: CheckoutRecord['items'][number]) =>
    Math.max(
      0,
      checkout.paymentMethod === 'muzapay'
        ? (item.totalCzkMinor || 0) - item.paidCzkMinor
        : item.totalMinor - item.paidMinor,
    )
  return (
    <div className={styles.account}>
      <ReservationHeader
        reference={checkout.reference}
        title={headerTitle}
        status={statusLabel}
        expiresAt={lapsed ? null : checkout.expiresAt}
      />
      <div className={styles.layout}>
        <div className={styles.stack}>
          <CheckoutPayment
            asOf={asOf}
            checkoutId={checkout.id}
            state={state}
            currency={checkout.currency}
            items={activeItems.map(checkoutDisplayItem)}
            paymentMethod={checkout.paymentMethod}
            methods={availableCheckoutMethods()}
            billingReady={!!billingAddress}
            billingAddress={billingAddress}
            contactName={checkout.contact.name}
          />
          {lapsed && (
            <p className={styles.notice}>
              This hold has ended, so payment can no longer be started here. Add the trip to your
              cart again, or <Link href="/contact">contact us</Link> and we will help.
            </p>
          )}
          <Link className={`btn-ghost ${styles.button}`} href="/account/checkouts">
            All reservations
          </Link>
        </div>
        <aside className={styles.sidebar} aria-label="Reservation summary">
          <section className={`${styles.panel} ${styles.tripSummary}`}>
            <div className={styles.tripSummaryHeading}>
              <h2 data-type="card-lg">Your trip</h2>
              <span className={styles.orderDetailCount}>
                {checkout.items.length} {checkout.items.length === 1 ? 'trip' : 'trips'}
              </span>
            </div>
            <div className={styles.tripSummaryContent}>
              {checkout.items.map((item) => (
                <div className={styles.tripSummaryItem} key={item.eventDateId}>
                  <h3 className={styles.tripSummaryItemTitle} data-type="card-lg">
                    {item.title}
                  </h3>
                  <p className={styles.muted}>
                    {date(item.dateFrom)} – {date(item.dateTo)}
                  </p>
                  <p className={styles.muted}>
                    {item.quantity} {item.quantity === 1 ? 'participant' : 'participants'}
                    {item.location ? ` · ${item.location}` : ''}
                  </p>
                  {item.cancelledAt && (
                    <p className={styles.muted}>Cancelled {date(item.cancelledAt)}</p>
                  )}
                  {!item.cancelledAt && paidMinor > 0 && itemBalanceMinor(item) > 0 && (
                    <p className={styles.muted}>
                      Balance {money(itemBalanceMinor(item), displayCurrency)} due{' '}
                      {date(item.balanceDueAt)}
                    </p>
                  )}
                  {item.orderId && (
                    <p>
                      <Link href={`/account/orders/${item.orderId}`}>View individual order</Link>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
          <section className={styles.panel}>
            <h2 data-type="card-lg">Order summary</h2>
            <div className={`${styles.row} ${styles.total}`}>
              <span>Total</span>
              <span className={styles.totalAmount}>{money(totalMinor, displayCurrency)}</span>
            </div>
            {paidMinor > 0 && (
              <div className={styles.row}>
                <span>Paid</span>
                <strong>{money(paidMinor, displayCurrency)}</strong>
              </div>
            )}
            {refundedMinor > 0 && (
              <div className={styles.row}>
                <span>Refunded</span>
                <strong>{money(refundedMinor, displayCurrency)}</strong>
              </div>
            )}
            {paidMinor > 0 && (
              <div className={`${styles.row} ${styles.outstanding}`}>
                <strong>Outstanding</strong>
                <strong className={styles.outstandingAmount}>
                  {money(Math.max(0, totalMinor - paidMinor), displayCurrency)}
                </strong>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
