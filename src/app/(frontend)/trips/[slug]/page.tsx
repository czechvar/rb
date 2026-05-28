import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { DetailHero } from '@/components/sections/DetailHero'
import { SectionIntro } from '@/components/sections/SectionIntro'
import { TripPitchBlock } from '@/components/sections/TripPitchBlock'
import { HighlightsGrid } from '@/components/sections/HighlightsGrid'
import { AudienceCards } from '@/components/sections/AudienceCards'
import { Prerequisites } from '@/components/sections/Prerequisites'
import { EssentialEquipment } from '@/components/sections/EssentialEquipment'
import { WhatYouLearn } from '@/components/sections/WhatYouLearn'
import { BookingCTA } from '@/components/sections/BookingCTA'
import { DayByDayItinerary } from '@/components/sections/DayByDayItinerary'
import { PartnerBlock } from '@/components/sections/PartnerBlock'
import { CoachesMinimal } from '@/components/sections/CoachesMinimal'
import { DemoLessonBlock } from '@/components/sections/DemoLessonBlock'
import { ReviewsRow } from '@/components/sections/ReviewsRow'
import { PhotoGallery } from '@/components/sections/PhotoGallery'
import { HowToBook } from '@/components/sections/HowToBook'
import { WhyRockbusters } from '@/components/sections/WhyRockbusters'

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

  const [reviewsResult, datesResult] = await Promise.all([
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
      limit: 1,
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
        <SectionIntro title={event.title} lead={event.shortDescription ?? undefined} />
        <TripPitchBlock event={event} />
        <HighlightsGrid items={event.highlights} heading="Trip Highlights" />
        <AudienceCards cards={event.audienceCards} />
        <Prerequisites items={event.prerequisites} />
        <EssentialEquipment
          items={event.essentialEquipment}
          intro={event.equipmentIntro}
        />
        <BookingCTA event={event} heading="Ready to commit?" />
        <WhatYouLearn data={event.whatYouLearn} />
        <BookingCTA event={event} />
        <DayByDayItinerary data={event.itinerary} />
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
        <DemoLessonBlock event={event} />
        <ReviewsRow items={reviewsResult.docs} />
        <PhotoGallery items={event.gallery} />
        <HowToBook />
        <WhyRockbusters />
        <div style={{ textAlign: 'center', padding: '4rem 2rem 0' }}>
          <Link href={`/trips/${slug}/faq`}>Read the FAQ for this trip →</Link>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Link href={`/trips/${slug}/logistics`}>Travel & logistics →</Link>
        </div>
      </main>
    </MarketingShell>
  )
}
