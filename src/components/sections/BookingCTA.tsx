import { checkoutEnabled } from '@/lib/checkout/feature'
import { tripSummary, tripCommercialText } from '@/lib/trip-summary'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { TripDetailView } from '@/lib/trip-detail'
import type { Event } from '@/payload-types'
import styles from './BookingCTA.module.css'

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
    : `/trips/${event.slug}/dates`
  const label =
    trip && !trip.bookingHref
      ? 'Ask a Question →'
      : (trip ? tripCommercialText(trip, trip.editorial?.booking?.primaryLabel) : undefined) ||
        'Book this trip →'
  const summary = trip ? tripSummary(trip) : null
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
        {trip?.dateLabel && (
          <p className={styles.details}>
            {[trip.dateLabel, trip.priceLabel, trip.availabilityLabel].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className={styles.actions}>
          <Link href={href} className={`btn-primary ${styles.button}`}>
            {label}
          </Link>
          {checkoutEnabled() && trip?.selectedDate && trip.bookingHref && <Link href={`/cart?add=${trip.selectedDate.id}`} className={`btn-ghost ${styles.button}`}>Add to cart</Link>}
          {variant === 'image' && trip?.bookingHref && (
            <Link href="mailto:info@rockbusters.net" className={`btn-ghost ${styles.button}`}>
              {trip?.editorial?.booking?.secondaryLabel || 'Ask a Question →'}
            </Link>
          )}
        </div>
        {trip?.editorial?.booking && summary && (
          <p className={styles.details}>
            {summary.primaryPrice}
            {summary.weeklyPrice && ` · 1 week ${summary.weeklyPrice}`}
          </p>
        )}
        {trip?.editorial?.booking?.support && (
          <p className={styles.details}>{trip.editorial.booking.support}</p>
        )}
      </div>
    </section>
  )
}
