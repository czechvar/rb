import type { Event } from '@/payload-types'
import { SectionIntro } from './SectionIntro'
import styles from './Prerequisites.module.css'

export function Prerequisites({ items }: { items?: Event['prerequisites'] }) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <SectionIntro title="Rider type & prerequisites" align="left" />
      <ul className={styles.list}>
        {items.map((item, i) => (
          <li key={i} className={styles.item}>
            {item.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
