import React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { checkoutEnabled } from '@/lib/checkout/feature'
import type { Order } from '@/payload-types'
import { ReservationHeader } from '@/components/checkout/ReservationHeader'
import checkout from '@/components/checkout/checkout.module.css'
import styles from '../../account.module.css'
import { ORDER_STATE_LABEL, orderDateRange, orderMoney, orderTripTitle } from '../presentation'
import { cancelMyOrderAction } from './actions'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Order — Rockbusters' }

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()
  let o: Order
  try {
    // Depth 2 reaches the event date's trip variant, which carries the authored trip name.
    o = await payload.findByID({
      collection: 'orders',
      id,
      depth: 2,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }
  const ownerId = typeof o.user === 'object' && o.user ? o.user.id : o.user
  if (ownerId !== user.id) notFound()

  const cancel = cancelMyOrderAction.bind(null, o.id)
  // A grouped order is paid and cancelled from its reservation; the Orders hook rejects direct changes to it.
  const reservationId = typeof o.checkout === 'object' && o.checkout ? o.checkout.id : o.checkout
  const orderNumber = o.orderNumber ?? String(o.id)
  const discount = o.discountAmount ?? 0
  const discountSource =
    typeof o.discountCode === 'object' && o.discountCode
      ? o.discountCode.code
      : typeof o.referral === 'object' && o.referral
        ? o.referral.name
        : ''
  const billing = o.billingAddress
  const billingLines = [
    billing?.company?.companyName,
    [billing?.firstName, billing?.lastName].filter(Boolean).join(' '),
    billing?.street,
    [billing?.postalCode, billing?.city].filter(Boolean).join(' '),
    billing?.country,
  ].filter(Boolean)
  const companyIds = [
    billing?.company?.ico && `IČO ${billing.company.ico}`,
    billing?.company?.dic && `DIČ ${billing.company.dic}`,
  ]
    .filter(Boolean)
    .join(' · ')
  const participantLabel = `${o.participantCount} ${o.participantCount === 1 ? 'participant' : 'participants'}`

  return (
    <div className={checkout.account}>
      <ReservationHeader
        eyebrow="Your order"
        referenceLabel="Order number"
        reference={orderNumber}
        title={orderTripTitle(o)}
        status={ORDER_STATE_LABEL[o.state] ?? o.state}
      />
      <div className={checkout.layout}>
        <div className={checkout.stack}>
          {o.state === 'confirmed' && !reservationId && (
            <section className={checkout.panel}>
              <h2 data-type="card-lg">Payment instructions</h2>
              <p className={styles.preLine}>
                {process.env.BANK_TRANSFER_DETAILS ??
                  'Bank transfer details will be shown here once configured.'}
              </p>
              <p>
                Variable symbol: <strong>{orderNumber}</strong>
              </p>
            </section>
          )}
          {!!o.participants?.length && (
            <section className={checkout.panel}>
              <h2 data-type="card-lg">Participants</h2>
              <ul className={styles.plainList}>
                {o.participants.map((p, i) => (
                  <li key={p.id ?? i}>
                    <span>{[p.firstName, p.lastName].filter(Boolean).join(' ')}</span>
                    <span className={checkout.muted}>
                      {[p.email, p.phone].filter(Boolean).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {billingLines.length > 0 && (
            <section className={checkout.panel}>
              <h2 data-type="card-lg">Your details</h2>
              <p className={styles.addressBody}>
                {billingLines.map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </p>
              {companyIds && <p className={checkout.muted}>{companyIds}</p>}
            </section>
          )}
          {o.customerNote && (
            <section className={checkout.panel}>
              <h2 data-type="card-lg">Your note</h2>
              <p className={styles.preLine}>{o.customerNote}</p>
            </section>
          )}
          {o.state === 'pending' && !reservationId && (
            <form action={cancel} className={checkout.stack}>
              <button type="submit" className={`btn-ghost ${checkout.button}`}>
                Cancel booking
              </button>
            </form>
          )}
          {reservationId && checkoutEnabled() && (
            <Link className={`btn-ghost ${checkout.button}`} href={`/account/checkouts/${reservationId}`}>
              View reservation
            </Link>
          )}
          <Link className={`btn-ghost ${checkout.button}`} href="/account/orders">
            All orders
          </Link>
        </div>
        <aside className={checkout.sidebar} aria-label="Order summary">
          <section className={`${checkout.panel} ${checkout.tripSummary}`}>
            <div className={checkout.tripSummaryHeading}>
              <h2 data-type="card-lg">Your trip</h2>
            </div>
            <div className={checkout.tripSummaryContent}>
              <div className={checkout.tripSummaryItem}>
                <h3 className={checkout.tripSummaryItemTitle} data-type="card-lg">
                  {orderTripTitle(o)}
                </h3>
                <p className={checkout.muted}>{orderDateRange(o)}</p>
                <p className={checkout.muted}>
                  {participantLabel}
                  {o.participantCount > 1 ? ` · ${orderMoney(o.unitPrice, o.currency)} per person` : ''}
                </p>
              </div>
            </div>
          </section>
          <section className={checkout.panel}>
            <h2 data-type="card-lg">Order summary</h2>
            {discount > 0 && (
              <>
                <div className={checkout.row}>
                  <span>Subtotal</span>
                  <strong>{orderMoney(o.totalPrice + discount, o.currency)}</strong>
                </div>
                <div className={checkout.row}>
                  <span>Discount{discountSource ? ` (${discountSource})` : ''}</span>
                  <strong>−{orderMoney(discount, o.currency)}</strong>
                </div>
              </>
            )}
            <div className={`${checkout.row} ${checkout.total}`}>
              <span>Total</span>
              <span className={checkout.totalAmount}>{orderMoney(o.totalPrice, o.currency)}</span>
            </div>
            <p className={`${checkout.muted} ${checkout.summaryNote}`}>VAT {o.vat}% included.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
