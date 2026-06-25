import styles from './StatsBar.module.css'

const STATS = [
  { num: '15+', label: 'Years on the rock' },
  { num: '3000+', label: 'Climbers coached' },
  { num: '8', label: 'Countries & destinations' },
  { num: '100%', label: 'Pure climbing focus' },
]

export function StatsBar() {
  return (
    <div className={styles.bar}>
      {STATS.map((s) => (
        <div key={s.label} className={styles.item}>
          <span className={styles.num}>{s.num}</span>
          <span className={styles.label}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}
