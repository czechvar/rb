import Link from 'next/link'
import type { EventDate } from '@/payload-types'
import { DateRowBookButton } from '@/components/trip/DateRowBookButton'
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
  heading = 'Dates & Pricing',
  variant = 'default',
  selectedId,
  eventSlug,
}: {
  items: EventDate[]
  heading?: string
  variant?: 'default' | 'rows'
  selectedId?: number
  eventSlug?: string
}) {
  if (!items?.length) return null
  return (
    <section id="dates" className={`${styles.section} ${variant === 'rows' ? styles.rows : ''}`}>
      <h2>{heading}</h2>
      <ul className={styles.grid}>
        {items.map((d) => {
          const days = durationDays(d.dateFrom, d.dateTo)
          const spots = typeof d.remainingSeats === 'number' ? Math.max(0, d.remainingSeats) : null
          const soldOut = spots === 0 || (typeof d.capacity === 'number' && d.capacity <= 0)
          return (
            <li key={d.id} className={styles.card} data-selected={d.id === selectedId || undefined}>
              <div className={styles.range}>
                {variant === 'rows' && eventSlug ? (
                  <Link href={`/trips/${eventSlug}?date=${d.id}#dates`} aria-current={d.id === selectedId ? 'true' : undefined}>
                    {fmtDate(d.dateFrom)} – {fmtDate(d.dateTo)}
                    {d.id === selectedId && <span className={styles.selectedLabel}>Selected</span>}
                  </Link>
                ) : <>{fmtDate(d.dateFrom)} – {fmtDate(d.dateTo)}</>}
              </div>
              <div className={styles.duration}>
                {days} {variant === 'rows' ? 'calendar ' : ''}day{days === 1 ? '' : 's'}
              </div>
              <div className={styles.price}>
                {d.currency} {d.price.toLocaleString()}
              </div>
              <div className={styles.priceNote}>per person</div>
              {spots !== null && (
                <div className={styles.spots}>
                  {!d.active ? 'Unavailable' : soldOut ? 'Sold out' : `${spots} spot${spots === 1 ? '' : 's'} available`}
                </div>
              )}
              <div className={styles.cta}>
                {variant === 'rows' ? (
                  !d.active ? <span>Unavailable</span> : soldOut ? <span>Sold out</span> : <Link href={`/book/${d.id}`}>Book this date →</Link>
                ) : <DateRowBookButton eventDateId={d.id} active={Boolean(d.active)} />}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
