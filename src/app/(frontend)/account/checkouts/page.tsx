import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { checkoutEnabled } from '@/lib/checkout/feature'
import type { CheckoutRecord } from '@/lib/checkout/types'
import { money, checkoutStateLabel } from '@/components/checkout/format'
import styles from '@/components/checkout/checkout.module.css'
export const metadata = { title: 'Trip reservations — Rockbusters' }
export default async function CheckoutsPage() {
  if (!checkoutEnabled()) notFound()
  const user = await getCurrentUser()
  if (!user) redirect('/login?from=%2Faccount%2Fcheckouts')
  const payload = await getPayloadClient()
  const rows = await payload.find({
    collection: 'checkouts',
    where: { user: { equals: user.id } },
    sort: '-createdAt',
    limit: 100,
    depth: 0,
    user,
    overrideAccess: false,
  })
  // Holds lapse before the daily expiry sweep flips the state, so compare against the request time too.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  return (
    <div className={styles.account}>
      <h1 data-type="section">Your trip reservations</h1>
      <p>
        <Link href="/cart">Open your cart</Link> ·{' '}
        <Link href="/account/orders">Individual orders</Link>
      </p>
      <div className={styles.stack}>
        {!rows.docs.length && <p>No checkout reservations yet.</p>}
        {rows.docs.map((raw) => {
          const row = raw as unknown as CheckoutRecord
          const czk = row.paymentMethod === 'muzapay'
          const activeItems = row.items.filter((item) => !item.cancelledAt)
          const totalMinor = activeItems.reduce(
            (sum, item) => sum + (czk ? item.totalCzkMinor || 0 : item.totalMinor),
            0,
          )
          const paidMinor = activeItems.reduce(
            (sum, item) => sum + (czk ? item.paidCzkMinor : item.paidMinor),
            0,
          )
          const payable =
            (row.state === 'reserved' || row.state === 'approved') &&
            totalMinor > paidMinor &&
            (!row.expiresAt || new Date(row.expiresAt).getTime() > now)
          return (
            <section key={row.id} className={`${styles.panel} ${styles.reservationCard}`}>
              <div>
                <h2>
                  <Link href={`/account/checkouts/${row.id}`}>{row.reference}</Link>
                </h2>
                <p>
                  {row.items
                    .map((item) => item.title + (item.cancelledAt ? ' (cancelled)' : ''))
                    .join(' · ')}
                </p>
                <p>
                  {checkoutStateLabel(row.state)} · {money(totalMinor, czk ? 'CZK' : row.currency)}
                </p>
              </div>
              {payable && (
                <Link
                  className={`btn-primary ${styles.button}`}
                  href={`/account/checkouts/${row.id}#payment`}
                >
                  Pay now
                </Link>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
