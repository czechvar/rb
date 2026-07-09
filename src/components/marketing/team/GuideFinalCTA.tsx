import Link from 'next/link'
import styles from './GuideFinalCTA.module.css'

export function GuideFinalCTA({ firstName }: { firstName: string }) {
  return (
    <section className={styles.section} id="contact">
      <p className={`section-label ${styles.label}`}>Ready When You Are</p>
      <h2 className={styles.heading}>
        LET&apos;S GET
        <br />
        ON THE ROCK
      </h2>
      <p className={styles.body}>
        Find the right course, trip, or coaching format with {firstName} for where you&apos;re at.
      </p>
      <div className={styles.ctas}>
        <Link href="/calendar" className="btn-dark">
          Find your trip →
        </Link>
        <Link href="/team" className="btn-outline-dark">
          View all guides &amp; coaches
        </Link>
      </div>
    </section>
  )
}
