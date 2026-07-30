import Link from 'next/link'
import styles from './TeamFinalCTA.module.css'

export function TeamFinalCTA() {
  return (
    <section className={styles.section}>
      <p className="section-label">Ready?</p>
      <h2 className={styles.display}>
        YOUR NEXT ROUTE
        <br />
        STARTS HERE
      </h2>
      <p className={styles.body}>
        Join a Rockbusters trip, book a coaching session, or contact us to design your perfect
        climbing experience.
      </p>
      <div className={styles.ctas}>
        <Link href="/calendar" className="btn-dark">
          Find My Course →
        </Link>
        <Link href="/programs" className="btn-outline-dark">
          View All Trips
        </Link>
        <Link href="/contact" className="btn-outline-dark">
          Get in Touch
        </Link>
      </div>
    </section>
  )
}
