import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { getPublishedEventBySlug } from '@/lib/queries'
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
import { LocationBlock } from '@/components/sections/LocationBlock'
import { PartnerBlock } from '@/components/sections/PartnerBlock'
import { CoachesMinimal } from '@/components/sections/CoachesMinimal'
import { DemoLessonBlock } from '@/components/sections/DemoLessonBlock'
import { ReviewsRow } from '@/components/sections/ReviewsRow'
import { PhotoGallery } from '@/components/sections/PhotoGallery'
import { EventAccommodationLogistics } from '@/components/sections/EventAccommodationLogistics'
import { InlineFAQ } from '@/components/sections/InlineFAQ'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'

type Props = { params: Promise<{ slug: string }> }

export default async function TripPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()

  if (event.layout?.length) {
    return (
      <MarketingShell transparentHeader>
        <main>
          <RenderBlocks blocks={event.layout} context={{ event }} />
        </main>
      </MarketingShell>
    )
  }

  const [reviewsResult, faqsResult] = await Promise.all([
    payload.find({
      collection: 'reviews',
      where: { and: [{ event: { equals: event.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
    payload.find({
      collection: 'faqs',
      where: { and: [{ event: { equals: event.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 100,
    }),
  ])

  // Resolve the first embedded Location object for the destination showcase
  const firstLocation =
    event.locations?.find((l) => typeof l === 'object') ?? null
  const location = typeof firstLocation === 'object' && firstLocation !== null
    ? firstLocation
    : null

  return (
    <MarketingShell transparentHeader>
      <main>
        <DetailHero event={event} />
        <SectionIntro id="overview" title={event.title} lead={event.shortDescription ?? undefined} />
        <TripPitchBlock event={event} />
        <HighlightsGrid items={event.highlights} heading="Trip Highlights" />
        <AudienceCards cards={event.audienceCards} />
        <WhatYouLearn data={event.whatYouLearn} />
        <Prerequisites items={event.prerequisites} />
        <BookingCTA event={event} heading="Ready to commit?" />
        <DayByDayItinerary data={event.itinerary} />
        {/* LocationBlock — destination showcase (wireframe block 6) */}
        {location?.content && (
          <LocationBlock
            heading={location.name}
            content={location.content}
            eyebrow="The Destination"
            image={location.mainPicture}
          />
        )}
        <CoachesMinimal
          coaches={event.coaches}
          framing={event.coachFramingParagraph}
          teamBullets={event.coachTeamBullets}
        />
        <PartnerBlock
          partner={event.partner}
          eyebrow={event.partnerEyebrow}
          headline={event.partnerHeadline}
          description={event.partnerDescription}
          benefits={event.partnerBenefits}
        />
        <DemoLessonBlock event={event} />
        <ReviewsRow items={reviewsResult.docs} />
        <EventAccommodationLogistics
          accommodation={event.accommodation}
          transport={event.transport}
        />
        {/* EssentialEquipment intentionally zero top-pad — must follow EventAccommodationLogistics */}
        <EssentialEquipment
          items={event.essentialEquipment}
          intro={event.equipmentIntro}
        />
        <PhotoGallery items={event.gallery} />
        <InlineFAQ faqs={faqsResult.docs} slug={slug} />
        <BookingCTA event={event} />
        <div style={{ textAlign: 'center', padding: '2rem 2rem 4rem', background: 'var(--rb-dark)' }}>
          <Link href={`/trips/${slug}/logistics`} style={{ color: 'var(--rb-white-80)', textDecoration: 'none' }}>Travel &amp; logistics →</Link>
        </div>
      </main>
    </MarketingShell>
  )
}
