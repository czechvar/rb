import type { Page } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import { resolveFAQs } from '@/lib/block-resolvers/faq'
import styles from './blocks.module.css'

type FAQBlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'faq' }>

export async function FAQBlock(block: FAQBlockProps) {
  const inlineItems = block.source === 'inline' ? block.items ?? [] : []
  const collectionItems = block.source === 'inline' ? [] : await resolveFAQs(block)
  const items = block.source === 'inline' ? inlineItems : collectionItems
  if (items.length === 0) return null

  return (
    <section className={styles.faqSection}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          {block.eyebrow ? <p className={styles.eyebrow}>{block.eyebrow}</p> : null}
          <h2>{block.heading}</h2>
        </div>
        <dl className={`${styles.faqList} ${block.variant === 'singleColumn' ? styles.faqSingle : ''}`}>
          {items.map((item, index) => (
            <div key={'id' in item && item.id ? item.id : index} className={styles.faqItem}>
              <dt>{item.question}</dt>
              <dd>
                <Lexical data={item.answer} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
