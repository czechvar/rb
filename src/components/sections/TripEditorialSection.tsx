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
}: {
  section: TripSection
  variant?: 'prose' | 'cards' | 'timeline'
  id?: string
}) {
  return (
    <section id={id} className={`${styles.section} ${styles[variant]}`}>
      <div className={styles.inner}>
        <SectionIntro title={section.heading} align="left" />
        <div className={styles.body}><Lexical data={section.body} /></div>
      </div>
    </section>
  )
}
