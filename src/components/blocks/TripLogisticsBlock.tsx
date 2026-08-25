import type { Event } from '@/payload-types'
import { EventAccommodationLogistics } from '@/components/sections/EventAccommodationLogistics'
import type { BlockRenderContext } from './RenderBlocks'

type TripLogisticsBlockProps = Record<string, unknown>

export function TripLogisticsBlock(block: TripLogisticsBlockProps, { event }: BlockRenderContext) {
  if (!isEvent(event)) return null

  return (
    <EventAccommodationLogistics
      accommodation={event.accommodation}
      heading={typeof block.heading === 'string' ? block.heading : undefined}
      transport={event.transport}
    />
  )
}

function isEvent(event: BlockRenderContext['event']): event is Event {
  return typeof event === 'object' && event !== null
}
