import { notFound, redirect } from 'next/navigation'

import { selectBookableOccurrence } from '@/lib/event-date-visibility'
import { tripOccurrencePath } from '@/lib/occurrence-routing'
import { getPublicEventDatesForEvent, getPublishedEventBySlug } from '@/lib/queries'

type Props = { params: Promise<{ slug: string }> }

export default async function TripFaqPage({ params }: Props) {
  const { slug } = await params
  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()

  const selected = selectBookableOccurrence(await getPublicEventDatesForEvent(event.id))
  redirect(selected?.slug ? tripOccurrencePath(event.slug, selected.slug) : `/trips/${event.slug}`)
}
