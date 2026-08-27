import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { getPublishedEventsForProgram } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
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
import { FAQList } from '@/components/sections/FAQList'
import { ReviewsRow } from '@/components/sections/ReviewsRow'
import { LinkedEvents } from '@/components/sections/LinkedEvents'
import { HowToBook } from '@/components/sections/HowToBook'
import { WhyRockbusters } from '@/components/sections/WhyRockbusters'
import { FinalCTA } from '@/components/sections/FinalCTA'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'

type Props = { params: Promise<{ slug: string }> }

export default async function ProgramPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs: programDocs } = await payload.find({
    collection: 'programs',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const program = programDocs[0]
  if (!program) notFound()

  if (program.layout?.length) {
    return (
      <MarketingShell
        crumbs={[
          { href: '/', label: 'Home' },
          { href: '/programs', label: 'Programs' },
          { label: program.name },
        ]}
      >
        <main>
          <RenderBlocks blocks={program.layout} context={{ program }} />
        </main>
      </MarketingShell>
    )
  }

  const [events, faqsResult, reviewsResult] = await Promise.all([
    getPublishedEventsForProgram(program.id),
    payload.find({
      collection: 'faqs',
      where: { and: [{ program: { equals: program.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
    payload.find({
      collection: 'reviews',
      where: { and: [{ program: { equals: program.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
  ])

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/programs', label: 'Programs' },
        { label: program.name },
      ]}
    >
      <main>
        <Hero program={program} />
        <HighlightsGrid items={program.highlights} heading="Program Highlights" />
        <AudienceCards
          cards={program.audienceCards}
          soloNote={program.soloNote}
          redirectCallout={program.redirectCallout}
        />
        <CurriculumPillars pillars={program.curriculumPillars} />
        <ProgramFlow flow={program.flow} />
        <WeekVariants variants={program.weekVariants} recommendation={program.weekRecommendation} />
        <LocationBlock content={program.content} />
        <AccommodationLogistics accommodation={program.accommodation} transport={program.transport} />
        <CoachesRich coaches={program.coaches} framing={program.coachFramingParagraph} />
        <ResultsOutcomes items={program.results} />
        <FAQList items={faqsResult.docs} />
        <ReviewsRow items={reviewsResult.docs} />
        <LinkedEvents events={events} />
        <HowToBook />
        <WhyRockbusters />
        <FinalCTA program={program} />
      </main>
    </MarketingShell>
  )
}
