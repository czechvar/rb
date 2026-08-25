import { getPayloadClient } from '@/lib/payload'
import type { Where } from 'payload'
import type { Event, EventDate, Guide, Partner, Post } from '@/payload-types'
import { relationId, relationIds } from './helpers'

export type PostGridSource = 'latest' | 'byCategory' | 'manual'
export type CalendarSource = 'upcoming' | 'byEvent' | 'manual'
export type PartnerStripSource = 'featured' | 'all' | 'manual'
export type GuideProfileSource = 'manual' | 'currentGuide'
export type GuideTripsSource = 'byGuide' | 'currentGuide' | 'manual'

export type PostGridResolverInput = {
  source?: PostGridSource | null
  posts?: Array<number | Post> | null
  category?: number | { id: number } | null
  limit?: number | null
}

export type CalendarResolverInput = {
  source?: CalendarSource | null
  eventDates?: Array<number | EventDate> | null
  event?: number | { id: number } | null
  limit?: number | null
  now?: Date
}

export type PartnerStripResolverInput = {
  source?: PartnerStripSource | null
  partners?: Array<number | Partner> | null
  limit?: number | null
}

export type GuideProfileResolverInput = {
  source?: GuideProfileSource | null
  guide?: number | Guide | null
  currentGuide?: Guide | null
}

export type GuideTripsResolverInput = {
  source?: GuideTripsSource | null
  guide?: number | Guide | null
  currentGuide?: Guide | null
  events?: Array<number | Event> | null
  limit?: number | null
}

export async function resolvePostGridPosts(input: PostGridResolverInput): Promise<Post[]> {
  const payload = await getPayloadClient()
  const limit = boundedLimit(input.limit, 3, 12)
  const source = input.source ?? 'latest'

  if (source === 'manual') {
    const expanded = (input.posts ?? []).filter(
      (post): post is Post => typeof post === 'object' && post.state === 'published',
    )
    if (expanded.length > 0) return expanded.slice(0, limit)

    const ids = relationIds(input.posts)
    if (ids.length === 0) return []

    const { docs } = await payload.find({
      collection: 'posts',
      where: { and: [{ id: { in: ids } }, publishedPostWhere] },
      sort: '-publishedAt',
      depth: 1,
      limit,
    })
    return docs
  }

  const whereClauses: Where[] = [publishedPostWhere]
  if (source === 'byCategory') {
    const categoryId = relationId(input.category)
    if (!categoryId) return []
    whereClauses.push({ category: { equals: categoryId } })
  }

  const { docs } = await payload.find({
    collection: 'posts',
    where: { and: whereClauses },
    sort: '-publishedAt',
    depth: 1,
    limit,
  })
  return docs
}

export async function resolveCalendarEventDates(
  input: CalendarResolverInput,
): Promise<EventDate[]> {
  const payload = await getPayloadClient()
  const limit = boundedLimit(input.limit, 6, 12)
  const source = input.source ?? 'upcoming'

  if (source === 'manual') {
    const expanded = (input.eventDates ?? []).filter(
      (date): date is EventDate => typeof date === 'object' && isRenderableEventDate(date),
    )
    if (expanded.length > 0) return expanded.slice(0, limit)

    const ids = relationIds(input.eventDates)
    if (ids.length === 0) return []

    const { docs } = await payload.find({
      collection: 'event-dates',
      where: { and: [{ id: { in: ids } }, activeWhere] },
      sort: 'dateFrom',
      depth: 2,
      limit,
    })
    return docs.filter(isRenderableEventDate)
  }

  const whereClauses: Where[] = [
    activeWhere,
    { dateFrom: { greater_than_equal: (input.now ?? new Date()).toISOString() } },
  ]
  if (source === 'byEvent') {
    const eventId = relationId(input.event)
    if (!eventId) return []
    whereClauses.push({ event: { equals: eventId } })
  } else {
    const { docs: events } = await payload.find({
      collection: 'events',
      where: publishedEventWhere,
      depth: 0,
      limit: 1000,
    })
    if (!events.length) return []
    whereClauses.push({ event: { in: events.map((event) => event.id) } })
  }

  const { docs } = await payload.find({
    collection: 'event-dates',
    where: { and: whereClauses },
    sort: 'dateFrom',
    depth: 2,
    limit,
  })
  return docs.filter(isRenderableEventDate)
}

export async function resolvePartnerStripPartners(
  input: PartnerStripResolverInput,
): Promise<Partner[]> {
  const payload = await getPayloadClient()
  const limit = boundedLimit(input.limit, 6, 12)
  const source = input.source ?? 'featured'

  if (source === 'manual') {
    const expanded = (input.partners ?? []).filter(
      (partner): partner is Partner => typeof partner === 'object' && partner.active === true,
    )
    if (expanded.length > 0) return expanded.slice(0, limit)

    const ids = relationIds(input.partners)
    if (ids.length === 0) return []

    const { docs } = await payload.find({
      collection: 'partners',
      where: { and: [{ id: { in: ids } }, activeWhere] },
      sort: 'name',
      depth: 1,
      limit,
    })
    return docs
  }

  const whereClauses: Where[] = [activeWhere]
  if (source === 'featured') whereClauses.push({ featured: { equals: true } })

  const { docs } = await payload.find({
    collection: 'partners',
    where: { and: whereClauses },
    sort: 'name',
    depth: 1,
    limit,
  })
  return docs
}

export async function resolveGuideProfileGuide(
  input: GuideProfileResolverInput,
): Promise<Guide | null> {
  if (input.source === 'currentGuide' && input.currentGuide?.active === true) {
    return input.currentGuide
  }

  const expanded = input.guide
  if (typeof expanded === 'object' && expanded?.active === true) return expanded

  const guideId = relationId(input.guide)
  if (!guideId) return null

  const payload = await getPayloadClient()
  const guide = await payload.findByID({ collection: 'guides', id: guideId, depth: 1 })
  return guide.active === true ? guide : null
}

export async function resolveGuideTripsEvents(input: GuideTripsResolverInput): Promise<Event[]> {
  const payload = await getPayloadClient()
  const limit = boundedLimit(input.limit, 3, 12)
  const source = input.source ?? 'byGuide'

  if (source === 'manual') {
    const expanded = (input.events ?? []).filter(
      (event): event is Event => typeof event === 'object' && event.state === 'published',
    )
    if (expanded.length > 0) return expanded.slice(0, limit)

    const ids = relationIds(input.events)
    if (ids.length === 0) return []

    const { docs } = await payload.find({
      collection: 'events',
      where: { and: [{ id: { in: ids } }, publishedEventWhere] },
      sort: 'title',
      depth: 2,
      limit,
    })
    return docs
  }

  const guideId = source === 'currentGuide' ? input.currentGuide?.id : relationId(input.guide)
  if (!guideId) return []

  const { docs } = await payload.find({
    collection: 'events',
    where: { and: [publishedEventWhere, { coaches: { contains: guideId } }] },
    sort: 'title',
    depth: 2,
    limit,
  })
  return docs
}

const activeWhere: Where = { active: { equals: true } }
const publishedEventWhere: Where = { state: { equals: 'published' } }
const publishedPostWhere: Where = { state: { equals: 'published' } }

function boundedLimit(value: number | null | undefined, fallback: number, max: number) {
  return Math.min(Math.max(value ?? fallback, 1), max)
}

function isRenderableEventDate(date: EventDate): boolean {
  return date.active === true && typeof date.event === 'object' && date.event.state === 'published'
}
