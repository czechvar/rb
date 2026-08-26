import type { Page } from '@/payload-types'
import { resolveCalendarEventDates } from '@/lib/block-resolvers/content-discovery'
import type { BlockRenderContext } from './RenderBlocks'
import { BlockHeader, EventDateCard } from './CatalogueCards'
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
            <EventDateCard key={date.id} eventDate={date} />
          ))}
        </div>
      </div>
    </section>
  )
}

function gridClassName(variant?: string | null) {
  return [styles.domainGrid, variant === 'compact' ? styles.domainGridCompact : '']
    .filter(Boolean)
    .join(' ')
}
