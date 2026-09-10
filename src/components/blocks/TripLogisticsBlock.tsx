import type { Event } from '@/payload-types'
import { EventAccommodationLogistics } from '@/components/sections/EventAccommodationLogistics'
import type { BlockRenderContext } from './RenderBlocks'

type TripLogisticsBlockProps = Record<string, unknown>

export function TripLogisticsBlock(block: TripLogisticsBlockProps, { event, trip }: BlockRenderContext) {
  if (!isEvent(event)) return null

  return (
    <EventAccommodationLogistics
      accommodation={trip?.accommodation ?? event.accommodation}
      variant={block.variant === 'cards' ? 'cards' : undefined}
      logisticsOverrides={trip?.logisticsOverrides}
      heading={typeof block.heading === 'string' ? block.heading : undefined}
      transport={trip?.transport ?? event.transport}
    />
  )
}

function isEvent(event: BlockRenderContext['event']): event is Event {
  return typeof event === 'object' && event !== null
}
