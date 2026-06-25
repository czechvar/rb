import Link from 'next/link'
import Image from 'next/image'
import type { Guide, Media } from '@/payload-types'
import styles from './ProClimbers.module.css'

type ProClimbersProps = { guides: Guide[] }

function photoUrl(photo: Guide['photo']): string | null {
  if (!photo || typeof photo !== 'object') return null
  return (photo as Media).url ?? null
}

export function ProClimbers({ guides }: ProClimbersProps) {
  if (guides.length === 0) return null
  return (
    <section className={styles.section} id="pro-clinics">
      <div className="reveal">
        <p className="section-label">Pro climber workshops</p>
        <h2 className="section-title">
          LEARN FROM THE
          <br />
          WORLD&apos;S BEST
        </h2>
        <p className={styles.body}>
          We bring elite climbers into our trips and camps — not for photos, but for real coaching.
          Workshops, sessions on the rock, Q&amp;A, and time actually climbing alongside people
          operating at the sport&apos;s absolute ceiling.
        </p>
      </div>

      <div className={`${styles.grid} reveal`}>
        {guides.map((g) => {
          const url = photoUrl(g.photo)
          return (
            <div key={g.id} className={styles.card}>
              {url && (
                <Image
                  src={url}
                  alt={g.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={styles.cardBg}
                />
              )}
              <div className={styles.cardGradient} aria-hidden="true" />
              <div className={styles.cardInfo}>
                {g.role && <span className={styles.cardRole}>{g.role}</span>}
                <h3 className={styles.cardName}>{g.name}</h3>
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.ctaWrap}>
        <Link href="/programs?category=pro-clinics" className="btn-primary">
          See Upcoming Clinics
        </Link>
      </div>
    </section>
  )
}
