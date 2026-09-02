import { getPayloadClient } from '@/lib/payload'
import type { Where } from 'payload'
import type { Event, EventDate, Guide, Partner, Post } from '@/payload-types'
import { isUpcomingEventDate, upcomingEventDateWhere } from '@/lib/event-date-visibility'
import { relationId, relationIds } from './helpers'

export type PostGridSource = 'latest' | 'byCategory' | 'manual'
export type CalendarSource = 'upcoming' | 'byEvent' | 'manual'
export type PartnerStripSource = 'featured' | 'all' | 'manual'
export type GuideProfileSource = 'manual' | 'currentGuide'
export type GuideTripsSource = 'byGuide' | 'currentGuide' | 'manual'
export type FeaturedContentSource = 'manual' | 'currentContext'

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

export type FeaturedPostResolverInput = {
  source?: FeaturedContentSource | null
  post?: number | Post | null
  currentPost?: Post | null
}

export type FeaturedEventDateResolverInput = {
  eventDate?: number | EventDate | null
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

export async function resolveFeaturedPost(input: FeaturedPostResolverInput): Promise<Post | null> {
  if (input.source === 'currentContext' && input.currentPost?.state === 'published') {
    return input.currentPost
  }

  const expanded = input.post
  if (typeof expanded === 'object' && expanded?.state === 'published') return expanded

  const postId = relationId(input.post)
  if (!postId) return null

  const payload = await getPayloadClient()
  const post = await payload.findByID({ collection: 'posts', id: postId, depth: 1 })
  return post.state === 'published' ? post : null
}

export async function resolveCalendarEventDates(
  input: CalendarResolverInput,
): Promise<EventDate[]> {
  const payload = await getPayloadClient()
  const limit = boundedLimit(input.limit, 6, 12)
  const source = input.source ?? 'upcoming'

  if (source === 'manual') {
    const expanded = (input.eventDates ?? []).filter(
      (date): date is EventDate =>
        typeof date === 'object' && isRenderableEventDate(date, input.now),
    )
    if (expanded.length > 0) return expanded.slice(0, limit)

    const ids = relationIds(input.eventDates)
    if (ids.length === 0) return []

    const { docs } = await payload.find({
      collection: 'event-dates',
      where: { and: [{ id: { in: ids } }, activeWhere, upcomingEventDateWhere(input.now)] },
      sort: 'dateFrom',
      depth: 2,
      limit,
    })
    return docs.filter((date) => isRenderableEventDate(date, input.now))
  }

  const whereClauses: Where[] = [
    activeWhere,
    upcomingEventDateWhere(input.now),
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
  return docs.filter((date) => isRenderableEventDate(date, input.now))
}

export async function resolveFeaturedEventDate(
  input: FeaturedEventDateResolverInput,
): Promise<EventDate | null> {
  const expanded = input.eventDate
  if (expanded && typeof expanded === 'object' && isRenderableEventDate(expanded)) return expanded

  const eventDateId = relationId(input.eventDate)
  if (!eventDateId) return null

  const [date] = await resolveCalendarEventDates({
    source: 'manual',
    eventDates: [eventDateId],
    limit: 1,
  })
  return date ?? null
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

function isRenderableEventDate(date: EventDate, now = new Date()): boolean {
  return (
    date.active === true &&
    isUpcomingEventDate(date, now) &&
    typeof date.event === 'object' &&
    date.event.state === 'published'
  )
}
