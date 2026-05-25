import type { Type } from '@/payload-types'
import styles from './ResultsOutcomes.module.css'

export function ResultsOutcomes({ items }: { items?: Type['results'] }) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <h2>Results You Can Expect</h2>
      <ul className={styles.grid}>
        {items.map((r, i) => (
          <li key={i} className={styles.card}>
            {r.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
