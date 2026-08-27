import type { Page, Review } from '@/payload-types'
import { resolveReviewGridReviews } from '@/lib/block-resolvers/domain-grids'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'

type ReviewGridBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'reviewGrid' }
>

export async function ReviewGridBlock({
  event,
  eyebrow,
  heading,
  intro,
  limit,
  program,
  reviews,
  source,
  variant,
}: ReviewGridBlockProps, context: BlockRenderContext = {}) {
  const items = await resolveReviewGridReviews({
    source,
    reviews,
    event: event ?? context.event,
    program: program ?? context.program,
    limit,
  })
  if (!items.length) return null

  return (
    <section className={`${styles.domainGridSection} ${styles.reviewGridSection}`}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
        <div className={gridClassName(variant)}>
          {items.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <blockquote className={styles.reviewCard}>
      <p>{review.quote}</p>
      <footer>
        {review.reviewerName}
        {review.reviewerLocation ? `, ${review.reviewerLocation}` : ''}
        {review.resultLine ? <span>{review.resultLine}</span> : null}
      </footer>
    </blockquote>
  )
}

function BlockHeader({
  eyebrow,
  heading,
  intro,
}: {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
}) {
  if (!eyebrow && !heading && !intro) return null
  return (
    <div className={styles.sectionHeader}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className={styles.lead}>{intro}</p> : null}
    </div>
  )
}

function gridClassName(variant?: string | null) {
  return [styles.domainGrid, variant === 'compact' ? styles.domainGridCompact : '']
    .filter(Boolean)
    .join(' ')
}
