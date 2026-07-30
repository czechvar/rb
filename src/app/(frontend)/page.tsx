import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { Hero } from '@/components/marketing/homepage/Hero'
import { StatsBar } from '@/components/marketing/homepage/StatsBar'
import { WhoWeAre } from '@/components/marketing/homepage/WhoWeAre'
import { FeaturedTrips } from '@/components/marketing/homepage/FeaturedTrips'
import { WhyRockbusters } from '@/components/marketing/homepage/WhyRockbusters'
import { ProClimbers } from '@/components/marketing/homepage/ProClimbers'
import { PickYourExperience } from '@/components/marketing/homepage/PickYourExperience'
import { Destinations } from '@/components/marketing/homepage/Destinations'
import { Testimonials } from '@/components/marketing/homepage/Testimonials'
import { Team } from '@/components/marketing/homepage/Team'
import { HomepageFAQ } from '@/components/marketing/homepage/HomepageFAQ'
import { Partners } from '@/components/marketing/homepage/Partners'
import { FinalCTA } from '@/components/marketing/homepage/FinalCTA'
import {
  getFeaturedEventsForHomepage,
  getActiveEventDates,
  getHomepageReviews,
  getHomepageFAQs,
  getHomepagePartners,
  getProClimberGuides,
  getFounderGuide,
  getHomepageHeroMedia,
} from '@/lib/queries'
import type { EventDate } from '@/payload-types'

export default async function HomePage() {
  const [heroMedia, events, allDates, reviews, faqs, partners, proClimbers, founder] =
    await Promise.all([
      getHomepageHeroMedia(),
      getFeaturedEventsForHomepage(),
      getActiveEventDates(),
      getHomepageReviews(),
      getHomepageFAQs(),
      getHomepagePartners(),
      getProClimberGuides(),
      getFounderGuide(),
    ])

  const featuredEventIds = new Set(events.map((e) => e.id))
  const datesByEvent = new Map<number, EventDate[]>()
  for (const d of allDates) {
    const eventId = typeof d.event === 'object' ? d.event.id : d.event
    if (!featuredEventIds.has(eventId)) continue
    const arr = datesByEvent.get(eventId) ?? []
    arr.push(d)
    datesByEvent.set(eventId, arr)
  }

  return (
    <>
      <Header />
      <Hero backgroundMedia={heroMedia} />
      <StatsBar />
      <WhoWeAre />
      <FeaturedTrips events={events} datesByEvent={datesByEvent} />
      <WhyRockbusters />
      <ProClimbers guides={proClimbers} />
      <PickYourExperience />
      <Destinations />
      <Testimonials reviews={reviews} />
      <Team founder={founder} />
      <HomepageFAQ faqs={faqs} />
      <Partners partners={partners} />
      <FinalCTA />
      <Footer />
    </>
  )
}
