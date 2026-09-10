import Link from 'next/link'
import { resolveTripDetail } from '@/lib/trip-detail'
import { defaultTripLayout } from '@/lib/trip-layout'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { getPublishedEventBySlug, getTripDetailEventDates } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { DetailHero } from '@/components/sections/DetailHero'
import { SectionIntro } from '@/components/sections/SectionIntro'
import { TripPitchBlock } from '@/components/sections/TripPitchBlock'
import { HighlightsGrid } from '@/components/sections/HighlightsGrid'
import { AudienceCards } from '@/components/sections/AudienceCards'
import { Prerequisites } from '@/components/sections/Prerequisites'
import { EssentialEquipment } from '@/components/sections/EssentialEquipment'
import { WhatYouLearn } from '@/components/sections/WhatYouLearn'
import { EventDatesList } from '@/components/sections/EventDatesList'
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
import { JsonLd } from '@/components/JsonLd'
import { eventDetailGraphJsonLd } from '@/lib/jsonld'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string }> }

export default async function TripPage({ params, searchParams }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()

  const query = await searchParams
  const selectedId = query.date && /^\d+$/.test(query.date) ? Number(query.date) : undefined
  const dates = await getTripDetailEventDates(event.id)
  const trip = resolveTripDetail(event, dates, selectedId)
  const jsonLd = eventDetailGraphJsonLd(event)

  if (event.layout?.length) {
    return (
      <MarketingShell>
        <JsonLd data={jsonLd} />
        <main>
          <RenderBlocks blocks={event.layout} context={{ event, trip }} />
        </main>
      </MarketingShell>
    )
  }

  if (trip.sections.length) {
    return (
      <MarketingShell>
        <JsonLd data={jsonLd} />
        <main style={{ background: 'var(--theme-color-ink)', color: 'var(--theme-color-text)' }}>
          <RenderBlocks blocks={defaultTripLayout(trip)} context={{ event, trip }} />
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

  // Keep the legacy composition on the same selected occurrence as its hero.
  const location = trip.locations[0] ?? null
  const locationIntro =
    location?.destinationDetail?.sections?.find((section) => section.key === 'intro')?.body ?? null

  return (
    <MarketingShell>
      <JsonLd data={jsonLd} />
      <main>
        <DetailHero event={event} trip={trip} />
        <SectionIntro id="overview" title={event.title} lead={event.shortDescription ?? undefined} />
        <TripPitchBlock event={{ ...event, locations: trip.locations }} />
        <EventDatesList items={trip.dates} selectedId={trip.selectedDate?.id} eventSlug={event.slug} />
        <HighlightsGrid items={event.highlights} heading="Trip Highlights" />
        <AudienceCards cards={event.audienceCards} />
        <WhatYouLearn data={event.whatYouLearn} />
        <Prerequisites items={event.prerequisites} />
        <BookingCTA event={event} trip={trip} heading="Ready to commit?" />
        <DayByDayItinerary data={event.itinerary} />
        {/* LocationBlock — destination showcase (wireframe block 6) */}
        {location && locationIntro && (
          <LocationBlock
            heading={location.name}
            body={locationIntro}
            eyebrow="The Destination"
            image={location.mainPicture}
          />
        )}
        <CoachesMinimal
          coaches={trip.guides}
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
          accommodation={trip.accommodation}
          transport={trip.transport}
          logisticsOverrides={trip.logisticsOverrides}
        />
        {/* EssentialEquipment intentionally zero top-pad — must follow EventAccommodationLogistics */}
        <EssentialEquipment
          items={event.essentialEquipment}
          intro={event.equipmentIntro}
        />
        <PhotoGallery items={event.gallery} />
        <InlineFAQ faqs={faqsResult.docs} slug={slug} />
        <BookingCTA event={event} trip={trip} />
        <div style={{ textAlign: 'center', padding: '2rem 2rem 4rem', background: 'var(--rb-dark)' }}>
          <Link href={`/trips/${slug}/logistics`} style={{ color: 'var(--rb-white-80)', textDecoration: 'none' }}>Travel &amp; logistics →</Link>
        </div>
      </main>
    </MarketingShell>
  )
}
