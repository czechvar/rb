import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { LocationBlock } from '@/components/sections/LocationBlock'
import { EventAccommodationLogistics } from '@/components/sections/EventAccommodationLogistics'

type Props = { params: Promise<{ slug: string }> }

export default async function TripLogisticsPage({ params }: Props) {
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

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/calendar', label: 'Calendar' },
        { href: `/trips/${slug}`, label: event.title },
        { label: 'Logistics' },
      ]}
    >
      <main>
        <LocationBlock content={event.content} />
        <EventAccommodationLogistics
          accommodation={event.accommodation}
          transport={event.transport}
        />
        <p style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Link href={`/trips/${slug}`}>← Back to {event.title}</Link>
        </p>
      </main>
    </MarketingShell>
  )
}
