import type { Page } from '@/payload-types'
import styles from './blocks.module.css'

type SectionIntroBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'section-intro' }
>

export function SectionIntroBlock({ alignment, body, eyebrow, heading }: SectionIntroBlockProps) {
  const className = [
    styles.sectionIntro,
    alignment === 'center' ? styles.sectionIntroCenter : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={className}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h2>{heading}</h2>
          {body ? <p className={styles.lead}>{body}</p> : null}
        </div>
      </div>
    </section>
  )
}
