import type { ReactNode } from 'react'
import styles from './SectionIntro.module.css'

export type SectionIntroVariant = 'default' | 'embedded'

export function SectionIntro({
  id,
  eyebrow,
  title,
  lead,
  align = 'center',
  variant = 'default',
}: {
  id?: string
  eyebrow?: string
  title: ReactNode
  lead?: string
  align?: 'left' | 'center'
  variant?: SectionIntroVariant
}) {
  return (
    <section
      id={id}
      className={`${styles.intro} ${align === 'center' ? styles.center : styles.left} ${variant === 'embedded' ? styles.embedded : ''}`}
    >
      <div className={styles.inner}>
        {eyebrow && <p data-eyebrow="section" className={styles.eyebrow}>{eyebrow}</p>}
        {title !== null && title !== undefined && title !== '' && <h2 className={styles.title}>{title}</h2>}
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>
    </section>
  )
}
