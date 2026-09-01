import { getActiveGuides, getActiveEventDates, getHomepageReviews } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { JsonLd } from '@/components/JsonLd'
import { collectionPageGraphJsonLd, guideListItems } from '@/lib/jsonld'
import { TeamHero } from '@/components/marketing/team/TeamHero'
import { BornOnTheRock } from '@/components/marketing/team/BornOnTheRock'
import { ValuePillars } from '@/components/marketing/team/ValuePillars'
import { GuidesGrid } from '@/components/marketing/team/GuidesGrid'
import { StatsStrip } from '@/components/marketing/team/StatsStrip'
import { UpcomingTrips } from '@/components/marketing/team/UpcomingTrips'
import { FindYourTrip } from '@/components/marketing/team/FindYourTrip'
import { TeamFinalCTA } from '@/components/marketing/team/TeamFinalCTA'
import { Testimonials } from '@/components/marketing/homepage/Testimonials'
import type { Guide } from '@/payload-types'

export const metadata = {
  title: 'Guides & Coaches — Rockbusters',
  description: 'Elite climbers and UIAGM guides leading every Rockbusters trip.',
}

function byFeaturedThenName(a: Guide, b: Guide) {
  return (
    Number(b.featured ?? false) - Number(a.featured ?? false) || a.name.localeCompare(b.name)
  )
}

export default async function TeamPage() {
  const [docs, dates, reviews] = await Promise.all([
    getActiveGuides(),
    getActiveEventDates(),
    getHomepageReviews(),
  ])
  const team = docs.filter((g) => g.section !== 'friends').sort(byFeaturedThenName)
  const friends = docs.filter((g) => g.section === 'friends').sort(byFeaturedThenName)
  const visibleGuides = [...team, ...friends]
  const jsonLd = collectionPageGraphJsonLd({
    path: '/team',
    name: 'Guides & Coaches',
    description: 'Elite climbers and UIAGM guides leading every Rockbusters trip.',
    items: guideListItems(visibleGuides),
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Team', path: '/team' },
    ],
  })

  return (
    <MarketingShell transparentHeader>
      <JsonLd data={jsonLd} />
      <main>
        <TeamHero />
        <BornOnTheRock />
        <ValuePillars />
        <GuidesGrid guides={team} label="The Team" heading="GUIDES & COACHES" />
        <StatsStrip />
        <UpcomingTrips dates={dates} />
        <FindYourTrip />
        {friends.length ? (
          <GuidesGrid guides={friends} heading="Friends & Ambassadors" compact />
        ) : null}
        <Testimonials reviews={reviews} />
        <TeamFinalCTA />
      </main>
    </MarketingShell>
  )
}
