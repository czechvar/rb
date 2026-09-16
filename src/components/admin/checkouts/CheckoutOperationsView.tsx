import React from 'react'
import { notFound } from 'next/navigation'
import { Gutter } from '@payloadcms/ui'
import type { DocumentViewServerProps } from 'payload'
import type { User } from '@/payload-types'
import { isAdminUser } from '@/access'
import type { CheckoutRecord } from '@/lib/checkout/types'
import type { PaymentAllocation } from '@/payments/checkout-ledger'
import { checkoutStateLabel, date, money } from '@/components/checkout/format'
import { CheckoutAdminOperationForm, CheckoutAdminReviewForm } from './CheckoutAdminForms'
import styles from './checkout-admin.module.css'

type RefundReceipt = {
  providerReference: string
  recordedAt: string
  allocations: PaymentAllocation[]
}

export async function CheckoutOperationsView({ doc, initPageResult }: DocumentViewServerProps) {
  const actor = initPageResult.req.user as User | null
  if (!actor || !isAdminUser(actor)) notFound()

  const record = doc as unknown as CheckoutRecord
  if (!record?.id || !Array.isArray(record.items)) notFound()

  const receipts = await initPageResult.req.payload.find({
    collection: 'transactions',
    where: { checkout: { equals: record.id } },
    sort: '-createdAt',
    pagination: false,
    depth: 0,
    overrideAccess: false,
    user: actor,
  })
  const benefit = record.paymentMethod === 'muzapay'
  const currency = benefit ? 'CZK' : record.currency

  return (
    <Gutter className={styles.view}>
      <header className={styles.header}>
        <h1>Checkout operations</h1>
        <p className={styles.meta}>
          {record.reference} · {checkoutStateLabel(record.state)} · created {date(record.createdAt)}
        </p>
        <p>
          {record.contact.name} ·{' '}
          <a href={`mailto:${record.contact.email}`}>{record.contact.email}</a>
          {record.contact.phone ? ` · ${record.contact.phone}` : ''}
        </p>
        {record.reconciliationReason && <p>{record.reconciliationReason}</p>}
        {record.notificationStatus && <p>Invitation email: {record.notificationStatus}</p>}
      </header>

      <section className={styles.panel}>
        <h2>Trips and payment schedule</h2>
        {record.items.map((item) => (
          <div className={styles.item} key={item.eventDateId}>
            <h3>
              {item.title} · {date(item.dateFrom)}
            </h3>
            {item.cancelledAt && <p>Cancelled {date(item.cancelledAt)}</p>}
            <p>
              {item.quantity} places · total{' '}
              {money((benefit ? item.totalCzkMinor : item.totalMinor) || 0, currency)} · paid{' '}
              {money(benefit ? item.paidCzkMinor : item.paidMinor, currency)} · refunded{' '}
              {money(benefit ? item.refundedCzkMinor : item.refundedMinor, currency)}
            </p>
            <p className={styles.muted}>Balance due {date(item.balanceDueAt)}</p>
            {item.orderId && (
              <a href={`/admin/collections/orders/${item.orderId}`}>Open order {item.orderId}</a>
            )}
          </div>
        ))}
      </section>

      {record.customerKind === 'new' && ['awaitingReview', 'approved'].includes(record.state) && (
        <section className={styles.panel}>
          <h2>Customer approval</h2>
          <p>
            Approval confirms the pending Orders and emails a 24-hour invitation to connect or
            create the customer account. Declining cancels the Orders and releases the seats.
          </p>
          <CheckoutAdminReviewForm id={record.id} approved={record.state === 'approved'} />
        </section>
      )}

      <section className={styles.panel}>
        <h2>Reservation reconciliation</h2>
        <p>
          Check pending provider payments before releasing an expired unpaid hold. Uncertain
          provider status keeps the reservation assigned to staff review.
        </p>
        <CheckoutAdminOperationForm
          checkoutId={record.id}
          operation="expiry"
          label="Reconcile reservation"
        />
      </section>

      {!['cancelled', 'expired', 'unverified'].includes(record.state) && (
        <section className={styles.panel}>
          <h2>Cancel reservation</h2>
          <p>Cancellation releases seats. It does not issue a provider refund.</p>
          <CheckoutAdminOperationForm
            checkoutId={record.id}
            operation="cancel"
            label="Cancel selected trips"
          >
            {record.items
              .filter((item) => !item.cancelledAt)
              .map((item) => (
                <label className={styles.confirmation} key={item.eventDateId}>
                  <input type="checkbox" name="itemIds" value={item.eventDateId} defaultChecked />
                  <span>
                    {item.title} · {date(item.dateFrom)}
                  </span>
                </label>
              ))}
            <label>
              Cancellation reason
              <textarea name="reason" required maxLength={1000} />
            </label>
          </CheckoutAdminOperationForm>
        </section>
      )}

      <section className={styles.panel}>
        <h2>Payment receipts</h2>
        {!receipts.docs.length && <p>No payment attempts recorded.</p>}
        {receipts.docs.map((receipt) => {
          const allocations = (receipt.allocations || []) as unknown as PaymentAllocation[]
          const refunds = (receipt.refunds || []) as unknown as RefundReceipt[]
          return (
            <div className={styles.item} key={receipt.id}>
              <h3>
                {receipt.paymentMethod} ·{' '}
                {money(receipt.amountMinor ?? Math.round(receipt.amount * 100), receipt.currency)}
              </h3>
              <p>
                {receipt.state} · {receipt.purpose} · {date(receipt.createdAt)}
              </p>
              <p className={styles.muted}>Receipt: {receipt.uuid}</p>
              {allocations.map((allocation) => (
                <p key={allocation.eventDateId}>
                  {record.items.find((item) => item.eventDateId === allocation.eventDateId)
                    ?.title || `Trip ${allocation.eventDateId}`}{' '}
                  · {money(allocation.amountMinor, receipt.currency)}
                </p>
              ))}
              {receipt.reconciliationReason && <p>{receipt.reconciliationReason}</p>}
              <CheckoutAdminOperationForm
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
                <CheckoutAdminOperationForm
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
                    if (remaining <= 0) return null
                    return (
                      <label key={allocation.eventDateId}>
                        {record.items.find((item) => item.eventDateId === allocation.eventDateId)
                          ?.title || `Trip ${allocation.eventDateId}`}{' '}
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
                    )
                  })}
                </CheckoutAdminOperationForm>
              )}
            </div>
          )
        })}
      </section>
    </Gutter>
  )
}
