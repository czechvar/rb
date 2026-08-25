import type { Event } from '@/payload-types'
import { getActiveEventDatesForEvent } from '@/lib/queries'
import { EventDatesList } from '@/components/sections/EventDatesList'
import type { BlockRenderContext } from './RenderBlocks'

type TripDatesBlockProps = Record<string, unknown>

export async function TripDatesBlock(block: TripDatesBlockProps, { event }: BlockRenderContext) {
  if (!isEvent(event)) return null

  const dates = await getActiveEventDatesForEvent(event.id)
  return (
    <EventDatesList
      items={dates}
      heading={typeof block.heading === 'string' ? block.heading : 'Dates & Pricing'}
    />
  )
}

function isEvent(event: BlockRenderContext['event']): event is Event {
  return typeof event === 'object' && event !== null
}
