import Link from 'next/link'
import type { Event } from '@/payload-types'
import styles from './BookingCTA.module.css'

export function BookingCTA({
  event,
  heading = 'Ready to join?',
  eyebrow = 'Reserve Your Place',
  body,
}: {
  event: Event
  heading?: string
  eyebrow?: string
  body?: string
}) {
  return (
    <section className={styles.cta}>
      <div className={styles.inner}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 className={styles.heading}>{heading}</h2>
        {body && <p className={styles.body}>{body}</p>}
        <Link href={`/trips/${event.slug}/dates`} className={styles.button}>
          Book this trip →
        </Link>
      </div>
    </section>
  )
}
