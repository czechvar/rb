import type { Guide } from '@/payload-types'
import styles from './GuidePillars.module.css'

export function GuidePillars({ guide }: { guide: Guide }) {
  const pillars = guide.coaching?.pillars
  if (!pillars?.length) return null
  const first = guide.name.split(' ')[0]

  return (
    <section className={styles.section} id="specialization">
      <div className={styles.inner}>
        <p className={`section-label ${styles.label}`}>Specialization</p>
        <h2 className={`section-title ${styles.heading}`}>
          What {first}
          <br />
          coaches
        </h2>
        {guide.coaching?.intro ? <p className={styles.intro}>{guide.coaching.intro}</p> : null}
        <div className={styles.grid}>
          {pillars.map((p, i) => (
            <div key={p.id ?? p.title} className={`${styles.pillar} reveal`}>
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className={styles.title}>{p.title}</h3>
              <p className={styles.body}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
