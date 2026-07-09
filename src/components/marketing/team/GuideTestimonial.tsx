import type { Guide } from '@/payload-types'
import styles from './GuideTestimonial.module.css'

export function GuideTestimonial({ guide }: { guide: Guide }) {
  const t = guide.testimonial
  if (!t?.quote) return null
  const first = guide.name.split(' ')[0]
  return (
    <section className={styles.section}>
      <p className={`section-label ${styles.label}`}>Client Testimonial</p>
      <h2 className={`section-title ${styles.heading}`}>
        Coached by
        <br />
        {first}
      </h2>
      <div className={`${styles.card} reveal`}>
        <div className={styles.stars} aria-label="5 out of 5 stars">
          ★★★★★
        </div>
        <p className={styles.quote}>&ldquo;{t.quote}&rdquo;</p>
        {t.name ? <span className={styles.who}>{t.name}</span> : null}
        {t.tripLine ? <span className={styles.trip}>{t.tripLine}</span> : null}
      </div>
    </section>
  )
}
