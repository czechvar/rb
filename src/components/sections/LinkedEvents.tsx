import Link from 'next/link'
import type { Event } from '@/payload-types'
import styles from './LinkedEvents.module.css'

export function LinkedEvents({ events }: { events: Event[] }) {
  return (
    <section id="dates" className={styles.section}>
      <h2>Upcoming Dates</h2>
      {events.length === 0 ? (
        <p className={styles.empty}>No upcoming dates published yet — check back soon.</p>
      ) : (
        <ul className={styles.list}>
          {events.map(e => (
            <li key={e.id} className={styles.item}>
              <Link href={`/trips/${e.slug}`}>
                <h3>{e.title}</h3>
                {e.shortDescription && <p>{e.shortDescription}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
