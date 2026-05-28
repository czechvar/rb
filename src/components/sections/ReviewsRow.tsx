import type { Review } from '@/payload-types'
import styles from './ReviewsRow.module.css'

export function ReviewsRow({ items }: { items?: Review[] }) {
  const review = items?.[0]
  if (!review) return null
  return (
    <section className={styles.section}>
      <blockquote className={styles.quote}>
        <p className={styles.body}>&ldquo;{review.quote}&rdquo;</p>
        <footer className={styles.attrib}>
          &mdash; {review.reviewerName}
          {review.reviewerLocation ? `, ${review.reviewerLocation}` : ''}
          {review.resultLine ? ` · ${review.resultLine}` : ''}
        </footer>
      </blockquote>
    </section>
  )
}
