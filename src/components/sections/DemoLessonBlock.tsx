import Link from 'next/link'
import type { Event } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import { SectionIntro } from './SectionIntro'
import styles from './DemoLessonBlock.module.css'

export function DemoLessonBlock({ event }: { event: Event }) {
  if (!event.demoEnabled) return null
  const heading = event.demoHeading ?? 'Try before you commit'
  const cta = event.demoCta
  return (
    <section className={styles.demo}>
      <SectionIntro title={heading} />
      {event.demoBody && (
        <div className={styles.body}>
          <Lexical data={event.demoBody} />
        </div>
      )}
      {cta?.url && cta.label && (
        <div className={styles.ctaWrap}>
          <Link href={cta.url} className={styles.cta}>
            {cta.label}
          </Link>
        </div>
      )}
    </section>
  )
}
