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
      <SectionIntro title="Meet your guides" lead={framing ?? undefined} />
      {resolved.length ? (
        <div className={styles.row}>
          {resolved.map(g => {
            const url = mediaUrl(g.photo)
            return (
              <div key={g.id} className={styles.card}>
                {url ? (
                  <Image
                    src={url}
                    alt={mediaAlt(g.photo)}
                    width={120}
                    height={120}
                    className={styles.photo}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>PHOTO</div>
                )}
                <div className={styles.name}>{g.name}</div>
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
    </section>
  )
}
