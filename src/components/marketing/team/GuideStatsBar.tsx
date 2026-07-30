import type { Guide } from '@/payload-types'
import styles from './GuideStatsBar.module.css'

export function GuideStatsBar({ stats }: { stats: Guide['stats'] }) {
  if (!stats?.length) return null
  return (
    <div className={styles.bar}>
      {stats.map((s) => (
        <div key={s.id ?? s.label} className={styles.item}>
          <span className={styles.num}>{s.value}</span>
          <span className={styles.label}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}
