import Link from 'next/link'
import type { Event } from '@/payload-types'
import styles from './TripPitchBlock.module.css'

export function TripPitchBlock({ event }: { event: Event }) {
  return (
    <section className={styles.pitch}>
      <div className={styles.inner}>
        <h2 className={styles.headline}>{event.title}</h2>
        {event.shortDescription && (
          <p className={styles.lead}>{event.shortDescription}</p>
        )}
        <Link href={`/trips/${event.slug}/dates`} className={styles.cta}>
          Book this trip
        </Link>
      </div>
    </section>
  )
}
