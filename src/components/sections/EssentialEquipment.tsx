import type { Event } from '@/payload-types'
import styles from './EssentialEquipment.module.css'

export function EssentialEquipment({
  items,
  intro,
}: {
  items?: Event['essentialEquipment']
  intro?: Event['equipmentIntro']
}) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <h2>Essential Equipment</h2>
      {intro && <p className={styles.intro}>{intro}</p>}
      <ul className={styles.grid}>
        {items.map((eq, i) => (
          <li
            key={i}
            className={`${styles.item} ${eq.mandatory ? styles.mandatory : ''}`}
          >
            {eq.icon && <span className={styles.icon}>{eq.icon}</span>}
            <strong className={styles.name}>{eq.name}</strong>
            {eq.note && <span className={styles.note}>{eq.note}</span>}
            {eq.mandatory && <span className={styles.badge}>Mandatory</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
