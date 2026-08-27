import type { Program } from '@/payload-types'
import { getPublishedEventsForProgram } from '@/lib/queries'
import { Hero } from '@/components/sections/Hero'
import { HighlightsGrid } from '@/components/sections/HighlightsGrid'
import { AudienceCards } from '@/components/sections/AudienceCards'
import { CurriculumPillars } from '@/components/sections/CurriculumPillars'
import { ProgramFlow } from '@/components/sections/ProgramFlow'
import { WeekVariants } from '@/components/sections/WeekVariants'
import { LocationBlock } from '@/components/sections/LocationBlock'
import { AccommodationLogistics } from '@/components/sections/AccommodationLogistics'
import { CoachesRich } from '@/components/sections/CoachesRich'
import { ResultsOutcomes } from '@/components/sections/ResultsOutcomes'
import { LinkedEvents } from '@/components/sections/LinkedEvents'
import { FinalCTA } from '@/components/sections/FinalCTA'
import type { BlockRenderContext } from './RenderBlocks'

type ProgramBlock = Record<string, unknown>

export function ProgramHeroBlock(_block: ProgramBlock, { program }: BlockRenderContext) {
  if (!isProgram(program)) return null
  return <Hero program={program} />
}

export function ProgramHighlightsBlock(block: ProgramBlock, { program }: BlockRenderContext) {
  if (!isProgram(program)) return null
  return (
    <HighlightsGrid
      items={program.highlights}
      heading={typeof block.heading === 'string' ? block.heading : 'Program Highlights'}
    />
  )
}

export function ProgramAudienceBlock(_block: ProgramBlock, { program }: BlockRenderContext) {
  if (!isProgram(program)) return null
  return (
    <AudienceCards
      cards={program.audienceCards}
      soloNote={program.soloNote}
      redirectCallout={program.redirectCallout}
    />
  )
}

export function ProgramCurriculumBlock(_block: ProgramBlock, { program }: BlockRenderContext) {
  if (!isProgram(program)) return null
  return <CurriculumPillars pillars={program.curriculumPillars} />
}

export function ProgramFlowBlock(_block: ProgramBlock, { program }: BlockRenderContext) {
  if (!isProgram(program)) return null
  return <ProgramFlow flow={program.flow} />
}

export function ProgramWeeksBlock(_block: ProgramBlock, { program }: BlockRenderContext) {
  if (!isProgram(program)) return null
  return (
    <WeekVariants
      variants={program.weekVariants}
      recommendation={program.weekRecommendation}
    />
  )
}

export function ProgramLogisticsBlock(_block: ProgramBlock, { program }: BlockRenderContext) {
  if (!isProgram(program)) return null
  return (
    <>
      <LocationBlock content={program.content} />
      <AccommodationLogistics accommodation={program.accommodation} transport={program.transport} />
    </>
  )
}

export function ProgramCoachesBlock(_block: ProgramBlock, { program }: BlockRenderContext) {
  if (!isProgram(program)) return null
  return <CoachesRich coaches={program.coaches} framing={program.coachFramingParagraph} />
}

export function ProgramResultsBlock(_block: ProgramBlock, { program }: BlockRenderContext) {
  if (!isProgram(program)) return null
  return <ResultsOutcomes items={program.results} />
}

export async function ProgramTripsBlock(_block: ProgramBlock, { program }: BlockRenderContext) {
  if (!isProgram(program)) return null

  const events = await getPublishedEventsForProgram(program.id)
  return <LinkedEvents events={events} />
}

export function ProgramCTABlock(_block: ProgramBlock, { program }: BlockRenderContext) {
  if (!isProgram(program)) return null
  return <FinalCTA program={program} />
}

function isProgram(program: BlockRenderContext['program']): program is Program {
  return typeof program === 'object' && program !== null
}
