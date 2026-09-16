import type { ReactNode } from 'react'
import Link from 'next/link'
import type { EventDate, Location } from '@/payload-types'
import { DateRowBookButton } from '@/components/trip/DateRowBookButton'
import { tripPublicDatePath } from '@/lib/occurrence-routing'
import { canCheckoutEventDate, eventDateLifecycle } from '@/lib/event-date-visibility'
import { checkoutEnabled, checkoutEntryHref } from '@/lib/checkout/feature'
import styles from './EventDatesList.module.css'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function calendarDate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
}

function shortRange(from: string, to: string): string {
  const start = calendarDate(from)
  const end = calendarDate(to)
  const first = `${start.getUTCDate()} ${months[start.getUTCMonth()]}`
  const last = `${end.getUTCDate()} ${months[end.getUTCMonth()]}`
  if (from.slice(0, 10) === to.slice(0, 10))
    return `${first} ${start.getUTCFullYear()}`
  if (start.getUTCFullYear() !== end.getUTCFullYear())
    return `${first} ${start.getUTCFullYear()} – ${last} ${end.getUTCFullYear()}`
  if (start.getUTCMonth() === end.getUTCMonth())
    return `${start.getUTCDate()}–${end.getUTCDate()} ${months[start.getUTCMonth()]} ${end.getUTCFullYear()}`
  return `${first} – ${last} ${end.getUTCFullYear()}`
}

function schedulePrice(date: EventDate): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: date.currency, maximumFractionDigits: 0,
  }).format(date.price)
}

function variantKey(date: EventDate): string {
  const variant = date.tripVariant
  if (variant) return `variant-${typeof variant === 'object' ? variant.id : variant}`
  const locations = date.locations?.map(location => typeof location === 'object' ? location.id : location).join('-')
  return `locations-${locations || (typeof date.event === 'object' ? date.event.id : date.event)}`
}

/** Name a weekly option only when its matching two-week and other weekly dates exist. */
function weekLabels(items: EventDate[]): Map<number, string> {
  const labels = new Map<number, string>()
  for (const full of items) {
    const group = items.filter(date => variantKey(date) === variantKey(full) && date.id !== full.id)
    const first = group.find(date => date.dateFrom.slice(0, 10) === full.dateFrom.slice(0, 10) &&
      date.dateTo.slice(0, 10) < full.dateTo.slice(0, 10))
    const second = group.find(date => date.dateTo.slice(0, 10) === full.dateTo.slice(0, 10) &&
      date.dateFrom.slice(0, 10) > full.dateFrom.slice(0, 10) &&
      date.dateFrom.slice(0, 10) === first?.dateTo.slice(0, 10))
    if (first && second) {
      labels.set(first.id, 'Week 1')
      labels.set(second.id, 'Week 2')
      labels.set(full.id, 'Both weeks')
    }
  }
  return labels
}

function schedulePlace(date: EventDate): string {
  const variant = typeof date.tripVariant === 'object' ? date.tripVariant : null
  const related = date.locations?.length ? date.locations : variant?.locations ?? []
  const places = related.filter((location): location is Location =>
    typeof location === 'object' && location !== null)
    .map(location => [location.name, location.country].filter(Boolean).join(', '))
  return [...new Set(places)].join(' · ') || variant?.title || ''
}

function rowStatus(date: EventDate): string | null {
  const lifecycle = eventDateLifecycle(date)
  if (!date.active) return 'Unavailable'
  if (lifecycle === 'ended') return 'Past trip'
  if (lifecycle === 'in-progress') return 'In progress'
  if (date.remainingSeats === 0 || date.capacity <= 0) return 'Sold out'
  return canCheckoutEventDate(date) ? null : 'Unavailable'
}

function RowsCalendar({ items, eyebrow, heading, intro, selectedId, eventSlug }: {
  items: EventDate[]
  eyebrow?: string
  heading?: ReactNode
  intro?: string
  selectedId?: number
  eventSlug?: string
}) {
  const labels = weekLabels(items)
  const useCart = checkoutEnabled()
  return (
    <section id="dates" className={`${styles.section} ${styles.rows}`}>
      {eyebrow && <p data-eyebrow="section" className={styles.eyebrow}>{eyebrow}</p>}
      {heading && <h2>{heading}</h2>}
      {intro && <p className={styles.rowIntro}>{intro}</p>}
      <ul className={styles.grid}>
        {items.map(date => {
          const label = labels.get(date.id)
          const place = schedulePlace(date)
          const status = rowStatus(date)
          const detailPath = eventSlug ? tripPublicDatePath(eventSlug, date) : null
          const start = calendarDate(date.dateFrom)
          const end = calendarDate(date.dateTo)
          const marker = label === 'Both weeks' ? '2wk' :
            months[label === 'Week 2' && start.getUTCMonth() !== end.getUTCMonth() ? end.getUTCMonth() : start.getUTCMonth()]
          return (
            <li key={date.id} className={styles.card} data-selected={date.id === selectedId || undefined}
              data-selectable={detailPath ? true : undefined}>
              <span className={styles.rowMarker}>{marker}</span>
              <div className={styles.rowInfo}>
                {(place || label) && <strong className={styles.variantLabel}>{place}{place && label && ' — '}{label}</strong>}
                <span className={styles.rowDates}>{shortRange(date.dateFrom, date.dateTo)}</span>
                {detailPath && <Link href={detailPath} className={styles.rowSelect}
                  aria-label={`Select ${place || label || 'trip date'}, ${shortRange(date.dateFrom, date.dateTo)}`}
                  aria-current={date.id === selectedId ? 'page' : undefined} />}
              </div>
              <span className={styles.rowPrice}>{schedulePrice(date)}</span>
              <div className={styles.rowActions}>
                {status ? <span className={styles.rowStatus}>{status}</span> :
                  <Link href={checkoutEntryHref(date.id)} className={styles.rowPrimary}>
                    {useCart ? 'Add this date' : 'Book this date'}
                  </Link>}
                {detailPath && <Link href={detailPath} className={styles.rowSecondary}
                  aria-current={date.id === selectedId ? 'page' : undefined}>More info</Link>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

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
  if (variant === 'rows')
    return <RowsCalendar items={items} eyebrow={eyebrow} heading={heading} intro={intro}
      selectedId={selectedId} eventSlug={eventSlug} />
  return (
    <section id="dates" className={styles.section}>
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
                {fmtDate(d.dateFrom)} – {fmtDate(d.dateTo)}
              </div>
              <div className={styles.duration}>
                {days} day{days === 1 ? '' : 's'}
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
                <DateRowBookButton eventDateId={d.id} active={canBook} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
