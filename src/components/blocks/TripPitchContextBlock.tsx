import type { Event } from '@/payload-types'
import { SectionIntro } from '@/components/sections/SectionIntro'
import { TripPitchBlock as TripPitchSection } from '@/components/sections/TripPitchBlock'
import type { BlockRenderContext } from './RenderBlocks'

export function TripPitchContextBlock({ event }: BlockRenderContext) {
  if (!isEvent(event)) return null

  return (
    <>
      <SectionIntro id="overview" title={event.title} lead={event.shortDescription ?? undefined} />
      <TripPitchSection event={event} />
    </>
  )
}

function isEvent(event: BlockRenderContext['event']): event is Event {
  return typeof event === 'object' && event !== null
}
