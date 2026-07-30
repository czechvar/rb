import Image from 'next/image'
import { Lexical } from '@/lib/lexical'
import { mediaUrl, mediaAlt } from '@/lib/media'
import type { Type, Guide } from '@/payload-types'
import styles from './CoachesRich.module.css'

function isGuide(x: number | Guide): x is Guide {
  return typeof x !== 'number'
}

export function CoachesRich({
  coaches,
  framing,
}: {
  coaches?: Type['coaches']
  framing?: Type['coachFramingParagraph']
}) {
  const resolved = (coaches ?? []).filter(isGuide)
  if (!resolved.length) return null
  return (
    <section className={styles.section}>
      <h2>Your Coaches</h2>
      {framing && <p className={styles.framing}>{framing}</p>}
      <div className={styles.row}>
        {resolved.map(g => {
          const url = mediaUrl(g.photo)
          return (
            <div key={g.id} className={styles.card}>
              {url ? (
                <Image
                  src={url}
                  alt={mediaAlt(g.photo)}
                  width={144}
                  height={144}
                  className={styles.photo}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>PHOTO</div>
              )}
              <h3>{g.name}</h3>
              {g.content && (
                <div className={styles.bio}>
                  <Lexical data={g.content} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
