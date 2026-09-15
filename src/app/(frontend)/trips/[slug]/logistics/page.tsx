import { notFound, redirect } from 'next/navigation'

import { selectBookableOccurrence } from '@/lib/event-date-visibility'
import { tripPublicDatePath } from '@/lib/occurrence-routing'
import { getPublicEventDatesForEvent, getPublishedEventBySlug } from '@/lib/queries'

type Props = { params: Promise<{ slug: string }> }

export default async function TripLogisticsPage({ params }: Props) {
  const { slug } = await params
  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()

  const selected = selectBookableOccurrence(await getPublicEventDatesForEvent(event.id))
  redirect(selected?.slug ? tripPublicDatePath(event.slug, selected) : `/trips/${event.slug}`)
}
