import type { EventDate } from '@/payload-types'
import styles from './EventDatesList.module.css'

function fmtDate(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function durationDays(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}

export function EventDatesList({
  items,
  heading = 'Dates & Pricing',
}: {
  items: EventDate[]
  heading?: string
}) {
  if (!items?.length) return null
  return (
    <section id="dates" className={styles.section}>
      <h2>{heading}</h2>
      <ul className={styles.grid}>
        {items.map((d) => {
          const days = durationDays(d.dateFrom, d.dateTo)
          const spots = typeof d.capacity === 'number' ? d.capacity : null
          return (
            <li key={d.id} className={styles.card}>
              <div className={styles.range}>
                {fmtDate(d.dateFrom)} – {fmtDate(d.dateTo)}
              </div>
              <div className={styles.duration}>
                {days} day{days === 1 ? '' : 's'}
              </div>
              <div className={styles.price}>
                {d.currency} {d.price.toLocaleString()}
              </div>
              <div className={styles.priceNote}>per person</div>
              {spots !== null && (
                <div className={styles.spots}>
                  {spots} spot{spots === 1 ? '' : 's'} available
                </div>
              )}
              <a href="/contact" className={styles.cta}>
                Reserve a spot →
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
