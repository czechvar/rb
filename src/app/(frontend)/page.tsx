import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import {
  datesByEvent,
  getHomepageBlockData,
} from '@/components/blocks/HomepageContextBlocks'
import { getPublishedPageBySlug } from '@/lib/queries'
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

export default async function HomePage() {
  const [homePage, homepage] = await Promise.all([
    getPublishedPageBySlug('home'),
    getHomepageBlockData(),
  ])

  return (
    <>
      <Header />
      {homePage?.layout?.length ? (
        <RenderBlocks blocks={homePage.layout} context={{ page: homePage, homepage }} />
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
      <Footer />
    </>
  )
}
