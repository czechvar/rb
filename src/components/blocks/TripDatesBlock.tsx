import type { Event } from '@/payload-types'
import { getActiveEventDatesForEvent } from '@/lib/queries'
import { EventDatesList } from '@/components/sections/EventDatesList'
import type { BlockRenderContext } from './RenderBlocks'

type TripDatesBlockProps = Record<string, unknown>

export async function TripDatesBlock(block: TripDatesBlockProps, { event, trip }: BlockRenderContext) {
  if (!isEvent(event)) return null

  const dates = trip?.dates ?? await getActiveEventDatesForEvent(event.id)
  return (
    <EventDatesList
      items={dates}
      variant={block.variant === 'rows' ? 'rows' : 'default'}
      selectedId={trip?.selectedDate?.id}
      eventSlug={event.slug}
      heading={typeof block.heading === 'string' ? block.heading : 'Dates & Pricing'}
    />
  )
}

function isEvent(event: BlockRenderContext['event']): event is Event {
  return typeof event === 'object' && event !== null
}
