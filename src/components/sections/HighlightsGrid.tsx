import type { Type } from '@/payload-types'
import styles from './HighlightsGrid.module.css'

export function HighlightsGrid({
  items,
  heading = 'Highlights',
}: {
  items?: Type['highlights']
  heading?: string
}) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <h2>{heading}</h2>
      <ul className={styles.grid}>
        {items.map((h, i) => (
          <li key={i} className={styles.card}>
            <span className={styles.icon}>✓</span> {h.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
