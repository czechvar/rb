import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { getPublishedEventsForType } from '@/lib/queries'
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

type Props = { params: Promise<{ slug: string }> }

export default async function ProgramPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs: typeDocs } = await payload.find({
    collection: 'types',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const type = typeDocs[0]
  if (!type) notFound()

  const [events, faqsResult, reviewsResult] = await Promise.all([
    getPublishedEventsForType(type.id),
    payload.find({
      collection: 'faqs',
      where: { and: [{ type: { equals: type.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
    payload.find({
      collection: 'reviews',
      where: { and: [{ type: { equals: type.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
  ])

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/programs', label: 'Programs' },
        { label: type.name },
      ]}
    >
      <main>
        <Hero type={type} />
        <HighlightsGrid items={type.highlights} heading="Program Highlights" />
        <AudienceCards
          cards={type.audienceCards}
          soloNote={type.soloNote}
          redirectCallout={type.redirectCallout}
        />
        <CurriculumPillars pillars={type.curriculumPillars} />
        <ProgramFlow flow={type.programFlow} />
        <WeekVariants variants={type.weekVariants} recommendation={type.weekRecommendation} />
        <LocationBlock content={type.content} />
        <AccommodationLogistics accommodation={type.accommodation} transport={type.transport} />
        <CoachesRich coaches={type.coaches} framing={type.coachFramingParagraph} />
        <ResultsOutcomes items={type.results} />
        <FAQList items={faqsResult.docs} />
        <ReviewsRow items={reviewsResult.docs} />
        <LinkedEvents events={events} />
        <HowToBook />
        <WhyRockbusters />
        <FinalCTA type={type} />
      </main>
    </MarketingShell>
  )
}
