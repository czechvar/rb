import type { Event } from '@/payload-types'
import { DetailHero } from '@/components/sections/DetailHero'
import type { BlockRenderContext } from './RenderBlocks'

export function TripHeroBlock({ event }: BlockRenderContext) {
  if (!isEvent(event)) return null
  return <DetailHero event={event} />
}

function isEvent(event: BlockRenderContext['event']): event is Event {
  return typeof event === 'object' && event !== null
}
