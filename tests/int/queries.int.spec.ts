import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
    faqs: 'faqs',
    media: 'media',
    partners: 'partners',
    posts: 'posts',
    postCategories: 'post-categories',
    programs: 'programs',
    pages: 'pages',
    reviews: 'reviews',
  },
}))
// Stub the Payload client so importing queries never touches the DB.
vi.mock('@/lib/payload', () => ({ getPayloadClient: vi.fn() }))

import * as q from '@/lib/queries'

const todayFloor = '2026-09-02T00:00:00.000Z'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-02T15:30:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

const cases: Array<[string, () => unknown, string[], string[]]> = [
  ['getActiveGuides', () => q.getActiveGuides(), ['active-guides'], ['guides']],
  ['getGuideBySlug', () => q.getGuideBySlug('s'), ['guide-by-slug', 's'], ['guides']],
  ['getPublishedEventsForGuide', () => q.getPublishedEventsForGuide(1), ['events-for-guide', '1', todayFloor], ['events', 'event-dates', 'locations']],
  ['getActiveLocations', () => q.getActiveLocations(), ['active-locations'], ['locations']],
  ['getLocationBySlug', () => q.getLocationBySlug('s'), ['location-by-slug', 's'], ['locations']],
  ['getPublishedEventsForLocation', () => q.getPublishedEventsForLocation(2), ['events-for-location', '2', todayFloor], ['events', 'event-dates']],
  ['getPublishedPosts', () => q.getPublishedPosts(), ['published-posts'], ['posts', 'post-categories']],
  ['getPublishedPostBySlug', () => q.getPublishedPostBySlug('s'), ['post-by-slug', 's'], ['posts', 'post-categories']],
  ['getPostCategoryBySlug', () => q.getPostCategoryBySlug('s'), ['post-category-by-slug', 's'], ['post-categories']],
  ['getPublishedPostsByCategory', () => q.getPublishedPostsByCategory(3), ['posts-by-category', '3'], ['posts', 'post-categories']],
  [
    'getPublishedPageBySlug',
    () => q.getPublishedPageBySlug('landing'),
    ['page-by-slug', 'landing'],
    [
      'pages',
      'events',
      'event-dates',
      'faqs',
      'guides',
      'locations',
      'media',
      'partners',
      'posts',
      'post-categories',
      'programs',
      'reviews',
    ],
  ],
  ['getPublishedEventBySlug', () => q.getPublishedEventBySlug('s'), ['event-by-slug', 's'], ['events', 'guides', 'locations']],
  ['getActiveEventDatesForEvent', () => q.getActiveEventDatesForEvent(4), ['event-dates-for-event', '4', todayFloor], ['event-dates', 'guides', 'locations']],
  ['getPublishedEventsWithLocations', () => q.getPublishedEventsWithLocations(), ['published-events-with-locations', todayFloor], ['events', 'event-dates', 'locations']],
  ['getPublishedEventsForProgram', () => q.getPublishedEventsForProgram(5), ['events-for-program', '5', todayFloor], ['events', 'event-dates']],
  ['getActiveEventDates', () => q.getActiveEventDates(), ['active-event-dates', todayFloor], ['event-dates', 'events', 'locations']],
  ['getFeaturedEventsForHomepage', () => q.getFeaturedEventsForHomepage(), ['homepage-featured-events', todayFloor], ['events', 'event-dates']],
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
    expect(lastCall?.[0]).toEqual(['event-dates-for-events', '1,2', todayFloor])
    expect(lastCall?.[1]).toEqual(['event-dates'])
  })

  it('getActiveEventDatesForEvents([]) returns [] without caching', async () => {
    const out = await q.getActiveEventDatesForEvents([])
    expect(out).toEqual([])
    expect(cachedQuery).not.toHaveBeenCalled()
  })
})
