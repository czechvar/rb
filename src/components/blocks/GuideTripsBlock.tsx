import Link from 'next/link'
import type { Event, Page } from '@/payload-types'
import type { BlockRenderContext } from './RenderBlocks'
import { resolveGuideTripsEvents } from '@/lib/block-resolvers/content-discovery'
import styles from './blocks.module.css'

type GuideTripsBlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'guideTrips' }>

export async function GuideTripsBlock(
  { eyebrow, heading, intro, source, guide, events, limit, variant }: GuideTripsBlockProps,
  context: BlockRenderContext = {},
) {
  const items = await resolveGuideTripsEvents({
    source,
    guide,
    currentGuide: context.guide,
    events,
    limit,
  })
  if (!items.length) return null

  return (
    <section className={styles.domainGridSection}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
        <div className={gridClassName(variant)}>
          {items.map((event) => (
            <GuideTripCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  )
}

function GuideTripCard({ event }: { event: Event }) {
  return (
    <Link href={`/trips/${event.slug}`} className={styles.domainCard}>
      <p className={styles.cardMeta}>Trip</p>
      <h3>{event.title}</h3>
      {event.shortDescription ? <p>{event.shortDescription}</p> : null}
      <span className={styles.cardLinkText}>View trip</span>
    </Link>
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
