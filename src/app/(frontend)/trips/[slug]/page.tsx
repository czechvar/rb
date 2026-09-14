import Link from 'next/link'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import { getPublishedEventBySlug, getPublicEventDatesForEvent } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { eventDateLifecycle, selectBookableOccurrence } from '@/lib/event-date-visibility'
import { tripOccurrencePath } from '@/lib/occurrence-routing'
import type { EventDate } from '@/payload-types'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string | string[] }>
}

export const metadata = { robots: { index: false, follow: true } }

function publicPath(eventSlug: string, occurrence: EventDate): string | null {
  if (!occurrence.slug) return null
  try {
    return tripOccurrencePath(eventSlug, occurrence.slug)
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
  const dates = await getPublicEventDatesForEvent(event.id)
  if (Object.prototype.hasOwnProperty.call(query, 'date')) {
    const raw = query.date
    const selectedId = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : Number.NaN
    if (!Number.isSafeInteger(selectedId) || selectedId < 1) notFound()
    const selected = dates.find(date => date.id === selectedId && date.active === true &&
      (typeof date.event === 'object' ? date.event.id : date.event) === event.id)
    const path = selected ? publicPath(event.slug, selected) : null
    if (!path) notFound()
    permanentRedirect(path)
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
