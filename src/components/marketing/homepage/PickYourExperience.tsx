import Link from 'next/link'
import styles from './PickYourExperience.module.css'

const CATEGORIES = [
  {
    slug: 'road-trips-expeditions',
    name: 'Climbing Road Trips & Expeditions',
    tag: 'Multi-week, multi-crag. Live, climb, improve non-stop.',
  },
  {
    slug: 'sport-climbing-holidays',
    name: 'Sport Climbing Holidays',
    tag: 'High performance, sun, great routes, great people.',
  },
  {
    slug: 'bouldering-camps',
    name: 'Bouldering Camps',
    tag: 'Power, movement, problem-solving on world-class blocs.',
  },
  {
    slug: 'performance-technique-camps',
    name: 'Performance & Technique Camps',
    tag: 'Break your plateau. Structured coaching and real feedback.',
  },
  {
    slug: 'sport-climbing-courses',
    name: 'Sport Climbing Courses',
    tag: 'Gym to rock. Lead, project, and perform outdoors.',
  },
  {
    slug: 'trad-multipitch',
    name: 'Trad & Multi-Pitch',
    tag: 'Bigger terrain. Real systems, real safety, real adventure.',
  },
  {
    slug: 'private-coaching',
    name: 'Private Coaching',
    tag: 'Fully personalized. Your goals, your timeline, your level.',
  },
  {
    slug: 'custom-trips',
    name: 'Custom Trips',
    tag: 'Your crew. Your vision. Your ultimate climbing experience.',
  },
]

export function PickYourExperience() {
  return (
    <section className={styles.section} id="trips">
      <p className="section-label">Find your climbing path</p>
      <h2 className="section-title">
        PICK YOUR
        <br />
        EXPERIENCE
      </h2>
      <div className={styles.grid}>
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/programs/${c.slug}`} className={`${styles.card} reveal`}>
            <h3 className={styles.cardName}>{c.name}</h3>
            <p className={styles.cardTag}>{c.tag}</p>
            <span className={styles.cardArrow}>→</span>
          </Link>
        ))}
      </div>
      <div className={styles.ctaWrap}>
        <Link href="/programs" className="btn-ghost">
          Explore All Categories →
        </Link>
      </div>
    </section>
  )
}
