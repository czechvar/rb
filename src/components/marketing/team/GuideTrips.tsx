import Link from 'next/link'
import type { Event, Guide } from '@/payload-types'
import styles from './GuideTrips.module.css'

export function GuideTrips({ guide, events }: { guide: Guide; events: Event[] }) {
  const first = guide.name.split(' ')[0]
  return (
    <section className={styles.section} id="trips">
      <div className={styles.inner}>
        <p className={`section-label ${styles.label}`}>Courses &amp; Coaching</p>
        <h2 className={`section-title ${styles.heading}`}>
          Train with
          <br />
          {first}
        </h2>
        {events.length ? (
          <div className={styles.grid}>
            {events.map((e) => {
              const t = e.types?.[0]
              const typeName = t && typeof t === 'object' ? t.name : null
              return (
                <Link key={e.id} href={`/trips/${e.slug}`} className={`${styles.card} reveal`}>
                  {typeName ? <span className={styles.kicker}>{typeName}</span> : null}
                  <span className={styles.name}>{e.title}</span>
                  {e.shortDescription ? <p className={styles.hook}>{e.shortDescription}</p> : null}
                  <span className={styles.link}>See trip →</span>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className={styles.empty}>
            {guide.name} joins selected camps throughout the season — see the calendar for dates.
          </p>
        )}
      </div>
    </section>
  )
}
