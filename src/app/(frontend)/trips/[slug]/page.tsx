import { notFound } from 'next/navigation'
import { resolveTripDetail } from '@/lib/trip-detail'
import { defaultTripLayout } from '@/lib/trip-layout'
import { getPublishedEventBySlug, getTripDetailEventDates } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { eventDetailGraphJsonLd } from '@/lib/jsonld'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string }> }

export default async function TripPage({ params, searchParams }: Props) {
  const { slug } = await params

  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()

  const query = await searchParams
  const selectedId = query.date && /^\d+$/.test(query.date) ? Number(query.date) : undefined
  const dates = await getTripDetailEventDates(event.id)
  const trip = resolveTripDetail(event, dates, selectedId)
  const jsonLd = eventDetailGraphJsonLd(event)

  const hasCustomLayout = Boolean(event.layout?.length)

  return (
    <MarketingShell>
      <JsonLd data={jsonLd} />
      <main style={hasCustomLayout ? undefined : { background: 'var(--theme-color-ink)', color: 'var(--theme-color-text)' }}>
        <RenderBlocks blocks={hasCustomLayout ? event.layout : defaultTripLayout(trip)} context={{ event, trip }} />
      </main>
    </MarketingShell>
  )
}
