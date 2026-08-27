import type { Event } from '@/payload-types'
import { HighlightsGrid } from '@/components/sections/HighlightsGrid'
import type { BlockRenderContext } from './RenderBlocks'

type TripHighlightsBlockProps = Record<string, unknown>

export function TripHighlightsBlock(
  block: TripHighlightsBlockProps,
  { event }: BlockRenderContext,
) {
  if (!isEvent(event)) return null
  return (
    <HighlightsGrid
      items={event.highlights}
      heading={typeof block.heading === 'string' ? block.heading : 'Trip Highlights'}
    />
  )
}

function isEvent(event: BlockRenderContext['event']): event is Event {
  return typeof event === 'object' && event !== null
}
