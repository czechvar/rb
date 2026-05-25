import type { Event } from '@/payload-types'
import styles from './Prerequisites.module.css'

export function Prerequisites({ items }: { items?: Event['prerequisites'] }) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <h2>Rider Type &amp; Prerequisites</h2>
      <ul className={styles.bullets}>
        {items.map((b, i) => (
          <li key={i}>{b.text}</li>
        ))}
      </ul>
    </section>
  )
}
