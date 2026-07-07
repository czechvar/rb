import type { Type } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import { SectionIntro } from './SectionIntro'
import styles from './AudienceCards.module.css'

export function AudienceCards({
  cards,
  soloNote,
  redirectCallout,
}: {
  cards?: Type['audienceCards']
  soloNote?: Type['soloNote']
  redirectCallout?: Type['redirectCallout']
}) {
  if (!cards?.length) return null
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <SectionIntro title="Who this camp is for" align="left" />
        <div className={styles.grid}>
          {cards.map((c, i) => (
            <div
              key={i}
              className={`${styles.card} ${c.highlighted ? styles.highlighted : ''}`}
            >
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className={styles.heading}>{c.heading}</h3>
              <p className={styles.body}>{c.body}</p>
            </div>
          ))}
        </div>
        {soloNote && <p className={styles.soloNote}>{soloNote}</p>}
        {redirectCallout && (
          <div className={styles.callout}>
            <Lexical data={redirectCallout} />
          </div>
        )}
      </div>
    </section>
  )
}
