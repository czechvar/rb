import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { checkoutEnabled } from '@/lib/checkout/feature'
import { availableCheckoutMethods } from '@/payments/checkout-payment-service'
import type { CheckoutRecord } from '@/lib/checkout/types'
import { checkoutDisplayItem } from '@/components/checkout/presentation'
import { CheckoutPayment } from '@/components/checkout/CheckoutPayment'
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
  const active = checkout.state === 'reserved' || checkout.state === 'approved'
  const statusLabel =
    active && fullyPaid
      ? 'Paid in full'
      : active && partlyPaid
        ? 'Payment received — balance outstanding'
        : states[checkout.state]
  // Server request snapshot is serialized to the client so payment amounts hydrate consistently.
  // eslint-disable-next-line react-hooks/purity
  const asOf = Date.now()
  return (
    <div className={styles.account}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Your reservation</p>
        <h1>{checkout.reference}</h1>
        <p>{statusLabel}</p>
        {checkout.expiresAt && (
          <p>
            Reservation deadline:{' '}
            {new Date(checkout.expiresAt).toLocaleString('en-GB', { timeZone: 'UTC' })} UTC.
          </p>
        )}
      </header>
      <div className={styles.layout}>
        <div className={styles.stack}>
          {checkout.items.map((item) => (
            <section className={styles.panel} key={item.eventDateId}>
              <h2>{item.title}</h2>
              {item.cancelledAt && <p>Cancelled {date(item.cancelledAt)}</p>}
              <p className={styles.muted}>
                {date(item.dateFrom)} – {date(item.dateTo)} · {item.quantity} participant(s)
              </p>
              <div className={styles.row}>
                <span>Total</span>
                <strong>
                  {money(
                    checkout.paymentMethod === 'muzapay'
                      ? item.totalCzkMinor || 0
                      : item.totalMinor,
                    checkout.paymentMethod === 'muzapay' ? 'CZK' : item.currency,
                  )}
                </strong>
              </div>
              <div className={styles.row}>
                <span>Paid</span>
                <strong>
                  {money(
                    checkout.paymentMethod === 'muzapay' ? item.paidCzkMinor : item.paidMinor,
                    checkout.paymentMethod === 'muzapay' ? 'CZK' : item.currency,
                  )}
                </strong>
              </div>
              <div className={styles.row}>
                <span>Refunded</span>
                <strong>
                  {money(
                    checkout.paymentMethod === 'muzapay'
                      ? item.refundedCzkMinor
                      : item.refundedMinor,
                    checkout.paymentMethod === 'muzapay' ? 'CZK' : item.currency,
                  )}
                </strong>
              </div>
              {!item.cancelledAt && (
                <p className={styles.muted}>
                  Balance:{' '}
                  {money(
                    Math.max(
                      0,
                      checkout.paymentMethod === 'muzapay'
                        ? (item.totalCzkMinor || 0) - item.paidCzkMinor
                        : item.totalMinor - item.paidMinor,
                    ),
                    checkout.paymentMethod === 'muzapay' ? 'CZK' : item.currency,
                  )}
                  . Due {date(item.balanceDueAt)}.
                </p>
              )}
              {item.orderId && (
                <Link href={`/account/orders/${item.orderId}`}>View individual order</Link>
              )}
            </section>
          ))}
          <section className={styles.panel}>
            <h2>Payer</h2>
            <p>
              {checkout.contact.name}
              <br />
              {checkout.contact.email}
              <br />
              {checkout.contact.phone}
            </p>
          </section>
          <Link href="/account/checkouts">All reservations</Link>
        </div>
        <CheckoutPayment
          asOf={asOf}
          checkoutId={checkout.id}
          state={checkout.state}
          currency={checkout.currency}
          items={activeItems.map(checkoutDisplayItem)}
          paymentMethod={checkout.paymentMethod}
          methods={availableCheckoutMethods()}
          billingReady={
            !!checkout.billingAddress &&
            ['firstName', 'lastName', 'street', 'city', 'postalCode', 'country'].every(
              (field) =>
                typeof checkout.billingAddress?.[field] === 'string' &&
                String(checkout.billingAddress[field]).trim(),
            )
          }
        />
      </div>
    </div>
  )
}
