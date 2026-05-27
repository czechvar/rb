import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { DetailHero } from '@/components/sections/DetailHero'
import { EventDatesList } from '@/components/sections/EventDatesList'
import { HighlightsGrid } from '@/components/sections/HighlightsGrid'
import { AudienceCards } from '@/components/sections/AudienceCards'
import { Prerequisites } from '@/components/sections/Prerequisites'
import { EssentialEquipment } from '@/components/sections/EssentialEquipment'
import { WhatYouLearn } from '@/components/sections/WhatYouLearn'
import { DayByDayItinerary } from '@/components/sections/DayByDayItinerary'
import { LocationBlock } from '@/components/sections/LocationBlock'
import { EventAccommodationLogistics } from '@/components/sections/EventAccommodationLogistics'
import { PartnerBlock } from '@/components/sections/PartnerBlock'
import { CoachesMinimal } from '@/components/sections/CoachesMinimal'
import { ReviewsRow } from '@/components/sections/ReviewsRow'
import { FAQList } from '@/components/sections/FAQList'
import { HowToBook } from '@/components/sections/HowToBook'
import { WhyRockbusters } from '@/components/sections/WhyRockbusters'
import { EventFinalCTA } from '@/components/sections/EventFinalCTA'

type Props = { params: Promise<{ slug: string }> }

export default async function TripPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs: eventDocs } = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const event = eventDocs[0]
  if (!event) notFound()

  const [faqsResult, reviewsResult, datesResult] = await Promise.all([
    payload.find({
      collection: 'faqs',
      where: { and: [{ event: { equals: event.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
    payload.find({
      collection: 'reviews',
      where: { and: [{ event: { equals: event.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
    payload.find({
      collection: 'event-dates',
      where: { and: [{ event: { equals: event.id } }, { active: { equals: true } }] },
      sort: 'dateFrom',
      limit: 50,
    }),
  ])

  const firstDate = datesResult.docs[0]

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/calendar', label: 'Calendar' },
        { label: event.title },
      ]}
    >
      <main>
        <DetailHero event={event} firstDate={firstDate} />
        <HighlightsGrid items={event.highlights} heading="Trip Highlights" />
        <EventDatesList items={datesResult.docs} />
        <AudienceCards cards={event.audienceCards} />
        <Prerequisites items={event.prerequisites} />
        <EssentialEquipment
          items={event.essentialEquipment}
          intro={event.equipmentIntro}
        />
        <WhatYouLearn data={event.whatYouLearn} />
        <DayByDayItinerary data={event.itinerary} />
        <LocationBlock content={event.content} />
        <EventAccommodationLogistics
          accommodation={event.accommodation}
          transport={event.transport}
        />
        <PartnerBlock
          partner={event.partner}
          eyebrow={event.partnerEyebrow}
          headline={event.partnerHeadline}
          description={event.partnerDescription}
          benefits={event.partnerBenefits}
        />
        <CoachesMinimal
          coaches={event.coaches}
          framing={event.coachFramingParagraph}
          teamBullets={event.coachTeamBullets}
        />
        <ReviewsRow items={reviewsResult.docs} />
        <FAQList items={faqsResult.docs} heading="FAQ for This Trip" />
        <HowToBook />
        <WhyRockbusters />
        <EventFinalCTA event={event} firstDate={firstDate} />
      </main>
    </MarketingShell>
  )
}
