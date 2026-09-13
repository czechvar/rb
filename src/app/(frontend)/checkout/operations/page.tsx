import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isAdminUser } from '@/access'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { checkoutEnabled } from '@/lib/checkout/feature'
import type { CheckoutRecord } from '@/lib/checkout/types'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { checkoutStateLabel, date } from '@/components/checkout/format'
import styles from '@/components/checkout/checkout.module.css'
import { matchesOperationFilter, operationFilters, type OperationFilter } from './helpers'

export const metadata = {
  title: 'Checkout operations — Rockbusters',
  robots: { index: false, follow: false },
}
export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>
}) {
  if (!checkoutEnabled()) notFound()
  const user = await requireUser()
  if (!isAdminUser(user)) notFound()
  const params = await searchParams
  const filter = operationFilters.includes(params.filter as OperationFilter)
    ? (params.filter as OperationFilter)
    : 'all'
  const requestedPage = Number(params.page || 1)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const payload = await getPayloadClient()
  // Item balances live in immutable JSON snapshots; filter their ledger in memory after scoped access checks.
  const records: CheckoutRecord[] = []
  let sourcePage = 1
  while (true) {
    const result = await payload.find({
      collection: 'checkouts',
      sort: 'createdAt',
      page: sourcePage,
      limit: 100,
      depth: 0,
      overrideAccess: false,
      user,
    })
    records.push(...(result.docs as unknown as CheckoutRecord[]))
    if (!result.hasNextPage) break
    sourcePage++
  }
  const now = new Date().getTime()
  const matching = records.filter((record) => matchesOperationFilter(record, filter, now))
  const visible = matching.slice((page - 1) * 50, page * 50)
  return (
    <MarketingShell>
      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={styles.header}>
            <p className={styles.eyebrow} data-eyebrow="section">
              Staff
            </p>
            <h1>Checkout operations</h1>
            <p className={styles.lead}>
              Review reservations, check payments and record provider refund receipts.
            </p>
            <Link href="/checkout/review">Guest approvals and invitations</Link>
          </header>
          <nav aria-label="Reservation filters" className={styles.row}>
            {operationFilters.map((option) => (
              <Link
                key={option}
                href={`/checkout/operations?filter=${option}`}
                aria-current={option === filter ? 'page' : undefined}
              >
                {option.replaceAll('-', ' ')}
              </Link>
            ))}
          </nav>
          <p>{matching.length} reservations · oldest first</p>
          <div className={styles.stack}>
            {visible.map((record) => (
              <article key={record.id} className={styles.panel}>
                <h2>
                  <Link href={`/checkout/operations/${record.id}`}>{record.reference}</Link>
                </h2>
                <p>
                  {checkoutStateLabel(record.state)} ·{' '}
                  {record.customerKind === 'new' ? 'New customer' : 'Returning customer'} · created{' '}
                  {date(record.createdAt)} ·{' '}
                  {Math.max(0, Math.floor((now - new Date(record.createdAt).getTime()) / 86400000))}{' '}
                  days old
                </p>
                <p>
                  {record.contact.name} ·{' '}
                  <a href={`mailto:${record.contact.email}`}>{record.contact.email}</a> ·{' '}
                  <a href={`tel:${record.contact.phone}`}>{record.contact.phone}</a>
                </p>
                <p>
                  {record.items.map((item) => `${item.title} (${date(item.dateFrom)})`).join(' · ')}
                </p>
                {record.reconciliationReason && <p>{record.reconciliationReason}</p>}
              </article>
            ))}
          </div>
          {!visible.length && <p>No reservations match this filter.</p>}
          <nav className={styles.row} aria-label="Pagination">
            {page > 1 && (
              <Link href={`/checkout/operations?filter=${filter}&page=${page - 1}`}>Previous</Link>
            )}
            {page * 50 < matching.length && (
              <Link href={`/checkout/operations?filter=${filter}&page=${page + 1}`}>Next</Link>
            )}
          </nav>
        </div>
      </main>
    </MarketingShell>
  )
}
