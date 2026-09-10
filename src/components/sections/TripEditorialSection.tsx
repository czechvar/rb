import type { Event } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import { SectionIntro } from './SectionIntro'
import styles from './TripEditorialSection.module.css'

type TripSection = NonNullable<NonNullable<Event['tripDetail']>['sections']>[number]

/** Presentation never splits, rewrites or groups the source rich-text tree. */
export function TripEditorialSection({
  section,
  variant = 'prose',
  id,
  eyebrow,
  tone,
}: {
  section: TripSection
  variant?: 'prose' | 'cards' | 'timeline'
  id?: string
  eyebrow?: string
  tone?: 'bright'
}) {
  return (
    <section id={id} className={`${styles.section} ${styles[variant]} ${tone === 'bright' ? styles.bright : ''}`}>
      <div className={styles.inner}>
        <SectionIntro variant="embedded" eyebrow={eyebrow} title={section.heading} align="left" />
        <div className={styles.body}><Lexical data={section.body} /></div>
      </div>
    </section>
  )
}
