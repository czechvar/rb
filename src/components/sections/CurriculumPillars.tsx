import type { Program } from '@/payload-types'
import styles from './CurriculumPillars.module.css'

export function CurriculumPillars({ pillars }: { pillars?: Program['curriculumPillars'] }) {
  if (!pillars?.length) return null
  return (
    <section className={styles.section}>
      <h2>What You&apos;ll Work On</h2>
      <div className={styles.grid}>
        {pillars.map((p, i) => (
          <div key={i} className={styles.pillar}>
            {p.icon && <div className={styles.icon}>{p.icon}</div>}
            <h3>{p.title}</h3>
            {p.bullets?.length ? (
              <ul>
                {p.bullets.map((b, j) => (
                  <li key={j}>{b.text}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
