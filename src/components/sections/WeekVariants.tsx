import type { Type } from '@/payload-types'
import styles from './WeekVariants.module.css'

export function WeekVariants({
  variants,
  recommendation,
}: {
  variants?: Type['weekVariants']
  recommendation?: Type['weekRecommendation']
}) {
  if (!variants?.length) return null
  return (
    <section className={styles.section}>
      <h2>One week or two?</h2>
      <div className={styles.grid}>
        {variants.map((v, i) => (
          <div key={i} className={styles.card}>
            <h3>{v.title}</h3>
            {v.bullets?.length ? (
              <ul>
                {v.bullets.map((b, j) => (
                  <li key={j}>{b.text}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
      {recommendation && <p className={styles.recommendation}>{recommendation}</p>}
    </section>
  )
}
