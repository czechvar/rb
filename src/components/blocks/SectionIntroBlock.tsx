import type { Page } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './blocks.module.css'

type SectionIntroBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'section-intro' }
> & {
  variant?: 'light' | 'darkSplit' | null
}

export function SectionIntroBlock({ alignment, body, eyebrow, heading, variant }: SectionIntroBlockProps) {
  const isDarkSplit = variant === 'darkSplit'
  const className = [
    styles.sectionIntro,
    alignment === 'center' && !isDarkSplit ? styles.sectionIntroCenter : '',
    isDarkSplit ? styles.sectionIntroDarkSplit : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={className}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h2>{heading}</h2>
        </div>
        {body ? (
          <div className={styles.sectionIntroBody}>
            <Lexical data={body} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
