import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import {
  getActiveEventDates,
  getFeaturedEventsForHomepage,
  getFounderGuide,
  getHomepageFAQs,
  getHomepageHeroMedia,
  getHomepagePartners,
  getHomepageReviews,
  getProClimberGuides,
  getPublishedPageBySlug,
} from '@/lib/queries'
import type { Event, EventDate, Faq, Guide, Media, Partner, Review } from '@/payload-types'
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
import { JsonLd } from '@/components/JsonLd'
import { homepageGraphJsonLd } from '@/lib/jsonld'

type HomepageData = {
  heroMedia: Media | null
  events: Event[]
  allDates: EventDate[]
  reviews: Review[]
  faqs: Faq[]
  partners: Partner[]
  proClimbers: Guide[]
  founder: Guide | null
}

export default async function HomePage() {
  const [homePage, homepage] = await Promise.all([
    getPublishedPageBySlug('home'),
    getHomepageData(),
  ])
  const usesCmsLayout = Boolean(homePage?.layout?.length)
  const jsonLd = await homepageGraphJsonLd({
    page: homePage,
    heroMedia: usesCmsLayout ? undefined : homepage.heroMedia,
    featuredEvents: usesCmsLayout ? [] : homepage.events,
  })

  return (
    <>
      <Header />
      <JsonLd data={jsonLd} />
      <main>
        {usesCmsLayout ? (
          <RenderBlocks blocks={homePage?.layout} context={{ page: homePage }} />
        ) : (
          <>
            <Hero backgroundMedia={homepage.heroMedia} />
            <StatsBar />
            <WhoWeAre />
            <FeaturedTrips events={homepage.events} datesByEvent={datesByEvent(homepage)} />
            <WhyRockbusters />
            <ProClimbers guides={homepage.proClimbers} />
            <PickYourExperience />
            <Destinations />
            <Testimonials reviews={homepage.reviews} />
            <Team founder={homepage.founder} />
            <HomepageFAQ faqs={homepage.faqs} />
            <Partners partners={homepage.partners} />
            <FinalCTA />
          </>
        )}
      </main>
      <Footer />
    </>
  )
}

async function getHomepageData(): Promise<HomepageData> {
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

  return { heroMedia, events, allDates, reviews, faqs, partners, proClimbers, founder }
}

function datesByEvent(homepage: Pick<HomepageData, 'events' | 'allDates'>) {
  const featuredEventIds = new Set(homepage.events.map((event) => event.id))
  const map = new Map<number, EventDate[]>()

  for (const date of homepage.allDates) {
    const eventId = typeof date.event === 'object' ? date.event.id : date.event
    if (!featuredEventIds.has(eventId)) continue
    const dates = map.get(eventId) ?? []
    dates.push(date)
    map.set(eventId, dates)
  }

  return map
}
