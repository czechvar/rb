import { getPayloadClient } from '@/lib/payload'
import type { Where } from 'payload'
import type { Event } from '@/payload-types'
import { upcomingEventDateWhere } from '@/lib/event-date-visibility'
import { relationId, relationIds } from './helpers'

export type TripGridSource = 'featured' | 'upcoming' | 'manual' | 'byProgram' | 'byLocation'
export type FeaturedTripSource = 'manual' | 'currentContext'

export type TripGridResolverInput = {
  source?: TripGridSource | null
  events?: Array<number | Event> | null
  program?: number | { id: number } | null
  location?: number | { id: number } | null
  limit?: number | null
}

export type FeaturedTripResolverInput = {
  source?: FeaturedTripSource | null
  event?: number | Event | null
  currentEvent?: Event | null
}

export async function resolveTripGridEvents(input: TripGridResolverInput): Promise<Event[]> {
  const payload = await getPayloadClient()
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 12)
  const source = input.source ?? 'featured'

  if (source === 'manual') {
    const expanded = (input.events ?? []).filter(
      (event): event is Event => typeof event === 'object' && event.state === 'published',
    )
    if (expanded.length > 0) return filterEventsWithUpcomingDates(payload, expanded, limit)

    const ids = relationIds(input.events)
    if (ids.length === 0) return []

    const { docs } = await payload.find({
      collection: 'events',
      where: {
        and: [{ id: { in: ids } }, { state: { equals: 'published' } }],
      },
      depth: 2,
      limit: ids.length,
    })
    return filterEventsWithUpcomingDates(payload, docs, limit)
  }

  if (source === 'upcoming') {
    const { docs: dates } = await payload.find({
      collection: 'event-dates',
      where: { and: [{ active: { equals: true } }, upcomingEventDateWhere()] },
      sort: 'dateFrom',
      depth: 2,
      limit: 50,
    })

    const byId = new Map<number, Event>()
    for (const date of dates) {
      if (typeof date.event !== 'object' || date.event.state !== 'published') continue
      byId.set(date.event.id, date.event)
      if (byId.size >= limit) break
    }
    return [...byId.values()]
  }

  const whereClauses: Where[] = [{ state: { equals: 'published' } }]

  if (source === 'featured') {
    whereClauses.push({ featured: { equals: true } })
  }

  if (source === 'byProgram') {
    const programId = relationId(input.program)
    if (!programId) return []
    whereClauses.push({ programs: { contains: programId } })
  }

  if (source === 'byLocation') {
    const locationId = relationId(input.location)
    if (!locationId) return []
    whereClauses.push({ locations: { contains: locationId } })
  }

  const { docs } = await payload.find({
    collection: 'events',
    where: { and: whereClauses },
    sort: source === 'featured' ? '-featured' : 'title',
    depth: 2,
    limit: 100,
  })

  return filterEventsWithUpcomingDates(payload, docs, limit)
}

export async function resolveFeaturedTrip(input: FeaturedTripResolverInput): Promise<Event | null> {
  if (input.source === 'currentContext' && input.currentEvent?.state === 'published') {
    return input.currentEvent
  }

  const expanded = input.event
  if (typeof expanded === 'object' && expanded?.state === 'published') return expanded

  const eventId = relationId(input.event)
  if (!eventId) return null

  const payload = await getPayloadClient()
  const event = await payload.findByID({ collection: 'events', id: eventId, depth: 2 })
  if (event.state !== 'published') return null

  const [eventWithUpcomingDate] = await filterEventsWithUpcomingDates(payload, [event], 1)
  return eventWithUpcomingDate ?? null
}

async function filterEventsWithUpcomingDates(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  events: Event[],
  limit: number,
): Promise<Event[]> {
  if (!events.length) return events

  const { docs } = await payload.find({
    collection: 'event-dates',
    where: {
      and: [
        { event: { in: events.map((event) => event.id) } },
        { active: { equals: true } },
        upcomingEventDateWhere(),
      ],
    },
    depth: 0,
    limit: 1000,
  })
  const eventIdsWithUpcomingDates = new Set(
    docs.map((date) => (typeof date.event === 'object' ? date.event.id : date.event)),
  )

  return events.filter((event) => eventIdsWithUpcomingDates.has(event.id)).slice(0, limit)
}
