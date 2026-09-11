import { tripCopy } from './trip-copy'
import type { Event } from '@/payload-types'
import { BookingCTA } from '@/components/sections/BookingCTA'
import type { BlockRenderContext } from './RenderBlocks'

type TripBookingCTABlockProps = Record<string, unknown>

export function TripBookingCTABlock(
  block: TripBookingCTABlockProps,
  { event, trip }: BlockRenderContext,
) {
  if (!isEvent(event)) return null

  const copy = tripCopy(trip, 'booking', block)
  if (copy.hide) return null
  return (
    <BookingCTA
      event={event}
      trip={trip ?? undefined}
      variant={block.variant === 'image' ? 'image' : 'default'}
      eyebrow={copy.eyebrow}
      heading={copy.heading}
      body={copy.intro}
    />
  )
}

function isEvent(event: BlockRenderContext['event']): event is Event {
  return typeof event === 'object' && event !== null
}
