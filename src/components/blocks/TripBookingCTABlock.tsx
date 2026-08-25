import type { Event } from '@/payload-types'
import { BookingCTA } from '@/components/sections/BookingCTA'
import type { BlockRenderContext } from './RenderBlocks'

type TripBookingCTABlockProps = Record<string, unknown>

export function TripBookingCTABlock(
  block: TripBookingCTABlockProps,
  { event }: BlockRenderContext,
) {
  if (!isEvent(event)) return null

  return (
    <BookingCTA
      event={event}
      eyebrow={typeof block.eyebrow === 'string' ? block.eyebrow : undefined}
      heading={typeof block.heading === 'string' ? block.heading : undefined}
      body={typeof block.body === 'string' ? block.body : undefined}
    />
  )
}

function isEvent(event: BlockRenderContext['event']): event is Event {
  return typeof event === 'object' && event !== null
}
