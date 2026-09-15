import { tripSummary, tripCommercialText } from '@/lib/trip-summary'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { TripDetailView } from '@/lib/trip-detail'
import type { Event } from '@/payload-types'
import styles from './BookingCTA.module.css'

function bookingStats(trip: TripDetailView | undefined) {
  const date = trip?.selectedDate
  if (!date) return null
  const days = Math.round(
    (Date.parse(date.dateTo.slice(0, 10)) - Date.parse(date.dateFrom.slice(0, 10))) / 86_400_000,
  )
  const weeks = days > 0 && days % 7 === 0 ? days / 7 : null
  return {
    duration: weeks ? `${weeks} ${weeks === 1 ? 'week' : 'weeks'}` : `${days} ${days === 1 ? 'day' : 'days'}`,
    price: new Intl.NumberFormat('en-GB', {
      style: 'currency', currency: date.currency, minimumFractionDigits: 0, maximumFractionDigits: 2,
    }).format(date.price),
    capacity: date.capacity > 0 ? date.capacity : null,
  }
}

export function BookingCTA({
  event,
  heading = 'Ready to join?',
  eyebrow = 'Reserve Your Place',
  body,
  trip,
  variant = 'default',
}: {
  event: Event
  heading?: ReactNode
  eyebrow?: string
  body?: string
  trip?: TripDetailView
  variant?: 'default' | 'image'
}) {
  const mainPic =
    typeof event.mainPicture === 'object' && event.mainPicture ? event.mainPicture : null
  const href = trip
    ? (trip.bookingHref ?? 'mailto:info@rockbusters.net')
    : `/trips/${event.slug}`
  const label =
    trip && !trip.bookingHref
      ? 'Contact us →'
      : (trip ? tripCommercialText(trip, trip.editorial?.booking?.primaryLabel) : undefined) ||
        'Book this trip →'
  const summary = trip ? tripSummary(trip) : null
  const stats = bookingStats(trip)
  return (
    <section className={`${styles.cta} ${variant === 'image' ? styles.withImage : ''}`}>
      {variant === 'image' && mainPic?.url && (
        <Image src={mainPic.url} alt="" fill sizes="100vw" className={styles.image} />
      )}
      <div className={styles.inner}>
        {eyebrow && (
          <p data-eyebrow="section" className={styles.eyebrow}>
            {eyebrow}
          </p>
        )}
        {heading && <h2 className={styles.heading}>{heading}</h2>}
        {body && <p className={styles.body}>{body}</p>}
        <div className={styles.actions}>
          <Link href={href} className={`btn-primary ${styles.button}`}>
            {label}
          </Link>
          {stats && (
            <dl className={styles.stat}>
              <dt>{stats.duration}</dt>
              <dd>{stats.price}</dd>
              {summary?.weeklyPrice && <dd className={styles.statNote}>1 week {summary.weeklyPrice}</dd>}
            </dl>
          )}
          {stats?.capacity && (
            <dl className={styles.stat}>
              <dt>Group size</dt>
              <dd>Max {stats.capacity}</dd>
            </dl>
          )}
        </div>
        {trip?.editorial?.booking?.support && (
          <p className={styles.support}>{trip.editorial.booking.support}</p>
        )}
      </div>
    </section>
  )
}
