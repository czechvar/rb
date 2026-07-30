import Link from 'next/link'
import type { Review } from '@/payload-types'
import styles from './Testimonials.module.css'

type TestimonialsProps = { reviews: Review[] }

export function Testimonials({ reviews }: TestimonialsProps) {
  if (reviews.length === 0) return null
  return (
    <section className={styles.section}>
      <p className="section-label reveal">Real climbers. Real progress.</p>
      <h2 className="section-title reveal">
        WHAT HAPPENS
        <br />
        WHEN YOU COME.
      </h2>
      <div className={styles.grid}>
        {reviews.map((r) => (
          <div key={r.id} className={`${styles.card} reveal`}>
            <div className={styles.stars}>★★★★★</div>
            {r.resultLine && <p className={styles.pull}>“{r.resultLine}”</p>}
            <p className={styles.body}>{r.quote}</p>
            <span className={styles.who}>
              {r.reviewerName}
              {r.reviewerLocation ? ` — ${r.reviewerLocation}` : ''}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.ctaWrap}>
        <Link href="/reviews" className="btn-ghost">
          Read More Reviews →
        </Link>
      </div>
    </section>
  )
}
