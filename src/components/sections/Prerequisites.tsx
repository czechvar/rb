import type { Event } from '@/payload-types'
import { SectionIntro, type SectionIntroVariant } from './SectionIntro'
import styles from './Prerequisites.module.css'

export function Prerequisites({ items, headingVariant }: { items?: Event['prerequisites']; headingVariant?: SectionIntroVariant }) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <SectionIntro variant={headingVariant} title="Climber type & prerequisites" align="left" />
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
