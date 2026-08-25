import { getPayloadClient } from '@/lib/payload'
import { cachedQuery, TAGS } from '@/lib/cache'
import type {
  Guide,
  Location,
  Event,
  EventDate,
  Post,
  PostCategory,
  Review,
  Faq,
  Partner,
  Media,
  Page,
} from '@/payload-types'

// --- CMS pages ----------------------------------------------------------

export function getPublishedPageBySlug(slug: string) {
  return cachedQuery(['page-by-slug', slug], [TAGS.pages], async (): Promise<Page | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'pages',
      where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
      limit: 1,
      depth: 2,
    })
    return docs[0] ?? null
  })
}

// --- Guides / team -------------------------------------------------------

export function getActiveGuides() {
  return cachedQuery(['active-guides'], [TAGS.guides], async (): Promise<Guide[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'guides',
      where: { active: { equals: true } },
      limit: 100,
      depth: 1,
    })
    return docs
  })
}

export function getGuideBySlug(slug: string) {
  return cachedQuery(['guide-by-slug', slug], [TAGS.guides], async (): Promise<Guide | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'guides',
      where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
      limit: 1,
      depth: 1,
    })
    return docs[0] ?? null
  })
}

// depth 1 embeds mainPicture + locations for trip cards on /team/[slug] → tag locations too.
export function getPublishedEventsForGuide(guideId: number) {
  return cachedQuery(['events-for-guide', String(guideId)], [TAGS.events, TAGS.locations], async (): Promise<Event[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      where: { and: [{ coaches: { contains: guideId } }, { state: { equals: 'published' } }] },
      limit: 20,
      depth: 1,
    })
    return docs
  })
}

// --- Locations / destinations -------------------------------------------

export function getActiveLocations() {
  return cachedQuery(['active-locations'], [TAGS.locations], async (): Promise<Location[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'locations',
      where: { active: { equals: true } },
      limit: 200,
      depth: 1,
    })
    return docs
  })
}

export function getLocationBySlug(slug: string) {
  return cachedQuery(['location-by-slug', slug], [TAGS.locations], async (): Promise<Location | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'locations',
      where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
      limit: 1,
      depth: 1,
    })
    return docs[0] ?? null
  })
}

// depth 0 → only title + slug rendered on /destinations/[slug].
export function getPublishedEventsForLocation(locationId: number) {
  return cachedQuery(['events-for-location', String(locationId)], [TAGS.events], async (): Promise<Event[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      where: { and: [{ locations: { contains: locationId } }, { state: { equals: 'published' } }] },
      limit: 20,
      depth: 0,
    })
    return docs
  })
}

// --- Posts / blog --------------------------------------------------------
// depth 1 embeds the category (name shown on cards/byline) → tag post-categories too.

export function getPublishedPosts() {
  return cachedQuery(['published-posts'], [TAGS.posts, TAGS.postCategories], async (): Promise<Post[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { state: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 50,
      depth: 1,
    })
    return docs
  })
}

export function getPublishedPostBySlug(slug: string) {
  return cachedQuery(['post-by-slug', slug], [TAGS.posts, TAGS.postCategories], async (): Promise<Post | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
      limit: 1,
      depth: 1,
    })
    return docs[0] ?? null
  })
}

export function getPostCategoryBySlug(slug: string) {
  return cachedQuery(['post-category-by-slug', slug], [TAGS.postCategories], async (): Promise<PostCategory | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'post-categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    return docs[0] ?? null
  })
}

export function getPublishedPostsByCategory(categoryId: number) {
  return cachedQuery(['posts-by-category', String(categoryId)], [TAGS.posts, TAGS.postCategories], async (): Promise<Post[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { and: [{ category: { equals: categoryId } }, { state: { equals: 'published' } }] },
      sort: '-publishedAt',
      limit: 50,
      depth: 1,
    })
    return docs
  })
}

// --- Events / trips ------------------------------------------------------
// depth 2 embeds coaches (guides) + locations on /trips/[slug] → tag all three.

export function getPublishedEventBySlug(slug: string) {
  return cachedQuery(['event-by-slug', slug], [TAGS.events, TAGS.guides, TAGS.locations], async (): Promise<Event | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
      limit: 1,
      depth: 2,
    })
    return docs[0] ?? null
  })
}

export function getActiveEventDatesForEvent(eventId: number) {
  return cachedQuery(['event-dates-for-event', String(eventId)], [TAGS.eventDates], async (): Promise<EventDate[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'event-dates',
      where: { and: [{ event: { equals: eventId } }, { active: { equals: true } }] },
      sort: 'dateFrom',
      limit: 100,
    })
    return docs
  })
}

// --- Programs ------------------------------------------------------------
// depth 1 embeds the location (name shown on program cards) → tag locations too.

export function getPublishedEventsWithLocations() {
  return cachedQuery(['published-events-with-locations'], [TAGS.events, TAGS.locations], async (): Promise<Event[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      where: { state: { equals: 'published' } },
      sort: '-featured',
      depth: 1,
      limit: 100,
    })
    return docs
  })
}

// Returns [] for an empty id list without hitting the cache or the DB.
export function getActiveEventDatesForEvents(eventIds: number[]) {
  if (eventIds.length === 0) return Promise.resolve<EventDate[]>([])
  return cachedQuery(['event-dates-for-events', eventIds.join(',')], [TAGS.eventDates], async (): Promise<EventDate[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'event-dates',
      where: { and: [{ event: { in: eventIds } }, { active: { equals: true } }] },
      sort: 'dateFrom',
      depth: 0,
      limit: 500,
    })
    return docs
  })
}

// LinkedEvents on /programs/[slug]. The page's primary `programs` doc and its
// faqs/reviews stay as direct (uncached) finds — out of scope.
export function getPublishedEventsForProgram(programId: number) {
  return cachedQuery(['events-for-program', String(programId)], [TAGS.events], async (): Promise<Event[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      where: { and: [{ programs: { contains: programId } }, { state: { equals: 'published' } }] },
      sort: 'title',
      depth: 1,
      limit: 50,
    })
    return docs
  })
}

// --- Calendar ------------------------------------------------------------
// depth 2 embeds the event and its location (event title + location name shown).

export function getActiveEventDates() {
  return cachedQuery(['active-event-dates'], [TAGS.eventDates, TAGS.events, TAGS.locations], async (): Promise<EventDate[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'event-dates',
      where: { active: { equals: true } },
      sort: 'dateFrom',
      depth: 2,
      limit: 500,
    })
    return docs
  })
}

// --- Homepage feeds ------------------------------------------------------

const HOMEPAGE_HERO_MEDIA_ID = process.env.HOMEPAGE_HERO_MEDIA_ID
  ? Number(process.env.HOMEPAGE_HERO_MEDIA_ID)
  : null

export function getHomepageHeroMedia() {
  return cachedQuery(
    ['homepage-hero-media', String(HOMEPAGE_HERO_MEDIA_ID)],
    [TAGS.events],
    async (): Promise<Media | null> => {
      if (!HOMEPAGE_HERO_MEDIA_ID) return null
      const payload = await getPayloadClient()
      try {
        const doc = await payload.findByID({
          collection: 'media',
          id: HOMEPAGE_HERO_MEDIA_ID,
        })
        return doc as Media
      } catch {
        return null
      }
    },
  )
}

export function getProClimberGuides() {
  return cachedQuery(
    ['homepage-pro-climbers'],
    [TAGS.guides],
    async (): Promise<Guide[]> => {
      const payload = await getPayloadClient()
      const { docs } = await payload.find({
        collection: 'guides',
        where: {
          and: [
            { section: { equals: 'friends' } },
            { featured: { equals: true } },
            { active: { equals: true } },
          ],
        },
        sort: 'name',
        limit: 3,
      })
      return docs
    },
  )
}

export function getFounderGuide() {
  return cachedQuery(['homepage-founder'], [TAGS.guides], async (): Promise<Guide | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'guides',
      where: {
        and: [{ isFounder: { equals: true } }, { active: { equals: true } }],
      },
      limit: 1,
    })
    return docs[0] ?? null
  })
}

export function getHomepagePartners() {
  return cachedQuery(['homepage-partners'], [TAGS.events], async (): Promise<Partner[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'partners',
      where: {
        and: [{ featured: { equals: true } }, { active: { equals: true } }],
      },
      sort: 'name',
      limit: 5,
    })
    return docs
  })
}

export function getHomepageFAQs() {
  return cachedQuery(['homepage-faqs'], [TAGS.events], async (): Promise<Faq[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'faqs',
      where: {
        and: [
          { active: { equals: true } },
          { event: { exists: false } },
          { program: { exists: false } },
        ],
      },
      sort: 'position',
      limit: 6,
    })
    return docs
  })
}

export function getHomepageReviews() {
  return cachedQuery(['homepage-reviews'], [TAGS.events], async (): Promise<Review[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'reviews',
      where: {
        and: [
          { active: { equals: true } },
          { event: { exists: false } },
          { program: { exists: false } },
        ],
      },
      sort: 'position',
      limit: 3,
    })
    return docs
  })
}

export function getFeaturedEventsForHomepage() {
  return cachedQuery(
    ['homepage-featured-events'],
    [TAGS.events],
    async (): Promise<Event[]> => {
      const payload = await getPayloadClient()
      const { docs } = await payload.find({
        collection: 'events',
        where: {
          and: [
            { featured: { equals: true } },
            { state: { equals: 'published' } },
          ],
        },
        limit: 6,
        depth: 2,
      })
      return docs
    },
  )
}
