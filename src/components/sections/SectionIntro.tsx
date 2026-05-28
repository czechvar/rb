import styles from './SectionIntro.module.css'

export function SectionIntro({
  eyebrow,
  title,
  lead,
  align = 'center',
}: {
  eyebrow?: string
  title: string
  lead?: string
  align?: 'left' | 'center'
}) {
  return (
    <section
      className={`${styles.intro} ${align === 'center' ? styles.center : styles.left}`}
    >
      <div className={styles.inner}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 className={styles.title}>{title}</h2>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>
    </section>
  )
}
