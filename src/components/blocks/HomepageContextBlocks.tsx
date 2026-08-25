import type { Event, EventDate, Faq, Guide, Media, Partner, Review } from '@/payload-types'
import {
  getActiveEventDates,
  getFeaturedEventsForHomepage,
  getFounderGuide,
  getHomepageFAQs,
  getHomepageHeroMedia,
  getHomepagePartners,
  getHomepageReviews,
  getProClimberGuides,
} from '@/lib/queries'
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
import type { BlockRenderContext } from './RenderBlocks'

type HomepageContextBlock = Record<string, unknown>

export type HomepageBlockData = {
  heroMedia: Media | null
  events: Event[]
  allDates: EventDate[]
  reviews: Review[]
  faqs: Faq[]
  partners: Partner[]
  proClimbers: Guide[]
  founder: Guide | null
}

export async function getHomepageBlockData(): Promise<HomepageBlockData> {
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

export function HomeHeroBlock(_block: HomepageContextBlock, { homepage }: BlockRenderContext) {
  return <Hero backgroundMedia={homepage?.heroMedia ?? null} />
}

export function HomeStatsBlock(_block: HomepageContextBlock, _context: BlockRenderContext) {
  return <StatsBar />
}

export function HomeWhoWeAreBlock(_block: HomepageContextBlock, _context: BlockRenderContext) {
  return <WhoWeAre />
}

export function HomeFeaturedTripsBlock(
  _block: HomepageContextBlock,
  { homepage }: BlockRenderContext,
) {
  if (!homepage) return null
  return <FeaturedTrips events={homepage.events} datesByEvent={datesByEvent(homepage)} />
}

export function HomeWhyRockbustersBlock(
  _block: HomepageContextBlock,
  _context: BlockRenderContext,
) {
  return <WhyRockbusters />
}

export function HomeProClimbersBlock(_block: HomepageContextBlock, { homepage }: BlockRenderContext) {
  if (!homepage) return null
  return <ProClimbers guides={homepage.proClimbers} />
}

export function HomePickYourExperienceBlock(
  _block: HomepageContextBlock,
  _context: BlockRenderContext,
) {
  return <PickYourExperience />
}

export function HomeDestinationsBlock(_block: HomepageContextBlock, _context: BlockRenderContext) {
  return <Destinations />
}

export function HomeTestimonialsBlock(_block: HomepageContextBlock, { homepage }: BlockRenderContext) {
  if (!homepage) return null
  return <Testimonials reviews={homepage.reviews} />
}

export function HomeTeamBlock(_block: HomepageContextBlock, { homepage }: BlockRenderContext) {
  if (!homepage) return null
  return <Team founder={homepage.founder} />
}

export function HomeFAQBlock(_block: HomepageContextBlock, { homepage }: BlockRenderContext) {
  if (!homepage) return null
  return <HomepageFAQ faqs={homepage.faqs} />
}

export function HomePartnersBlock(_block: HomepageContextBlock, { homepage }: BlockRenderContext) {
  if (!homepage) return null
  return <Partners partners={homepage.partners} />
}

export function HomeFinalCTABlock(_block: HomepageContextBlock, _context: BlockRenderContext) {
  return <FinalCTA />
}

export function datesByEvent(homepage: Pick<HomepageBlockData, 'events' | 'allDates'>) {
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
