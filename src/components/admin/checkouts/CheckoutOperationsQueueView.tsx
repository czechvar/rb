import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { isAdminUser } from '@/access'
import { checkoutStateLabel, date } from '@/components/checkout/format'
import type { CheckoutRecord } from '@/lib/checkout/types'
import type { User } from '@/payload-types'
import { CheckoutAdminApproveButton } from './CheckoutAdminForms'
import {
  canQuickApproveCheckout,
  matchesOperationFilter,
  operationFilters,
  type OperationFilter,
} from './operations'
import styles from './checkout-admin.module.css'

export async function CheckoutOperationsQueueView({
  initPageResult,
  searchParams,
}: AdminViewServerProps) {
  const actor = initPageResult.req.user as User | null
  if (!actor || !isAdminUser(actor)) notFound()

  const requestedFilter = searchParams?.filter
  const filter = operationFilters.includes(requestedFilter as OperationFilter)
    ? (requestedFilter as OperationFilter)
    : 'all'
  const requestedPage = Number(searchParams?.page || 1)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const records: CheckoutRecord[] = []
  let sourcePage = 1
  while (true) {
    const result = await initPageResult.req.payload.find({
      collection: 'checkouts',
      sort: 'createdAt',
      page: sourcePage,
      limit: 100,
      depth: 0,
      overrideAccess: false,
      user: actor,
    })
    records.push(...(result.docs as unknown as CheckoutRecord[]))
    if (!result.hasNextPage) break
    sourcePage++
  }

  const now = new Date().getTime()
  const matching = records.filter((record) => matchesOperationFilter(record, filter, now))
  const visible = matching.slice((page - 1) * 50, page * 50)

  return (
    <Gutter className={styles.view}>
      <header className={styles.header}>
        <h1>Checkout operations</h1>
        <p>Review reservations, due balances, payments, invitations and reconciliation work.</p>
        <Link href="/admin/collections/checkouts">Open the complete Checkout collection</Link>
      </header>

      <nav aria-label="Reservation filters" className={styles.filters}>
        {operationFilters.map((option) => (
          <Link
            key={option}
            href={`/admin/collections/checkouts/operations?filter=${option}`}
            aria-current={option === filter ? 'page' : undefined}
          >
            {option.replaceAll('-', ' ')}
          </Link>
        ))}
      </nav>

      <p>{matching.length} reservations · oldest first</p>
      <div className={styles.queue}>
        {visible.map((record) => (
          <article className={styles.panel} key={record.id}>
            <h2>
              <Link href={`/admin/collections/checkouts/${record.id}/operations`}>
                {record.reference}
              </Link>
            </h2>
            <p>
              {checkoutStateLabel(record.state)} ·{' '}
              {record.customerKind === 'new' ? 'New customer' : 'Returning customer'} · created{' '}
              {date(record.createdAt)} ·{' '}
              {Math.max(0, Math.floor((now - new Date(record.createdAt).getTime()) / 86400000))}{' '}
              days old
            </p>
            <p>
              {record.contact.name} · {record.contact.email}
              {record.contact.phone ? ` · ${record.contact.phone}` : ''}
            </p>
            <p>
              {record.items.map((item) => `${item.title} (${date(item.dateFrom)})`).join(' · ')}
            </p>
            {record.notificationStatus && <p>Invitation email: {record.notificationStatus}</p>}
            {record.reconciliationReason && <p>{record.reconciliationReason}</p>}
            {canQuickApproveCheckout(record) && <CheckoutAdminApproveButton id={record.id} />}
          </article>
        ))}
      </div>
      {!visible.length && <p>No reservations match this filter.</p>}
      <nav className={styles.filters} aria-label="Pagination">
        {page > 1 && (
          <Link href={`/admin/collections/checkouts/operations?filter=${filter}&page=${page - 1}`}>
            Previous
          </Link>
        )}
        {page * 50 < matching.length && (
          <Link href={`/admin/collections/checkouts/operations?filter=${filter}&page=${page + 1}`}>
            Next
          </Link>
        )}
      </nav>
    </Gutter>
  )
}

export function CheckoutOperationsListLink() {
  return (
    <div className={styles.listLink}>
      <Link href="/admin/collections/checkouts/operations">Open operational queues</Link>
    </div>
  )
}
