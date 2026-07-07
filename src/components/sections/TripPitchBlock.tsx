import Link from 'next/link'
import type { Event, Location, Difficulty } from '@/payload-types'
import styles from './TripPitchBlock.module.css'

export function TripPitchBlock({ event }: { event: Event }) {
  // Derive location stat from first embedded location object
  const firstLocation =
    event.locations?.find((l): l is Location => typeof l === 'object' && l !== null) ?? null

  // Derive grade range stat from embedded difficulty objects
  const embeddedDifficulties =
    event.difficulties?.filter((d): d is Difficulty => typeof d === 'object' && d !== null) ?? []
  const gradeRange =
    embeddedDifficulties.length > 1
      ? `${embeddedDifficulties[0].name} → ${embeddedDifficulties[embeddedDifficulties.length - 1].name}`
      : embeddedDifficulties.length === 1
        ? embeddedDifficulties[0].name
        : null

  const hasStats = firstLocation !== null || gradeRange !== null

  return (
    <section className={styles.pitch}>
      <div className={`${styles.inner} ${!hasStats ? styles.innerSingle : ''}`}>
        <div className={styles.left}>
          <span className={styles.eyebrow}>About the Trip</span>
          <h2 className={styles.headline}>{event.title}</h2>
          {event.shortDescription && (
            <p className={styles.lead}>{event.shortDescription}</p>
          )}
          <Link href={`#dates`} className="btn-primary" style={{ marginTop: '2rem' }}>
            Book Now
          </Link>
        </div>
        {hasStats && (
          <div className={styles.right}>
            <div className={styles.statsGrid}>
              {firstLocation && (
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Destination</span>
                  <span className={styles.statValue}>{firstLocation.name}</span>
                </div>
              )}
              {gradeRange && (
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Grade range</span>
                  <span className={styles.statValue}>{gradeRange}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
