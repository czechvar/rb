import type { Event, EventDate } from '@/payload-types'
import styles from './EventFinalCTA.module.css'

export function EventFinalCTA({
  event,
  firstDate,
}: {
  event: Event
  firstDate?: EventDate
}) {
  const summary = firstDate
    ? `${event.title} · ${firstDate.currency} ${firstDate.price.toLocaleString()}`
    : event.title
  return (
    <section className={styles.band}>
      <h2>Ready to ride?</h2>
      <p>{summary}</p>
      <div className={styles.buttons}>
        <a href="#dates" className={styles.primary}>
          JOIN US →
        </a>
        <a href="/contact" className={styles.secondary}>
          ASK A QUESTION
        </a>
      </div>
    </section>
  )
}
