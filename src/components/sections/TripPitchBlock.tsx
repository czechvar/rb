import Link from 'next/link'
import type { Event } from '@/payload-types'
import styles from './TripPitchBlock.module.css'

export function TripPitchBlock({ event }: { event: Event }) {
  return (
    <section className={styles.pitch}>
      <div className={styles.inner}>
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
        <div className={styles.right}>
          {/* stats grid — placeholder cells, wired with real data in a later task */}
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Duration</span>
              <span className={styles.statValue}>7 or 14 Days</span>
              <span className={styles.statSub}>Flexible formats</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Location</span>
              <span className={styles.statValue}>Rodellar, Spain</span>
              <span className={styles.statSub}>Limestone canyon</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Grade Range</span>
              <span className={styles.statValue}>6b → 8a</span>
              <span className={styles.statSub}>Sweet spot 7a – 7c+</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Group Size</span>
              <span className={styles.statValue}>Max 8 Climbers</span>
              <span className={styles.statSub}>Personal coaching guaranteed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
