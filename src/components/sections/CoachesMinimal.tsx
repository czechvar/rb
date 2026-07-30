import Image from 'next/image'
import type { Event, Guide } from '@/payload-types'
import { mediaUrl, mediaAlt } from '@/lib/media'
import { SectionIntro } from './SectionIntro'
import styles from './CoachesMinimal.module.css'

function isGuide(x: number | Guide): x is Guide {
  return typeof x !== 'number'
}

export function CoachesMinimal({
  coaches,
  framing,
  teamBullets,
}: {
  coaches?: Event['coaches']
  framing?: Event['coachFramingParagraph']
  teamBullets?: Event['coachTeamBullets']
}) {
  const resolved = (coaches ?? []).filter(isGuide)
  if (!resolved.length && !teamBullets?.length) return null
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <SectionIntro title="Meet your guides" lead={framing ?? undefined} />
        {resolved.length ? (
          <div className={styles.row}>
            {resolved.map(g => {
              const url = mediaUrl(g.photo)
              return (
                <div key={g.id} className={styles.card}>
                  <div className={styles.photoWrap}>
                    {url ? (
                      <Image
                        src={url}
                        alt={mediaAlt(g.photo)}
                        fill
                        className={styles.photo}
                        sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                      />
                    ) : (
                      <div className={styles.photoPlaceholder}>PHOTO</div>
                    )}
                    <div className={styles.gradient} />
                    <div className={styles.overlay}>
                      {g.role && <span className={styles.role}>{g.role}</span>}
                      <div className={styles.name}>{g.name}</div>
                    </div>
                  </div>
                  {g.tagline && <p className={styles.bio}>{g.tagline}</p>}
                </div>
              )
            })}
          </div>
        ) : null}
        {teamBullets?.length ? (
          <ul className={styles.bullets}>
            {teamBullets.map((b, i) => (
              <li key={i}>{b.text}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
