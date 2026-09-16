import Link from 'next/link'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getActiveTripVariantsForEvent, getPublishedEventBySlug, getPublicEventDatesForEvent, getTripDetailEventDates } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { ParentTripSections } from '@/components/trip/ParentTripSections'
import { eventDateLifecycle, selectBookableOccurrence } from '@/lib/event-date-visibility'
import { tripPublicDatePath, tripVariantPath } from '@/lib/occurrence-routing'
import { absoluteUrl, collectionPageGraphJsonLd, eventDetailGraphJsonLd } from '@/lib/jsonld'
import { siteUrl } from '@/lib/url'
import { isIndexableContentOnlyParentTrip, isIndexableParentTrip, parentSafeBlocks, parentTripLayout } from '@/lib/parent-trip-layout'
import { resolveTripDetail } from '@/lib/trip-detail'
import type { EventDate } from '@/payload-types'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = await getPublishedEventBySlug(slug)
  if (!event) return { robots: { index: false, follow: true } }
  const variants = await getActiveTripVariantsForEvent(event.id)
  const currentDates = variants.length === 0 ? await getTripDetailEventDates(event.id, { includeInProgress: true }) : []
  const hub = variants.length > 0
    ? isIndexableParentTrip(event.content, variants, event.slug)
    : isIndexableContentOnlyParentTrip(event.content, 0, currentDates.length, event.slug)
  return {
    title: event.seo?.title || `${event.title} — Rockbusters`,
    description: event.seo?.description || event.shortDescription || undefined,
    alternates: { canonical: absoluteUrl(`/trips/${event.slug}`) },
    robots: { index: hub, follow: true },
  }
}

function publicPath(eventSlug: string, occurrence: EventDate): string | null {
  if (!occurrence.slug) return null
  try {
    return tripPublicDatePath(eventSlug, occurrence)
  } catch {
    return null
  }
}

function dateLabel(occurrence: EventDate): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
  return formatter.formatRange(new Date(occurrence.dateFrom), new Date(occurrence.dateTo))
}

export default async function TripPage({ params, searchParams }: Props) {
  const { slug } = await params

  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()

  const query = await searchParams
  const hasDateSelector = Object.prototype.hasOwnProperty.call(query, 'date')
  const [variants, candidateDates] = await Promise.all([
    getActiveTripVariantsForEvent(event.id),
    hasDateSelector
      ? getPublicEventDatesForEvent(event.id)
      : getTripDetailEventDates(event.id, { includeInProgress: true }),
  ])
  const contentOnly = !hasDateSelector && isIndexableContentOnlyParentTrip(event.content, variants.length, candidateDates.length, event.slug)
  const dates = !hasDateSelector && variants.length === 0 && !contentOnly
    ? await getPublicEventDatesForEvent(event.id)
    : candidateDates
  if (hasDateSelector) {
    const raw = query.date
    const selectedId = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : Number.NaN
    if (!Number.isSafeInteger(selectedId) || selectedId < 1) notFound()
    const selected = dates.find(date => date.id === selectedId && date.active === true &&
      (typeof date.event === 'object' ? date.event.id : date.event) === event.id)
    const path = selected ? publicPath(event.slug, selected) : null
    if (!path) notFound()
    permanentRedirect(path)
  }

  if (contentOnly) {
    const trip = resolveTripDetail(event, [])
    const layout = parentTripLayout(trip)
    const authoredBlocks = event.layout?.length ? parentSafeBlocks(event.layout) : null
    const authoredLayout = authoredBlocks?.length ? authoredBlocks : null
    return (
      <MarketingShell>
        <JsonLd data={eventDetailGraphJsonLd(event)} />
        <main style={{ background: 'var(--theme-color-ink)', color: 'var(--theme-color-text)' }}>
          {authoredLayout ? (
            <RenderBlocks blocks={authoredLayout} context={{ event, trip }} />
          ) : (
            <>
              <RenderBlocks blocks={layout.lead} context={{ event, trip }} />
              <RenderBlocks blocks={layout.body} context={{ event, trip }} />
            </>
          )}
          <section style={{ maxWidth: 'var(--theme-content-text-max)', margin: '0 auto', padding: '3rem var(--theme-page-gutter)' }}>
            <h2>Plan this trip</h2>
            <p>No upcoming dates are listed right now.</p>
            <p><Link href="/contact" className="btn-primary">Enquire about this trip →</Link></p>
          </section>
        </main>
      </MarketingShell>
    )
  }

  if (variants.length > 0) {
    const trip = resolveTripDetail(event, [])
    const layout = parentTripLayout(trip)
    const authoredBlocks = event.layout?.length ? parentSafeBlocks(event.layout) : null
    const authoredLayout = authoredBlocks?.length ? authoredBlocks : null
    const jsonLd = collectionPageGraphJsonLd({
      path: `/trips/${event.slug}`,
      name: event.title,
      description: event.shortDescription,
      items: variants.filter(variant => variant.slug).map(variant => ({
        name: variant.title,
        url: siteUrl(tripVariantPath(event.slug, variant.slug)),
      })),
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Trips', path: '/trips' },
        { name: event.title, path: `/trips/${event.slug}` },
      ],
    })
    return (
      <MarketingShell>
        <JsonLd data={jsonLd} />
        <main style={{ background: 'var(--theme-color-ink)', color: 'var(--theme-color-text)' }}>
          {authoredLayout ? (
            <RenderBlocks blocks={authoredLayout} context={{ event, trip }} />
          ) : (
            <RenderBlocks blocks={layout.lead} context={{ event, trip }} />
          )}
          <ParentTripSections eventSlug={event.slug} variants={variants} dates={dates} />
          {!authoredLayout && <RenderBlocks blocks={layout.body} context={{ event, trip }} />}
        </main>
      </MarketingShell>
    )
  }

  const selected = selectBookableOccurrence(dates)
  const selectedPath = selected ? publicPath(event.slug, selected) : null
  if (selectedPath) redirect(selectedPath)

  const linkedDates = dates.map(occurrence => ({ occurrence, path: publicPath(event.slug, occurrence) }))
    .filter((item): item is { occurrence: EventDate; path: string } => Boolean(item.path))

  return (
    <MarketingShell>
      <main style={{ maxWidth: 'var(--theme-content-text-max)', margin: '0 auto', padding: 'clamp(3rem, 8vw, 7rem) var(--theme-page-gutter)' }}>
        <p data-eyebrow="section">Availability</p>
        <h1>{event.title}</h1>
        <p>No bookable dates are available right now. Contact us if you would like help finding the next suitable trip.</p>
        <p><Link href="/contact" className="btn-primary">Enquire about this trip →</Link></p>
        {linkedDates.length > 0 && (
          <section aria-labelledby="published-dates">
            <h2 id="published-dates">Published dates</h2>
            <ul>
              {linkedDates.map(({ occurrence, path }) => {
                const lifecycle = eventDateLifecycle(occurrence)
                const status = lifecycle === 'ended' ? 'Past trip' : lifecycle === 'in-progress' ? 'In progress' : 'Currently unavailable'
                return <li key={occurrence.id}><Link href={path}>{dateLabel(occurrence)}</Link> — {status}</li>
              })}
            </ul>
          </section>
        )}
      </main>
    </MarketingShell>
  )
}
