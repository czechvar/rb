import type { Event } from '@/payload-types'
import { DetailHero } from '@/components/sections/DetailHero'
import type { BlockRenderContext } from './RenderBlocks'

export function TripHeroBlock({ event, trip, variant }: BlockRenderContext & { variant?: 'default' | 'editorial' }) {
  if (!isEvent(event)) return null
  return <DetailHero event={event} trip={trip ?? undefined} variant={variant} />
}

function isEvent(event: BlockRenderContext['event']): event is Event {
  return typeof event === 'object' && event !== null
}
