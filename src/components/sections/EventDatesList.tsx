import type { ReactNode } from 'react'
import Link from 'next/link'
import type { EventDate } from '@/payload-types'
import { DateRowBookButton } from '@/components/trip/DateRowBookButton'
import { tripOccurrencePath } from '@/lib/occurrence-routing'
import { canCheckoutEventDate, eventDateLifecycle } from '@/lib/event-date-visibility'
import styles from './EventDatesList.module.css'

function fmtDate(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function durationDays(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}

export function EventDatesList({
  items,
  eyebrow,
  heading = 'Dates & Pricing',
  intro,
  variant = 'default',
  selectedId,
  eventSlug,
}: {
  items: EventDate[]
  eyebrow?: string
  heading?: ReactNode
  intro?: string
  variant?: 'default' | 'rows'
  selectedId?: number
  eventSlug?: string
}) {
  if (!items?.length) return null
  return (
    <section id="dates" className={`${styles.section} ${variant === 'rows' ? styles.rows : ''}`}>
      {eyebrow && <p data-eyebrow="section" className={styles.eyebrow}>{eyebrow}</p>}
        {heading && <h2>{heading}</h2>}
      {intro && <p>{intro}</p>}
      <ul className={styles.grid}>
        {items.map((d) => {
          const days = durationDays(d.dateFrom, d.dateTo)
          const spots = typeof d.remainingSeats === 'number' ? Math.max(0, d.remainingSeats) : null
          const soldOut = spots === 0 || (typeof d.capacity === 'number' && d.capacity <= 0)
          const lifecycle = eventDateLifecycle(d)
          const canBook = canCheckoutEventDate(d)
          const status = !d.active ? 'Unavailable' : lifecycle === 'ended' ? 'Past trip' :
            lifecycle === 'in-progress' ? 'In progress' : soldOut ? 'Sold out' :
              canBook ? null : 'Unavailable'
          return (
            <li key={d.id} className={styles.card} data-selected={d.id === selectedId || undefined}>
              <div data-type="card" className={styles.range}>
                {variant === 'rows' && eventSlug ? (
                  <Link href={`${d.slug ? tripOccurrencePath(eventSlug, d.slug) : `/trips/${eventSlug}`}#dates`} aria-current={d.id === selectedId ? 'true' : undefined}>
                    {fmtDate(d.dateFrom)} – {fmtDate(d.dateTo)}
                    {d.id === selectedId && <span data-type="label" className={styles.selectedLabel}>Selected</span>}
                  </Link>
                ) : <>{fmtDate(d.dateFrom)} – {fmtDate(d.dateTo)}</>}
              </div>
              <div className={styles.duration}>
                {days} {variant === 'rows' ? 'calendar ' : ''}day{days === 1 ? '' : 's'}
              </div>
              <div data-type="card" className={styles.price}>
                {d.currency} {d.price.toLocaleString()}
              </div>
              <div className={styles.priceNote}>per person</div>
              {spots !== null && (
                <div className={styles.spots}>
                  {status ?? `${spots} spot${spots === 1 ? '' : 's'} available`}
                </div>
              )}
              <div className={styles.cta}>
                {variant === 'rows' ? (
                  canBook ? <Link href={`/book/${d.id}`} className="btn-primary">Book this date →</Link> : <span>{status}</span>
                ) : <DateRowBookButton eventDateId={d.id} active={canBook} />}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
