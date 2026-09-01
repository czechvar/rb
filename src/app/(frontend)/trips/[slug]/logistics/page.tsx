import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedEventBySlug } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { LocationBlock } from '@/components/sections/LocationBlock'
import { EventAccommodationLogistics } from '@/components/sections/EventAccommodationLogistics'
import { JsonLd } from '@/components/JsonLd'
import { tripLogisticsGraphJsonLd } from '@/lib/jsonld'

type Props = { params: Promise<{ slug: string }> }

export default async function TripLogisticsPage({ params }: Props) {
  const { slug } = await params

  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()
  const jsonLd = tripLogisticsGraphJsonLd(event)

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/calendar', label: 'Calendar' },
        { href: `/trips/${slug}`, label: event.title },
        { label: 'Logistics' },
      ]}
    >
      <JsonLd data={jsonLd} />
      <main>
        <LocationBlock content={event.content} />
        <EventAccommodationLogistics
          accommodation={event.accommodation}
          transport={event.transport}
        />
        <p style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--rb-dark)', color: 'var(--rb-white-60)' }}>
          <Link href={`/trips/${slug}`} style={{ color: 'var(--rb-white-80)', textDecoration: 'none' }}>← Back to {event.title}</Link>
        </p>
      </main>
    </MarketingShell>
  )
}
