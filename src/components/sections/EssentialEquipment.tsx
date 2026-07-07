import type { Event } from '@/payload-types'
import { SectionIntro } from './SectionIntro'
import styles from './EssentialEquipment.module.css'

export function EssentialEquipment({
  items,
  intro,
}: {
  items?: Event['essentialEquipment']
  intro?: string | null
}) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <SectionIntro
          title="Essential equipment"
          lead={intro ?? undefined}
          align="left"
        />
        <ul className={styles.list}>
          {items.map((item, i) => (
            <li key={i} className={`${styles.item} ${item.mandatory ? styles.mandatory : ''}`}>
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              <div>
                <p className={styles.name}>
                  {item.name}
                  {item.mandatory && <span className={styles.required}> *</span>}
                </p>
                {item.note && <p className={styles.note}>{item.note}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
