import type { Review } from '@/payload-types'
import styles from './ReviewsRow.module.css'

export function ReviewsRow({ items }: { items?: Review[] }) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Results</p>
        <h2 className={styles.title}>What Past Campers Say</h2>
        <div className={styles.grid}>
          {items.slice(0, 3).map(review => (
            <blockquote key={review.id} className={styles.card}>
              <p className={styles.body}>{review.quote}</p>
              <footer className={styles.attrib}>
                {review.reviewerName}
                {review.reviewerLocation ? `, ${review.reviewerLocation}` : ''}
                {review.resultLine ? (
                  <> &middot; <span className={styles.result}>{review.resultLine}</span></>
                ) : null}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
