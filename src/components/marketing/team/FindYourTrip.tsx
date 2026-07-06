import Link from 'next/link'
import styles from './FindYourTrip.module.css'

type Group = { label: string; links: { label: string; href: string }[] }

const GROUPS: Group[] = [
  {
    label: 'Type',
    links: [
      { label: 'Sport', href: '/programs/sport-climbing-holidays' },
      { label: 'Trad', href: '/programs/trad-multipitch' },
      { label: 'Multi-Pitch', href: '/programs/trad-multipitch' },
      { label: 'Bouldering', href: '/programs/bouldering-camps' },
      { label: 'Big Wall', href: '/programs/road-trips-expeditions' },
      { label: 'Performance Coaching', href: '/programs/performance-technique-camps' },
    ],
  },
  {
    label: 'Level',
    links: [
      { label: 'Beginner', href: '/programs' },
      { label: 'Intermediate', href: '/programs' },
      { label: 'Advanced', href: '/programs' },
      { label: 'Expert', href: '/programs' },
    ],
  },
  {
    label: 'Destination',
    links: [
      { label: 'Spain', href: '/destinations' },
      { label: 'France', href: '/destinations' },
      { label: 'Italy', href: '/destinations' },
      { label: 'Greece', href: '/destinations' },
      { label: 'Slovenia', href: '/destinations' },
      { label: 'Other', href: '/destinations' },
    ],
  },
  {
    label: 'Dates',
    links: [
      { label: 'View Full Calendar', href: '/calendar' },
      { label: 'Upcoming Trips', href: '/calendar' },
    ],
  },
  {
    label: 'Guide / Coach',
    links: [
      { label: 'Any Guide', href: '/team' },
      { label: 'Guide', href: '/team' },
      { label: 'Coach', href: '/team' },
      { label: 'Guide + Coach', href: '/team' },
    ],
  },
  {
    label: 'Duration',
    links: [
      { label: 'Weekend (2–3 days)', href: '/calendar' },
      { label: '1 Week', href: '/calendar' },
      { label: '2 Weeks', href: '/calendar' },
      { label: '2+ Weeks', href: '/calendar' },
    ],
  },
]

export function FindYourTrip() {
  return (
    <section className={styles.section} id="search">
      <div className={styles.inner}>
        <p className="section-label">Explore</p>
        <h2 className="section-title">
          FIND YOUR COURSE
          <br />
          OR TRIP
        </h2>
        <p className={styles.sub}>Search by destination, discipline, coach, or grade level</p>
        <div className={styles.groups}>
          {GROUPS.map((g) => (
            <div key={g.label} className={styles.group}>
              <p className={styles.label}>{g.label}</p>
              <ul className={styles.list}>
                {g.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className={styles.link}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
