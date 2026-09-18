import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountPage } from '../AccountPage'
import styles from '../account.module.css'
import { ORDER_STATE_LABEL, orderDateRange, orderMoney, orderTripTitle } from './presentation'

export const metadata = { title: 'Orders — Rockbusters' }

export default async function OrdersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'orders',
    where: { user: { equals: user.id } },
    sort: '-createdAt',
    limit: 100,
    depth: 2,
    user,
    overrideAccess: false,
  })
  const orders = res.docs
  return (
    <AccountPage title="Your orders">
      {orders.length === 0 ? (
        <div className={checkout.notice}>
          <p className={styles.noticeBody}>You haven&apos;t booked any trips yet.</p>
          <div className={checkout.actions}>
            <Link className={`btn-primary ${checkout.button}`} href="/trips">
              Browse trips
            </Link>
          </div>
        </div>
      ) : (
        <div className={checkout.stack}>
          {orders.map((o) => (
            <section key={o.id} className={`${checkout.panel} ${checkout.reservationCard}`}>
              <div>
                <h2 data-type="card-lg">{orderTripTitle(o)}</h2>
                <p>
                  {[orderDateRange(o), o.orderNumber].filter(Boolean).join(' · ')}
                </p>
                <p className={checkout.reservationMeta}>
                  <span className={checkout.statusBadge}>{ORDER_STATE_LABEL[o.state] ?? o.state}</span>
                  <span>{orderMoney(o.totalPrice, o.currency)}</span>
                </p>
              </div>
              <Link className={`btn-ghost ${checkout.button}`} href={`/account/orders/${o.id}`}>
                View order
                {o.orderNumber && <span className={checkout.srOnly}> {o.orderNumber}</span>}
              </Link>
            </section>
          ))}
        </div>
      )}
    </AccountPage>
  )
}
