import Link from 'next/link'
import type { Event, EventDate, Page } from '@/payload-types'
import { resolveCalendarEventDates } from '@/lib/block-resolvers/content-discovery'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'

type CalendarBlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'calendar' }>

export async function CalendarBlock({
  eyebrow,
  heading,
  intro,
  source,
  eventDates,
  event,
  limit,
  variant,
}: CalendarBlockProps, context: BlockRenderContext = {}) {
  const items = await resolveCalendarEventDates({
    source,
    eventDates,
    event: event ?? context.event,
    limit,
  })
  if (!items.length) return null

  return (
    <section className={styles.domainGridSection}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
        <div className={gridClassName(variant)}>
          {items.map((date) => (
            <CalendarCard key={date.id} eventDate={date} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CalendarCard({ eventDate }: { eventDate: EventDate }) {
  const event = eventDate.event as Event
  return (
    <Link href={`/trips/${event.slug}`} className={styles.domainCard}>
      <p className={styles.cardMeta}>{formatDateRange(eventDate.dateFrom, eventDate.dateTo)}</p>
      <h3>{event.title}</h3>
      <p>
        {eventDate.currency} {eventDate.price}
        {typeof eventDate.capacity === 'number' ? ` · ${eventDate.capacity} seats` : ''}
      </p>
      <span className={styles.cardLinkText}>View trip</span>
    </Link>
  )
}

function formatDateRange(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
  return `${formatter.format(new Date(from))} - ${formatter.format(new Date(to))}`
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
