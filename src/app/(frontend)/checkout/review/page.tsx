import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isAdminUser } from '@/access'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { checkoutEnabled } from '@/lib/checkout/feature'
import type { CheckoutRecord } from '@/lib/checkout/types'
import { CheckoutReviewForm } from '../IdentityForms'
import styles from '../identity.module.css'

export const metadata = {
  title: 'Review checkouts — Rockbusters',
  robots: { index: false, follow: false },
}
export default async function ReviewPage() {
  if (!checkoutEnabled()) notFound()
  const user = await requireUser()
  if (!isAdminUser(user)) notFound()
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'checkouts',
    where: {
      and: [{ customerKind: { equals: 'new' } }, { state: { in: ['awaitingReview', 'approved'] } }],
    },
    sort: 'createdAt',
    limit: 100,
    depth: 0,
    overrideAccess: false,
    user,
  })
  return (
    <MarketingShell>
      <main className={styles.main}>
        <div className={styles.wide}>
          <h1 className={styles.heading}>Review guest checkouts</h1>
          <p>
            <Link href="/checkout/operations">
              All reservations, balances and payment reconciliation
            </Link>
          </p>
          {!docs.length && <p>No guest checkouts are waiting for review.</p>}
          {(docs as unknown as CheckoutRecord[]).map((record) => (
            <section key={record.id} className={styles.review}>
              <h2>{record.reference}</h2>
              <p>
                {record.contact.name} · {record.contact.email} · {record.contact.phone}
              </p>
              <p>
                Status: {record.state} · Email: {record.notificationStatus || 'pending'}
              </p>
              <ul className={styles.list}>
                {record.items.map((item) => (
                  <li key={item.eventDateId}>
                    {item.title} · {item.dateFrom.slice(0, 10)} · {item.quantity} places ·{' '}
                    {(item.totalMinor / 100).toFixed(2)} {record.currency}
                  </li>
                ))}
              </ul>
              <CheckoutReviewForm id={record.id} approved={record.state === 'approved'} />
            </section>
          ))}
        </div>
      </main>
    </MarketingShell>
  )
}
