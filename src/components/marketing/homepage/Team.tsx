import Link from 'next/link'
import Image from 'next/image'
import type { Guide, Media } from '@/payload-types'
import styles from './Team.module.css'

type TeamProps = { founder: Guide | null }

const UMBRELLAS = [
  {
    role: 'International Guide',
    name: 'Elite International\nGuides',
    tagline:
      'IFMGA-certified guides active at 8a+ level. Real climbers who coach the technical and mental game — not just route guides.',
  },
  {
    role: 'Pro Clinic Partners',
    name: 'World-Class\nPro Climbers',
    tagline:
      'Adam Ondra, Daila Ojeda, Hazel Findlay, Dave Graham and more — brought into camps for hands-on workshops and real coaching sessions.',
  },
  {
    role: 'Local Expert',
    name: 'Local Experts at\nEvery Destination',
    tagline:
      "Insiders at each crag who know the secret sectors, the right conditions, and the local climbing community — so you get the full picture.",
  },
]

function photoUrl(photo: Guide['photo']): string | null {
  if (!photo || typeof photo !== 'object') return null
  return (photo as Media).url ?? null
}

export function Team({ founder }: TeamProps) {
  return (
    <section className={styles.section} id="team">
      <div className={styles.intro}>
        <div className="reveal">
          <p className="section-label">The People Behind the Progression</p>
          <h2 className="section-title">
            CLIMBERS.
            <br />
            COACHES.
            <br />
            MENTORS.
          </h2>
        </div>
        <div className="reveal">
          <p className={styles.body}>
            Our team isn&apos;t just certified — they&apos;re active climbers, coaches, and
            passionate educators dedicated to your progression. We live and breathe this sport.
            You&apos;ll feel the difference on day one.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {founder && (
          <div className={`${styles.card} ${styles.cardFounder} reveal`}>
            {photoUrl(founder.photo) && (
              <Image
                src={photoUrl(founder.photo)!}
                alt={founder.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={styles.cardBg}
              />
            )}
            <div className={styles.cardGradient} aria-hidden="true" />
            <div className={styles.cardInfo}>
              <span className={styles.cardRole}>Founder &amp; Head Coach</span>
              <h3 className={styles.cardName}>{founder.name}</h3>
              {founder.role && <p className={styles.cardTagline}>{founder.role}</p>}
            </div>
          </div>
        )}

        {UMBRELLAS.map((u) => (
          <div key={u.role} className={`${styles.card} reveal`}>
            <div className={styles.cardGradient} aria-hidden="true" />
            <div className={styles.cardInfo}>
              <span className={styles.cardRole}>{u.role}</span>
              <h3 className={`${styles.cardName} ${styles.cardNameMulti}`}>{u.name}</h3>
              <p className={styles.cardTagline}>{u.tagline}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.ctaRow}>
        <Link href="/team" className="btn-primary">
          Meet the Full Team →
        </Link>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>12+</span>
            <span className={styles.statLabel}>Active coaches &amp; guides</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>8+</span>
            <span className={styles.statLabel}>Countries represented</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumRed}>100%</span>
            <span className={styles.statLabel}>Active climbers themselves</span>
          </div>
        </div>
      </div>
    </section>
  )
}
