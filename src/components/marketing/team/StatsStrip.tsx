import Link from 'next/link'
import styles from './StatsStrip.module.css'

export function StatsStrip() {
  return (
    <div className={styles.band}>
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.content}>
        <h2 className={`section-title ${styles.heading}`}>THE ROCK DOESN&apos;T LIE</h2>
        <p className={styles.body}>
          18 elite guides and coaches. 40+ destinations. One community built on genuine passion
          for the vertical world.
        </p>
        <Link href="#guides" className="btn-primary">
          View All Coaches &amp; Guides →
        </Link>
      </div>
    </div>
  )
}
