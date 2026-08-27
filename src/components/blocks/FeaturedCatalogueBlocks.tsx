import type { Event, EventDate, Guide, Location, Post, Program } from '@/payload-types'
import type React from 'react'
import {
  resolveFeaturedGuide,
  resolveFeaturedLocation,
  resolveFeaturedProgram,
} from '@/lib/block-resolvers/domain-grids'
import {
  resolveFeaturedEventDate,
  resolveFeaturedPost,
} from '@/lib/block-resolvers/content-discovery'
import { getActiveEventDatesForEvents } from '@/lib/queries'
import { resolveFeaturedTrip } from '@/lib/block-resolvers/trip-grid'
import type { BlockRenderContext } from './RenderBlocks'
import {
  BlockHeader,
  EventDateCard,
  featuredCardClassName,
  featuredSectionClassName,
  GuideCard,
  LocationCard,
  PostCard,
  ProgramCard,
  TripCard,
} from './CatalogueCards'
import { formatPrice, lowestPrice } from './TripGridBlock'
import styles from './blocks.module.css'

type FeaturedBlock = {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  source?: 'manual' | 'currentContext' | null
  variant?: 'card' | 'feature' | 'compact' | 'mediaLed' | null
}

type FeaturedTripBlock = FeaturedBlock & {
  event?: number | Event | null
}

type FeaturedProgramBlock = FeaturedBlock & {
  program?: number | Program | null
}

type FeaturedLocationBlock = FeaturedBlock & {
  location?: number | Location | null
}

type FeaturedGuideBlock = FeaturedBlock & {
  guide?: number | Guide | null
}

type FeaturedPostBlock = FeaturedBlock & {
  post?: number | Post | null
}

type FeaturedEventDateBlock = FeaturedBlock & {
  eventDate?: number | EventDate | null
}

export async function FeaturedTripBlock(
  block: FeaturedTripBlock,
  context: BlockRenderContext = {},
) {
  const event = await resolveFeaturedTrip({
    source: block.source,
    event: block.event,
    currentEvent: context.event,
  })
  if (!event) return null

  const dates = await getActiveEventDatesForEvents([event.id])
  const price = formatPrice(lowestPrice(dates))
  return (
    <FeaturedCardFrame block={block}>
      <TripCard event={event} price={price} className={featuredCardClassName(block.variant)} />
    </FeaturedCardFrame>
  )
}

export async function FeaturedProgramBlock(
  block: FeaturedProgramBlock,
  context: BlockRenderContext = {},
) {
  const program = await resolveFeaturedProgram({
    source: block.source,
    program: block.program,
    currentProgram: context.program,
  })
  if (!program) return null

  return (
    <FeaturedCardFrame block={block}>
      <ProgramCard program={program} className={featuredCardClassName(block.variant)} />
    </FeaturedCardFrame>
  )
}

export async function FeaturedLocationBlock(
  block: FeaturedLocationBlock,
  context: BlockRenderContext = {},
) {
  const location = await resolveFeaturedLocation({
    source: block.source,
    location: block.location,
    currentLocation: context.location,
  })
  if (!location) return null

  return (
    <FeaturedCardFrame block={block}>
      <LocationCard
        location={location}
        variant={block.variant}
        className={featuredCardClassName(block.variant)}
      />
    </FeaturedCardFrame>
  )
}

export async function FeaturedGuideBlock(
  block: FeaturedGuideBlock,
  context: BlockRenderContext = {},
) {
  const guide = await resolveFeaturedGuide({
    source: block.source,
    guide: block.guide,
    currentGuide: context.guide,
  })
  if (!guide) return null

  return (
    <FeaturedCardFrame block={block}>
      <GuideCard
        guide={guide}
        variant={block.variant}
        className={featuredCardClassName(block.variant)}
      />
    </FeaturedCardFrame>
  )
}

export async function FeaturedPostBlock(
  block: FeaturedPostBlock,
  context: BlockRenderContext = {},
) {
  const post = await resolveFeaturedPost({
    source: block.source,
    post: block.post,
    currentPost: context.post,
  })
  if (!post) return null

  return (
    <FeaturedCardFrame block={block}>
      <PostCard post={post} className={featuredCardClassName(block.variant)} />
    </FeaturedCardFrame>
  )
}

export async function FeaturedEventDateBlock(block: FeaturedEventDateBlock) {
  const eventDate = await resolveFeaturedEventDate({ eventDate: block.eventDate })
  if (!eventDate) return null

  return (
    <FeaturedCardFrame block={block}>
      <EventDateCard eventDate={eventDate} className={featuredCardClassName(block.variant)} />
    </FeaturedCardFrame>
  )
}

function FeaturedCardFrame({
  block,
  children,
}: {
  block: FeaturedBlock
  children: React.ReactNode
}) {
  return (
    <section className={featuredSectionClassName(block.variant)}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
        <div className={styles.featuredCatalogueWrap}>{children}</div>
      </div>
    </section>
  )
}
