import Image from 'next/image'
import Link from 'next/link'
import type { Event, EventDate, Location, Media, Page } from '@/payload-types'
import { getActiveEventDatesForEvents } from '@/lib/queries'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { resolveTripGridEvents } from '@/lib/block-resolvers/trip-grid'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'

type TripGridBlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'tripGrid' }>

function locationLabel(locations: Event['locations']): string | null {
  const first = locations?.[0]
  return typeof first === 'object' && first ? (first as Location).name : null
}

function lowestPrice(dates: EventDate[]): EventDate | null {
  return dates.reduce<EventDate | null>(
    (acc, date) => (acc === null || date.price < acc.price ? date : acc),
    null,
  )
}

function formatPrice(date: EventDate | null): string | null {
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
        <div className={styles.sectionHeader}>
          {block.eyebrow ? <p className={styles.eyebrow}>{block.eyebrow}</p> : null}
          <h2>{block.heading}</h2>
          {block.intro ? <p className={styles.lead}>{block.intro}</p> : null}
        </div>
        <div className={styles.tripCards}>
          {events.map((event, index) => {
            const img = mediaUrl(event.mainPicture)
            const price = formatPrice(lowestPrice(datesByEvent.get(event.id) ?? []))
            const loc = locationLabel(event.locations)
            return (
              <Link
                href={`/trips/${event.slug}`}
                key={event.id}
                className={[
                  styles.tripCard,
                  block.variant === 'featureLead' && index === 0 ? styles.tripCardLead : '',
                ].filter(Boolean).join(' ')}
              >
                <div className={styles.tripMedia}>
                  {img ? (
                    <Image
                      src={img}
                      alt={mediaAlt(event.mainPicture as number | Media)}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : null}
                </div>
                <div className={styles.tripContent}>
                  {loc ? <p className={styles.cardMeta}>{loc}</p> : null}
                  <h3>{event.title}</h3>
                  {event.shortDescription ? <p>{event.shortDescription}</p> : null}
                  <div className={styles.tripFooter}>
                    {price ? <span>{price}</span> : <span>Upcoming dates</span>}
                    <span aria-hidden="true">-&gt;</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
