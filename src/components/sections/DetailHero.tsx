import type { Event, EventDate } from '@/payload-types'
import styles from './DetailHero.module.css'

export function DetailHero({
  event,
  firstDate,
}: {
  event: Event
  firstDate?: EventDate
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.text}>
        <h1>{event.title}</h1>
        {event.shortDescription && (
          <p className={styles.overview}>{event.shortDescription}</p>
        )}
      </div>
      <aside className={styles.booking}>
        {firstDate ? (
          <>
            <div className={styles.price}>
              {firstDate.currency} {firstDate.price.toLocaleString()}
            </div>
            <div className={styles.priceNote}>per person</div>
          </>
        ) : (
          <div className={styles.price}>See dates</div>
        )}
        <a href="#dates" className={styles.primaryCta}>
          JOIN US →
        </a>
        <a href="/contact" className={styles.secondaryCta}>
          ASK A QUESTION
        </a>
      </aside>
    </section>
  )
}
