import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedEventBySlug, getActiveEventDatesForEvent } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { EventDatesList } from '@/components/sections/EventDatesList'
import { JsonLd } from '@/components/JsonLd'
import { eventDatesGraphJsonLd } from '@/lib/jsonld'

type Props = { params: Promise<{ slug: string }> }

export default async function TripDatesPage({ params }: Props) {
  const { slug } = await params

  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()

  const dates = await getActiveEventDatesForEvent(event.id)
  const jsonLd = eventDatesGraphJsonLd(event, dates)

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/calendar', label: 'Calendar' },
        { href: `/trips/${slug}`, label: event.title },
        { label: 'Dates' },
      ]}
    >
      <JsonLd data={jsonLd} />
      <main>
        <EventDatesList items={dates} />
        <p style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--rb-dark)', color: 'var(--rb-white-60)' }}>
          <Link href={`/trips/${slug}`} style={{ color: 'var(--rb-white-80)', textDecoration: 'none' }}>← Back to {event.title}</Link>
        </p>
      </main>
    </MarketingShell>
  )
}
