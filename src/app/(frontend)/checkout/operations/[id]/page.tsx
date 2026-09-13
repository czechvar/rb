import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isAdminUser } from '@/access'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { checkoutEnabled } from '@/lib/checkout/feature'
import type { CheckoutRecord } from '@/lib/checkout/types'
import type { PaymentAllocation } from '@/payments/checkout-ledger'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { checkoutStateLabel, money, date } from '@/components/checkout/format'
import { CheckoutReviewForm } from '../../IdentityForms'
import { OperationForm } from '../OperationForm'
import styles from '@/components/checkout/checkout.module.css'

type RefundReceipt = {
  providerReference: string
  recordedAt: string
  allocations: PaymentAllocation[]
}
export const metadata = {
  title: 'Reservation operations — Rockbusters',
  robots: { index: false, follow: false },
}
export default async function OperationDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!checkoutEnabled()) notFound()
  const user = await requireUser()
  if (!isAdminUser(user)) notFound()
  const { id } = await params
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) notFound()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'checkouts',
    where: { id: { equals: Number(id) } },
    limit: 1,
    depth: 0,
    overrideAccess: false,
    user,
  })
  const record = result.docs[0] as unknown as CheckoutRecord | undefined
  if (!record) notFound()
  const receipts = await payload.find({
    collection: 'transactions',
    where: { checkout: { equals: record.id } },
    sort: '-createdAt',
    pagination: false,
    depth: 0,
    overrideAccess: false,
    user,
  })
  const benefit = record.paymentMethod === 'muzapay'
  const currency = benefit ? 'CZK' : record.currency
  return (
    <MarketingShell>
      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={styles.header}>
            <Link href="/checkout/operations">All reservations</Link>
            <h1>{record.reference}</h1>
            <p>
              {checkoutStateLabel(record.state)} · created {date(record.createdAt)}
            </p>
            <p>
              {record.contact.name} ·{' '}
              <a href={`mailto:${record.contact.email}`}>{record.contact.email}</a> ·{' '}
              <a href={`tel:${record.contact.phone}`}>{record.contact.phone}</a>
            </p>
            {record.reconciliationReason && <p>{record.reconciliationReason}</p>}
          </header>
          <div className={styles.stack}>
            <section className={styles.panel}>
              <h2>Trips and payment schedule</h2>
              {record.items.map((item) => (
                <div key={item.eventDateId}>
                  {item.cancelledAt && <p>Cancelled {date(item.cancelledAt)}</p>}
                  <h3>
                    {item.title} · {date(item.dateFrom)}
                  </h3>
                  <p>
                    {item.quantity} places · total{' '}
                    {money((benefit ? item.totalCzkMinor : item.totalMinor) || 0, currency)} · paid{' '}
                    {money(benefit ? item.paidCzkMinor : item.paidMinor, currency)} · refunded{' '}
                    {money(benefit ? item.refundedCzkMinor : item.refundedMinor, currency)}
                  </p>
                  <p>Balance due {date(item.balanceDueAt)}</p>
                  {item.orderId && (
                    <Link href={`/admin/collections/orders/${item.orderId}`}>
                      Order {item.orderId}
                    </Link>
                  )}
                </div>
              ))}
            </section>
            {record.customerKind === 'new' &&
              ['awaitingReview', 'approved'].includes(record.state) && (
                <section className={styles.panel}>
                  <h2>Guest review</h2>
                  <CheckoutReviewForm id={record.id} approved={record.state === 'approved'} />
                </section>
              )}
            <section className={styles.panel}>
              <h2>Reservation reconciliation</h2>
              <p>
                Check pending provider payments before releasing an expired unpaid hold. A payment
                whose status is still uncertain stays reserved for staff review.
              </p>
              <OperationForm
                checkoutId={record.id}
                operation="expiry"
                label="Reconcile reservation"
              />
            </section>
            {!['cancelled', 'expired', 'unverified'].includes(record.state) && (
              <section className={styles.panel}>
                <h2>Cancel reservation</h2>
                <p>
                  This releases reserved places. It does not send a refund to a payment provider.
                </p>
                <OperationForm
                  checkoutId={record.id}
                  operation="cancel"
                  label="Cancel selected trips"
                >
                  {record.items
                    .filter((item) => !item.cancelledAt)
                    .map((item) => (
                      <label key={item.eventDateId}>
                        <input
                          type="checkbox"
                          name="itemIds"
                          value={item.eventDateId}
                          defaultChecked
                        />{' '}
                        {item.title} · {date(item.dateFrom)}
                      </label>
                    ))}
                  <label>
                    Cancellation reason
                    <textarea name="reason" required maxLength={1000} />
                  </label>
                </OperationForm>
              </section>
            )}
            <h2>Payment receipts</h2>
            {!receipts.docs.length && <p>No payment attempts recorded.</p>}
            {receipts.docs.map((receipt) => {
              const allocations = (receipt.allocations || []) as unknown as PaymentAllocation[]
              const refunds = (receipt.refunds || []) as unknown as RefundReceipt[]
              return (
                <section key={receipt.id} className={styles.panel}>
                  <h3>
                    {receipt.paymentMethod} ·{' '}
                    {money(
                      receipt.amountMinor ?? Math.round(receipt.amount * 100),
                      receipt.currency,
                    )}
                  </h3>
                  <p>
                    {receipt.state} · {receipt.purpose} · {date(receipt.createdAt)}
                  </p>
                  <p>Receipt: {receipt.uuid}</p>
                  {allocations.map((allocation) => (
                    <p key={allocation.eventDateId}>
                      {record.items.find((item) => item.eventDateId === allocation.eventDateId)
                        ?.title || `Trip ${allocation.eventDateId}`}{' '}
                      · {money(allocation.amountMinor, receipt.currency)}
                    </p>
                  ))}
                  {receipt.reconciliationReason && <p>{receipt.reconciliationReason}</p>}
                  <OperationForm
                    checkoutId={record.id}
                    operation="reconcile"
                    uuid={receipt.uuid}
                    label="Check provider status"
                  />
                  {refunds.map((refund) => (
                    <div key={refund.providerReference}>
                      <h4>Refund receipt: {refund.providerReference}</h4>
                      <p>
                        {date(refund.recordedAt)} ·{' '}
                        {money(
                          refund.allocations.reduce(
                            (total, allocation) => total + allocation.amountMinor,
                            0,
                          ),
                          receipt.currency,
                        )}
                      </p>
                    </div>
                  ))}
                  {receipt.state === 'paid' && receipt.settledAt && (
                    <>
                      <h4>Record an existing provider refund</h4>
                      <OperationForm
                        checkoutId={record.id}
                        operation="refund"
                        uuid={receipt.uuid}
                        label="Record refund receipt"
                      >
                        <label>
                          Provider refund reference
                          <input name="providerReference" required maxLength={200} />
                        </label>
                        {allocations.map((allocation) => {
                          const refunded = refunds.reduce(
                            (sum, refund) =>
                              sum +
                              refund.allocations
                                .filter((item) => item.eventDateId === allocation.eventDateId)
                                .reduce((total, item) => total + item.amountMinor, 0),
                            0,
                          )
                          const remaining = allocation.amountMinor - refunded
                          return remaining > 0 ? (
                            <label key={allocation.eventDateId}>
                              {record.items.find(
                                (item) => item.eventDateId === allocation.eventDateId,
                              )?.title || `Trip ${allocation.eventDateId}`}{' '}
                              — refunded amount ({receipt.currency}, maximum{' '}
                              {money(remaining, receipt.currency)})
                              <input
                                name={`amount-${allocation.eventDateId}`}
                                inputMode="decimal"
                                pattern="[0-9]+([.][0-9]{1,2})?"
                                maxLength={15}
                                placeholder="Leave blank for no refund"
                              />
                            </label>
                          ) : null
                        })}
                      </OperationForm>
                    </>
                  )}
                </section>
              )
            })}
          </div>
        </div>
      </main>
    </MarketingShell>
  )
}
