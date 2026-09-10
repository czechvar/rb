import type { Event } from '@/payload-types'
import { SectionIntro, type SectionIntroVariant } from './SectionIntro'
import styles from './Prerequisites.module.css'

export function Prerequisites({ items, headingVariant, eyebrow }: { items?: Event['prerequisites']; headingVariant?: SectionIntroVariant; eyebrow?: string }) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <SectionIntro eyebrow={eyebrow} variant={headingVariant} title="Climber type & prerequisites" align="left" />
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
