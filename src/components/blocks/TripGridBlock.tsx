import type { EventDate, Page } from '@/payload-types'
import Link from 'next/link'
import { getActiveEventDatesForEvents } from '@/lib/queries'
import { resolveTripGridEvents } from '@/lib/block-resolvers/trip-grid'
import type { BlockRenderContext } from './RenderBlocks'
import { BlockHeader, TripCard } from './CatalogueCards'
import { ImageTripCard } from '@/components/catalogue/ImageTripCard'
import imageCardStyles from '@/components/catalogue/ImageTripCard.module.css'
import { eventCatalogueDescription } from '@/lib/event-catalogue-card'
import styles from './blocks.module.css'
import { tripPublicDatePath } from '@/lib/occurrence-routing'
import { HeadingText } from '@/components/ui/EditorialHeading'
import { resolveTripCardContent } from '@/lib/trip-card-content'

type TripGridBlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'tripGrid' }>

export function lowestPrice(dates: EventDate[]): EventDate | null {
  return dates.reduce<EventDate | null>(
    (acc, date) => (acc === null || date.price < acc.price ? date : acc),
    null,
  )
}

export function formatPrice(date: EventDate | null): string | null {
  if (!date) return null
  return `From ${date.currency} ${date.price.toLocaleString()}`
}

export async function TripGridBlock(block: TripGridBlockProps, context: BlockRenderContext = {}) {
  const events = await resolveTripGridEvents({
    ...block,
    program: block.program ?? context.program,
    location: block.location ?? context.location,
  })
  if (events.length === 0) return null

  const dates = await getActiveEventDatesForEvents(events.map((event) => event.id))
  const datesByEvent = new Map<number, EventDate[]>()
  for (const date of dates) {
    const eventId = typeof date.event === 'object' ? date.event.id : date.event
    const bucket = datesByEvent.get(eventId) ?? []
    bucket.push(date)
    datesByEvent.set(eventId, bucket)
  }

  const className = [
    styles.tripGrid,
    block.variant === 'compact' ? styles.tripGridCompact : '',
    block.variant === 'editorial' || block.variant === 'featureLead' ? styles.tripGridEditorial : '',
    block.variant === 'featureLead' ? styles.tripGridFeatureLead : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={className}>
      <div className={styles.sectionInner}>
        {block.variant === 'featureLead' ? (
          <div className={imageCardStyles.header}>
            <BlockHeader eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
            <Link className={imageCardStyles.viewAll} href="/trips">
              View all trips &amp; courses <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : <BlockHeader eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />}
        <div className={block.variant === 'featureLead' ? imageCardStyles.grid : styles.tripCards}>
          {events.map((event, index) => {
            const eventDates = datesByEvent.get(event.id) ?? []
            const first = eventDates[0]
            const href = first ? tripPublicDatePath(event.slug, first) : `/trips/${event.slug}`
            const price = formatPrice(lowestPrice(eventDates))
            const card = resolveTripCardContent(event, first)
            const title = card.titleParts ? <HeadingText parts={card.titleParts} fallback={card.title} /> : card.title
            if (block.variant === 'featureLead') {
              return (
                <ImageTripCard
                  key={event.id}
                  href={href}
                  title={title}
                  description={eventCatalogueDescription(event)}
                  image={card.image?.url ?? null}
                  category={event.categories?.flatMap((item) => typeof item === 'object' ? [item.name] : [])[0]}
                  location={event.locations?.flatMap((item) => typeof item === 'object' ? [item.name] : [])[0]}
                  price={price}
                  featured={index === 0}
                  titleType="card"
                />
              )
            }
            return (
              <TripCard
                event={event}
                href={href}
                key={event.id}
                price={price}
                title={title}
                image={card.image?.url ?? null}
                imageAlt={card.image?.alt ?? ''}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
