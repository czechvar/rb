import type { ReactNode } from 'react'
import type { Program } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import { SectionIntro, type SectionIntroVariant } from './SectionIntro'
import styles from './AudienceCards.module.css'

export function AudienceCards({
  headingVariant,
  heading = 'Who this camp is for',
  intro,
  eyebrow,
  cards,
  soloNote,
  redirectCallout,
}: {
  headingVariant?: SectionIntroVariant
  heading?: ReactNode
  intro?: string
  eyebrow?: string
  cards?: Program['audienceCards']
  soloNote?: Program['soloNote']
  redirectCallout?: Program['redirectCallout']
}) {
  if (!cards?.length) return null
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <SectionIntro eyebrow={eyebrow} variant={headingVariant} title={heading} lead={intro} align="left" />
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
