import { SectionIntro } from '@/components/sections/SectionIntro'
import { tripCopy } from './trip-copy'
import type { Event } from '@/payload-types'
import { getActiveEventDatesForEvent } from '@/lib/queries'
import { EventDatesList } from '@/components/sections/EventDatesList'
import type { BlockRenderContext } from './RenderBlocks'

type TripDatesBlockProps = Record<string, unknown>

export async function TripDatesBlock(
  block: TripDatesBlockProps,
  { event, trip }: BlockRenderContext,
) {
  if (!isEvent(event)) return null

  const variants = new Set(trip?.dates.map(date =>
    typeof date.tripVariant === 'object' && date.tripVariant !== null ? date.tripVariant.id : date.tripVariant,
  ).filter(Boolean))
  const defaultHeading = block.variant === 'rows' && variants.size > 1 ? 'This Course Travels' : 'Dates & Pricing'
  // The CMS field starts at "Dates & Pricing"; treat that unedited value as a fallback.
  const copyBlock = block.heading === 'Dates & Pricing' ? { ...block, heading: undefined } : block
  const copy = tripCopy(trip, 'dates', copyBlock, { heading: defaultHeading })
  if (copy.hide) return null
  if (trip?.editorial?.datesMode === 'notice')
    return (
      <SectionIntro
        id="dates"
        title={copy.heading}
        eyebrow={copy.eyebrow}
        lead={copy.intro}
        align="left"
      />
    )
  const dates = trip?.dates ?? (await getActiveEventDatesForEvent(event.id))
  return (
    <EventDatesList
      items={dates}
      variant={block.variant === 'rows' ? 'rows' : 'default'}
      selectedId={trip?.selectedDate?.id}
      eventSlug={event.slug}
      eyebrow={copy.eyebrow}
      intro={copy.intro}
      heading={copy.heading}
    />
  )
}

function isEvent(event: BlockRenderContext['event']): event is Event {
  return typeof event === 'object' && event !== null
}
