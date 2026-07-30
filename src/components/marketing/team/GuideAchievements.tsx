import type { Guide } from '@/payload-types'
import styles from './GuideAchievements.module.css'

export function GuideAchievements({ data }: { data: Guide['achievements'] }) {
  if (!data?.items?.length) return null
  return (
    <section className={styles.section} id="achievements">
      <div className={styles.inner}>
        <p className={`section-label ${styles.label}`}>Sports Achievements</p>
        <h2 className={`section-title ${styles.heading}`}>
          On the
          <br />
          rock
        </h2>
        {data.intro ? <p className={styles.intro}>{data.intro}</p> : null}
        <div className={styles.list}>
          {data.items.map((a) => (
            <div key={a.id ?? a.route} className={styles.row}>
              <div>
                <div className={styles.route}>{a.route}</div>
                {a.location ? <div className={styles.loc}>{a.location}</div> : null}
              </div>
              {a.grade ? <span className={styles.grade}>{a.grade}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
