import Link from 'next/link'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <>
      <Header />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.heroEyebrow}>Climb Better, Harder &amp; More</span>
          <h1>Leading Community of Experienced Rock Climbing Guides &amp; Coaches</h1>
          <p>
            We help you reach your individual climbing goals and pursue your climbing dreams.
            Maximum time on rock, pushing the limits, and 100% fun is the goal here.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/calendar" className={styles.ctaPrimary}>
              See Calendar
            </Link>
            <Link href="/programs" className={styles.ctaGhost}>
              Explore Programs
            </Link>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.alt}`}>
        <div className={styles.sectionInner}>
          <span className="eyebrow">What We Offer</span>
          <h2>From First Routes to Send-Day Tactics</h2>
          <p>
            Climbing camps, technique coaching, private guiding, and expeditions —
            all run by IFMGA / UIAGM guides and IFSC-level coaches.
          </p>

          <div className={styles.cardGrid}>
            <article className={styles.card}>
              <h3>Climbing Camps</h3>
              <p>
                Multi-day, single-destination programs designed around a clear performance
                goal. Mornings on rock, afternoons drilling technique, evenings reviewing
                footage.
              </p>
            </article>
            <article className={styles.card}>
              <h3>Technique Coaching</h3>
              <p>
                One-on-one or small-group movement labs for climbers stuck at a grade plateau.
                Built on tactical movement analysis and structured drills.
              </p>
            </article>
            <article className={styles.card}>
              <h3>Private Guiding</h3>
              <p>
                Pick your dates, your destination, your goals. We organize the logistics,
                accommodation, and on-rock coaching to match.
              </p>
            </article>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
