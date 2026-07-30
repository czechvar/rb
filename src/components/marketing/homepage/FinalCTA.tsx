import Link from 'next/link'
import styles from './FinalCTA.module.css'

export function FinalCTA() {
  return (
    <section className={styles.section}>
      <h2 className={styles.display}>
        YOUR NEXT LEVEL
        <br />
        STARTS NOW.
      </h2>
      <p className={styles.body}>
        Stop climbing the same way. Stop waiting for the right time. Every week you wait is a week
        someone else is on the rock getting stronger.
      </p>
      <div className={styles.ctas}>
        <Link href="/programs" className="btn-dark">
          Find Your Trip
        </Link>
        <Link href="/contact" className="btn-outline-dark">
          Talk to the Team
        </Link>
      </div>
    </section>
  )
}
