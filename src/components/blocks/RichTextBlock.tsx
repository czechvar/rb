import type { Page } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './blocks.module.css'

type RichTextBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'rich-text' }
>

export function RichTextBlock({ content, eyebrow, heading, width }: RichTextBlockProps) {
  const className = [
    styles.richTextSection,
    width === 'wide' ? styles.richTextWide : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={className}>
      <div className={styles.sectionInner}>
        {heading || eyebrow ? (
          <div className={styles.sectionHeader}>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
            {heading ? <h2>{heading}</h2> : null}
          </div>
        ) : null}
        <div className={styles.richTextBody}>
          <Lexical data={content} />
        </div>
      </div>
    </section>
  )
}
