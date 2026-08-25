import { afterEach, describe, expect, it, vi } from 'vitest'

const { cachedQuery } = vi.hoisted(() => ({
  cachedQuery: vi.fn(
    (_keyParts: string[], _tags: string[], _fn: () => unknown) =>
      Promise.resolve(undefined),
  ),
}))

vi.mock('@/lib/cache', () => ({
  cachedQuery,
  TAGS: {
    guides: 'guides',
    locations: 'locations',
    events: 'events',
    eventDates: 'event-dates',
    posts: 'posts',
    postCategories: 'post-categories',
    pages: 'pages',
  },
}))
// Stub the Payload client so importing queries never touches the DB.
vi.mock('@/lib/payload', () => ({ getPayloadClient: vi.fn() }))

import * as q from '@/lib/queries'

afterEach(() => vi.clearAllMocks())

const cases: Array<[string, () => unknown, string[], string[]]> = [
  ['getActiveGuides', () => q.getActiveGuides(), ['active-guides'], ['guides']],
  ['getGuideBySlug', () => q.getGuideBySlug('s'), ['guide-by-slug', 's'], ['guides']],
  ['getPublishedEventsForGuide', () => q.getPublishedEventsForGuide(1), ['events-for-guide', '1'], ['events', 'locations']],
  ['getActiveLocations', () => q.getActiveLocations(), ['active-locations'], ['locations']],
  ['getLocationBySlug', () => q.getLocationBySlug('s'), ['location-by-slug', 's'], ['locations']],
  ['getPublishedEventsForLocation', () => q.getPublishedEventsForLocation(2), ['events-for-location', '2'], ['events']],
  ['getPublishedPosts', () => q.getPublishedPosts(), ['published-posts'], ['posts', 'post-categories']],
  ['getPublishedPostBySlug', () => q.getPublishedPostBySlug('s'), ['post-by-slug', 's'], ['posts', 'post-categories']],
  ['getPostCategoryBySlug', () => q.getPostCategoryBySlug('s'), ['post-category-by-slug', 's'], ['post-categories']],
  ['getPublishedPostsByCategory', () => q.getPublishedPostsByCategory(3), ['posts-by-category', '3'], ['posts', 'post-categories']],
  ['getPublishedPageBySlug', () => q.getPublishedPageBySlug('landing'), ['page-by-slug', 'landing'], ['pages']],
  ['getPublishedEventBySlug', () => q.getPublishedEventBySlug('s'), ['event-by-slug', 's'], ['events', 'guides', 'locations']],
  ['getActiveEventDatesForEvent', () => q.getActiveEventDatesForEvent(4), ['event-dates-for-event', '4'], ['event-dates']],
  ['getPublishedEventsWithLocations', () => q.getPublishedEventsWithLocations(), ['published-events-with-locations'], ['events', 'locations']],
  ['getPublishedEventsForProgram', () => q.getPublishedEventsForProgram(5), ['events-for-program', '5'], ['events']],
  ['getActiveEventDates', () => q.getActiveEventDates(), ['active-event-dates'], ['event-dates', 'events', 'locations']],
]

describe('query tag wiring', () => {
  it.each(cases)('%s wires keyParts + tags', (_name, call, keyParts, tags) => {
    call()
    const lastCall = cachedQuery.mock.calls.at(-1)
    expect(lastCall?.[0]).toEqual(keyParts)
    expect(lastCall?.[1]).toEqual(tags)
  })

  it('getActiveEventDatesForEvents(non-empty) wires event-dates', () => {
    q.getActiveEventDatesForEvents([1, 2])
    const lastCall = cachedQuery.mock.calls.at(-1)
    expect(lastCall?.[0]).toEqual(['event-dates-for-events', '1,2'])
    expect(lastCall?.[1]).toEqual(['event-dates'])
  })

  it('getActiveEventDatesForEvents([]) returns [] without caching', async () => {
    const out = await q.getActiveEventDatesForEvents([])
    expect(out).toEqual([])
    expect(cachedQuery).not.toHaveBeenCalled()
  })
})
