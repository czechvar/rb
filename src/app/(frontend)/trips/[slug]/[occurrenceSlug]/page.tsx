import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { occurrenceGraphJsonLd } from '@/lib/jsonld'
import { getPublicOccurrenceBySlugs } from '@/lib/queries'
import { resolveTripDetailOccurrence } from '@/lib/trip-detail'
import { defaultTripLayout } from '@/lib/trip-layout'

type Props = { params: Promise<{ slug: string; occurrenceSlug: string }> }

function occurrenceDateLabel(dateFrom: string, dateTo: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).formatRange(new Date(dateFrom), new Date(dateTo))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, occurrenceSlug } = await params
  const resolved = await getPublicOccurrenceBySlugs(slug, occurrenceSlug)
  if (!resolved) notFound()
  const { event, occurrence, canonicalPath } = resolved
  const trip = resolveTripDetailOccurrence(event, occurrence)
  const occurrenceEvent = trip.event
  const location = trip.locations[0]
  const context = [location && typeof location === 'object' ? location.name : null, occurrenceDateLabel(occurrence.dateFrom, occurrence.dateTo)]
    .filter(Boolean).join(' · ')
  const description = [occurrenceEvent.shortDescription, context].filter(Boolean).join(' ')

  return {
    title: `${occurrenceEvent.seo?.title ?? occurrenceEvent.title} — ${context}`,
    description,
    alternates: { canonical: canonicalPath },
    robots: { index: occurrence.indexable !== false, follow: true },
  }
}

export default async function OccurrencePage({ params }: Props) {
  const { slug, occurrenceSlug } = await params
  const resolved = await getPublicOccurrenceBySlugs(slug, occurrenceSlug)
  if (!resolved) notFound()
  if (resolved.requestedAlias) permanentRedirect(resolved.canonicalPath)

  const { event, occurrence } = resolved
  const trip = resolveTripDetailOccurrence(event, occurrence)
  if (!trip.selectedDate) notFound()

  const hasCustomLayout = Boolean(event.layout?.length)
  return (
    <MarketingShell>
      <JsonLd data={occurrenceGraphJsonLd(trip.event, occurrence)} />
      <main style={hasCustomLayout ? undefined : { background: 'var(--theme-color-ink)', color: 'var(--theme-color-text)' }}>
        <RenderBlocks blocks={hasCustomLayout ? event.layout : defaultTripLayout(trip)} context={{ event, trip }} />
      </main>
    </MarketingShell>
  )
}
