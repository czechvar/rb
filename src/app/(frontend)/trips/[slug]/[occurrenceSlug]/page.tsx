import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { occurrenceGraphJsonLd, variantGraphJsonLd } from '@/lib/jsonld'
import { eventDateLifecycle } from '@/lib/event-date-visibility'
import {
  getPublicEventDatesForEvent,
  getPublicEventDatesForVariant,
  getPublicOccurrenceBySlugs,
  getPublicTripVariantBySlugs,
} from '@/lib/queries'
import { tripPublicDatePath, tripVariantPath } from '@/lib/occurrence-routing'
import { resolveTripDetailOccurrence, resolveTripDetailVariant } from '@/lib/trip-detail'
import { defaultTripLayout } from '@/lib/trip-layout'
import type { EventDate } from '@/payload-types'

type Props = {
  params: Promise<{ slug: string; occurrenceSlug: string }>
  searchParams?: Promise<{ date?: string | string[] }>
}

const publicDateKey = /^\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}$/

function selectedOccurrence(dates: EventDate[], date: string | string[] | undefined): EventDate | null {
  if (date === undefined) return null
  if (typeof date !== 'string' || !publicDateKey.test(date)) notFound()
  const matches = dates.filter(item => item.publicDateKey === date)
  if (matches.length !== 1) notFound()
  return matches[0]
}

function occurrenceDateLabel(dateFrom: string, dateTo: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).formatRange(new Date(dateFrom), new Date(dateTo))
}

function variantContext(name: string, occurrence: EventDate | null): string {
  return [name, occurrence ? occurrenceDateLabel(occurrence.dateFrom, occurrence.dateTo) : null]
    .filter(Boolean).join(' · ')
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug, occurrenceSlug } = await params
  const variantResolution = await getPublicTripVariantBySlugs(slug, occurrenceSlug)
  if (variantResolution) {
    const { event, variant } = variantResolution
    const query = searchParams ? await searchParams : {}
    const dates = await getPublicEventDatesForVariant(event.id, variant.id)
    const occurrence = selectedOccurrence(dates, query.date)
    const trip = resolveTripDetailVariant(event, variant, dates, occurrence)
    const context = variantContext(variant.title, occurrence)
    const canonicalPath = tripVariantPath(event.slug, variant.slug, occurrence?.publicDateKey ?? undefined)
    const lifecycle = occurrence ? eventDateLifecycle(occurrence) : null
    return {
      title: `${trip.event.seo?.title ?? trip.event.title} — ${context}`,
      description: [trip.event.shortDescription, context].filter(Boolean).join(' '),
      alternates: { canonical: canonicalPath },
      robots: {
        index: variant.indexable === true && (!occurrence || (
          occurrence.indexable !== false && (lifecycle === 'upcoming' || lifecycle === 'in-progress')
        )),
        follow: true,
      },
    }
  }

  const resolved = await getPublicOccurrenceBySlugs(slug, occurrenceSlug)
  if (!resolved) notFound()
  const { event, occurrence, canonicalPath } = resolved
  if (occurrence.tripVariant && occurrence.publicDateKey) {
    const newPath = tripPublicDatePath(event.slug, occurrence)
    return { alternates: { canonical: newPath }, robots: { index: false, follow: true } }
  }
  const trip = resolveTripDetailOccurrence(event, occurrence)
  const context = variantContext(trip.locations[0]?.name ?? '', occurrence)
  return {
    title: `${trip.event.seo?.title ?? trip.event.title} — ${context}`,
    description: [trip.event.shortDescription, context].filter(Boolean).join(' '),
    alternates: { canonical: canonicalPath },
    robots: { index: false, follow: true },
  }
}

export default async function VariantOrLegacyOccurrencePage({ params, searchParams }: Props) {
  const { slug, occurrenceSlug } = await params
  const variantResolution = await getPublicTripVariantBySlugs(slug, occurrenceSlug)
  if (variantResolution) {
    const { event, variant, requestedAlias } = variantResolution
    const query = searchParams ? await searchParams : {}
    const dates = await getPublicEventDatesForVariant(event.id, variant.id)
    const occurrence = selectedOccurrence(dates, query.date)
    if (requestedAlias) permanentRedirect(tripVariantPath(event.slug, variant.slug, occurrence?.publicDateKey ?? undefined))
    const trip = resolveTripDetailVariant(event, variant, dates, occurrence)
    const hasCustomLayout = Boolean(event.layout?.length)
    return (
      <MarketingShell>
        <JsonLd data={variantGraphJsonLd(trip.event, variant, occurrence ?? undefined)} />
        <main style={hasCustomLayout ? undefined : { background: 'var(--theme-color-ink)', color: 'var(--theme-color-text)' }}>
          <RenderBlocks blocks={hasCustomLayout ? event.layout : defaultTripLayout(trip)} context={{ event: trip.event, trip }} />
        </main>
      </MarketingShell>
    )
  }

  const resolved = await getPublicOccurrenceBySlugs(slug, occurrenceSlug)
  if (!resolved) notFound()
  const { event, occurrence } = resolved
  if (occurrence.tripVariant && occurrence.publicDateKey) permanentRedirect(tripPublicDatePath(event.slug, occurrence))
  if (resolved.requestedAlias) permanentRedirect(resolved.canonicalPath)
  const siblings = await getPublicEventDatesForEvent(event.id)
  const trip = resolveTripDetailOccurrence(event, occurrence, siblings)
  if (!trip.selectedDate) notFound()
  const hasCustomLayout = Boolean(event.layout?.length)
  return (
    <MarketingShell>
      <JsonLd data={occurrenceGraphJsonLd(trip.event, occurrence)} />
      <main style={hasCustomLayout ? undefined : { background: 'var(--theme-color-ink)', color: 'var(--theme-color-text)' }}>
        <RenderBlocks blocks={hasCustomLayout ? event.layout : defaultTripLayout(trip)} context={{ event: trip.event, trip }} />
      </main>
    </MarketingShell>
  )
}
