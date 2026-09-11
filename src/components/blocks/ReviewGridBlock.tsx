import type { ReactNode } from 'react'
import { tripCopy } from './trip-copy'
import type { Page, Review } from '@/payload-types'
import { resolveReviewGridReviews } from '@/lib/block-resolvers/domain-grids'
import { relationId } from '@/lib/block-resolvers/helpers'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'

type ReviewGridBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'reviewGrid' }
>

export async function ReviewGridBlock(
  {
    event,
    eyebrow,
    heading,
    intro,
    limit,
    program,
    reviews,
    source,
    variant,
    ...rest
  }: ReviewGridBlockProps,
  context: BlockRenderContext = {},
) {
  const appliesToTrip =
    source === 'byEvent' &&
    !!context.trip &&
    relationId(event ?? context.event) === context.trip.event.id
  const copy = appliesToTrip
    ? tripCopy(context.trip, 'reviews', { ...rest, eyebrow, heading, intro })
    : { eyebrow, heading, intro, hide: false }
  if (copy.hide) return null
  const previews = appliesToTrip
    ? context.trip?.editorial?.previewReviews?.filter((row) => row.quote)
    : undefined
  const items = previews?.length
    ? []
    : await resolveReviewGridReviews({
        source,
        reviews,
        event: event ?? context.event,
        program: program ?? context.program,
        limit,
      })
  if (!items.length && !previews?.length) return null

  return (
    <section className={`${styles.domainGridSection} ${styles.reviewGridSection}`}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={copy.eyebrow} heading={copy.heading} intro={copy.intro} />
        <div className={gridClassName(variant)}>
          {previews?.length
            ? previews.map((review, index) => (
                <blockquote className={styles.reviewCard} key={index}>
                  <p>{review.quote}</p>
                  <footer>
                    [Design preview] {review.name}
                    {review.context && <span>{review.context}</span>}
                  </footer>
                </blockquote>
              ))
            : items.map((review) => <ReviewCard key={review.id} review={review} />)}
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
  heading?: ReactNode
  intro?: string | null
}) {
  if (!eyebrow && !heading && !intro) return null
  return (
    <div className={styles.sectionHeader}>
      {eyebrow ? (
        <p data-eyebrow="section" className={styles.eyebrow}>
          {eyebrow}
        </p>
      ) : null}
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
