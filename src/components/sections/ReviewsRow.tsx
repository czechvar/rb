import type { Review } from '@/payload-types'
import styles from './ReviewsRow.module.css'

export function ReviewsRow({
  items,
  heading = 'What Past Climbers Say',
}: {
  items: Review[]
  heading?: string
}) {
  if (!items.length) return null
  return (
    <section className={styles.section}>
      <h2>{heading}</h2>
      <div className={styles.row}>
        {items.map(r => (
          <blockquote key={r.id} className={styles.card}>
            <p>“{r.quote}”</p>
            <footer>
              — {r.reviewerName}
              {r.reviewerLocation ? `, ${r.reviewerLocation}` : ''}
              {r.resultLine ? ` · ${r.resultLine}` : ''}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}
