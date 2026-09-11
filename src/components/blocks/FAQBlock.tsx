import { tripCopy } from './trip-copy'
import type { Page } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import { resolveFAQs } from '@/lib/block-resolvers/faq'
import { relationId } from '@/lib/block-resolvers/helpers'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'

type FAQBlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'faq' }>

export async function FAQBlock(block: FAQBlockProps, context: BlockRenderContext = {}) {
  const appliesToTrip =
    block.source === 'byEvent' &&
    !!context.trip &&
    relationId(block.event ?? context.event) === context.trip.event.id
  const copy = appliesToTrip
    ? tripCopy(context.trip, 'faq', block)
    : { ...block, intro: undefined, hide: false }
  if (copy.hide) return null
  const preview = appliesToTrip
    ? context.trip?.editorial?.faqs?.filter((row) => row.question && row.answer)
    : undefined
  const inlineItems = block.source === 'inline' ? (block.items ?? []) : []
  const collectionItems =
    block.source === 'inline' || preview?.length
      ? []
      : await resolveFAQs({
          ...block,
          event: block.event ?? context.event,
          program: block.program ?? context.program,
        })
  const items = block.source === 'inline' ? inlineItems : collectionItems
  if (items.length === 0 && !preview?.length) return null

  return (
    <section
      className={[
        styles.faqSection,
        block.variant === 'lightEditorial' ? styles.faqLightEditorial : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          {copy.eyebrow ? (
            <p data-eyebrow="section" className={styles.eyebrow}>
              {copy.eyebrow}
            </p>
          ) : null}
          {copy.heading && <h2>{copy.heading}</h2>}
          {copy.intro && <p>{copy.intro}</p>}
        </div>
        <dl
          className={`${styles.faqList} ${block.variant === 'singleColumn' ? styles.faqSingle : ''}`}
        >
          {preview?.length
            ? preview.map((item, index) => (
                <div key={index} className={styles.faqItem}>
                  <dt>{item.question}</dt>
                  <dd>
                    <p style={{ whiteSpace: 'pre-line' }}>{item.answer}</p>
                  </dd>
                </div>
              ))
            : items.map((item, index) => (
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
