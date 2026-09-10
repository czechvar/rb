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
  heading?: string
  eyebrow?: string
  body?: string
  trip?: TripDetailView
  variant?: 'default' | 'image'
}) {
  const mainPic = typeof event.mainPicture === 'object' && event.mainPicture ? event.mainPicture : null
  const href = trip ? trip.bookingHref ?? 'mailto:info@rockbusters.net' : `/trips/${event.slug}/dates`
  const label = trip && !trip.bookingHref ? 'Ask a Question →' : 'Book this trip →'
  return (
    <section className={`${styles.cta} ${variant === 'image' ? styles.withImage : ''}`}>
      {variant === 'image' && mainPic?.url && <Image src={mainPic.url} alt="" fill sizes="100vw" className={styles.image} />}
      <div className={styles.inner}>
        {eyebrow && <p data-eyebrow="section" className={styles.eyebrow}>{eyebrow}</p>}
        <h2 className={styles.heading}>{heading}</h2>
        {body && <p className={styles.body}>{body}</p>}
        {trip?.dateLabel && <p className={styles.details}>{[trip.dateLabel, trip.priceLabel, trip.availabilityLabel].filter(Boolean).join(' · ')}</p>}
        <Link href={href} className={styles.button}>
          {label}
        </Link>
      </div>
    </section>
  )
}
