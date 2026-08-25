import { afterEach, describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import {
  resolveGuideGridGuides,
  resolveLocationGridLocations,
  resolveProgramGridPrograms,
  resolveReviewGridReviews,
} from '@/lib/block-resolvers/domain-grids'
import {
  resolveCalendarEventDates,
  resolveGuideProfileGuide,
  resolveGuideTripsEvents,
  resolvePartnerStripPartners,
  resolvePostGridPosts,
} from '@/lib/block-resolvers/content-discovery'

const trackedIds: Record<string, number[]> = {}

describe('domain grid block resolvers', () => {
  afterEach(async () => {
    const payload = await getTestPayload()

    for (const collection of [
      'reviews',
      'event-dates',
      'posts',
      'events',
      'programs',
      'post-categories',
      'partners',
      'locations',
      'guides',
    ]) {
      const ids = trackedIds[collection]
      if (!ids?.length) continue
      await payload.delete({ collection: collection as never, where: { id: { in: ids } } })
      trackedIds[collection] = []
    }
  })

  it('resolves manual programs to active published records only', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const published = await payload.create({
      collection: 'programs',
      data: {
        name: `Resolver Published Program ${stamp}`,
        slug: `resolver-published-program-${stamp}`,
        active: true,
        featured: true,
        state: 'published',
      },
    })
    track('programs', published.id)
    const draft = await payload.create({
      collection: 'programs',
      data: {
        name: `Resolver Draft Program ${stamp}`,
        slug: `resolver-draft-program-${stamp}`,
        active: true,
        state: 'draft',
      },
    })
    track('programs', draft.id)

    const programs = await resolveProgramGridPrograms({
      source: 'manual',
      programs: [published.id, draft.id],
      limit: 10,
    })

    expect(programs.map((program) => program.id)).toEqual([published.id])
  })

  it('resolves locations by country and filters inactive records', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const active = await payload.create({
      collection: 'locations',
      data: {
        name: `Resolver Active Location ${stamp}`,
        slug: `resolver-active-location-${stamp}`,
        country: 'Spain',
        active: true,
      },
    })
    track('locations', active.id)
    const inactive = await payload.create({
      collection: 'locations',
      data: {
        name: `Resolver Inactive Location ${stamp}`,
        slug: `resolver-inactive-location-${stamp}`,
        country: 'Spain',
        active: false,
      },
    })
    track('locations', inactive.id)

    const locations = await resolveLocationGridLocations({
      source: 'byCountry',
      country: 'Spain',
      limit: 10,
    })

    expect(locations.map((location) => location.id)).toContain(active.id)
    expect(locations.every((location) => location.active === true)).toBe(true)
    expect(locations.every((location) => location.country === 'Spain')).toBe(true)
  })

  it('resolves guides by section and filters inactive records', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const guide = await payload.create({
      collection: 'guides',
      data: {
        name: `Resolver Guide ${stamp}`,
        slug: `resolver-guide-${stamp}`,
        section: 'team',
        active: true,
      },
    })
    track('guides', guide.id)
    const inactive = await payload.create({
      collection: 'guides',
      data: {
        name: `Resolver Inactive Guide ${stamp}`,
        slug: `resolver-inactive-guide-${stamp}`,
        section: 'team',
        active: false,
      },
    })
    track('guides', inactive.id)

    const guides = await resolveGuideGridGuides({
      source: 'team',
      limit: 10,
    })

    expect(guides.map((item) => item.id)).toContain(guide.id)
    expect(guides.every((item) => item.active === true && item.section === 'team')).toBe(true)
  })

  it('resolves reviews by program and filters inactive records', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const program = await payload.create({
      collection: 'programs',
      data: {
        name: `Resolver Review Program ${stamp}`,
        slug: `resolver-review-program-${stamp}`,
        active: true,
        state: 'published',
      },
    })
    track('programs', program.id)
    const review = await payload.create({
      collection: 'reviews',
      data: {
        quote: `Resolver review quote ${stamp}`,
        reviewerName: 'Resolver Reviewer',
        program: program.id,
        active: true,
      },
    })
    track('reviews', review.id)
    const inactive = await payload.create({
      collection: 'reviews',
      data: {
        quote: `Inactive resolver review quote ${stamp}`,
        reviewerName: 'Inactive Resolver Reviewer',
        program: program.id,
        active: false,
      },
    })
    track('reviews', inactive.id)

    const reviews = await resolveReviewGridReviews({
      source: 'byProgram',
      program: program.id,
      limit: 10,
    })

    expect(reviews.map((item) => item.id)).toEqual([review.id])
  })

  it('resolves posts by category and filters draft posts', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const category = await payload.create({
      collection: 'post-categories',
      data: {
        name: `Resolver Blog Category ${stamp}`,
        slug: `resolver-blog-category-${stamp}`,
      },
    })
    track('post-categories', category.id)
    const published = await payload.create({
      collection: 'posts',
      data: {
        title: `Resolver Published Post ${stamp}`,
        slug: `resolver-published-post-${stamp}`,
        category: category.id,
        state: 'published',
        publishedAt: '2026-08-01T09:00:00.000Z',
      },
    })
    track('posts', published.id)
    const draft = await payload.create({
      collection: 'posts',
      data: {
        title: `Resolver Draft Post ${stamp}`,
        slug: `resolver-draft-post-${stamp}`,
        category: category.id,
        state: 'draft',
        publishedAt: '2026-08-02T09:00:00.000Z',
      },
    })
    track('posts', draft.id)

    const posts = await resolvePostGridPosts({
      source: 'byCategory',
      category: category.id,
      limit: 10,
    })

    expect(posts.map((post) => post.id)).toEqual([published.id])
  })

  it('resolves upcoming calendar dates and filters inactive or unpublished events', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const publishedEvent = await payload.create({
      collection: 'events',
      data: {
        title: `Resolver Calendar Event ${stamp}`,
        slug: `resolver-calendar-event-${stamp}`,
        state: 'published',
      },
    })
    track('events', publishedEvent.id)
    const draftEvent = await payload.create({
      collection: 'events',
      data: {
        title: `Resolver Draft Calendar Event ${stamp}`,
        slug: `resolver-draft-calendar-event-${stamp}`,
        state: 'draft',
      },
    })
    track('events', draftEvent.id)
    const activeDate = await payload.create({
      collection: 'event-dates',
      data: {
        event: publishedEvent.id,
        dateFrom: '2026-08-26T00:00:00.000Z',
        dateTo: '2026-08-30T00:00:00.000Z',
        price: 990,
        vat: 0,
        currency: 'EUR',
        capacity: 8,
        minParticipants: 2,
        active: true,
      },
    })
    track('event-dates', activeDate.id)
    const draftDate = await payload.create({
      collection: 'event-dates',
      data: {
        event: draftEvent.id,
        dateFrom: '2026-08-27T00:00:00.000Z',
        dateTo: '2026-08-31T00:00:00.000Z',
        price: 990,
        vat: 0,
        currency: 'EUR',
        capacity: 8,
        minParticipants: 2,
        active: true,
      },
    })
    track('event-dates', draftDate.id)

    const dates = await resolveCalendarEventDates({
      source: 'upcoming',
      now: new Date('2026-08-25T00:00:00.000Z'),
      limit: 10,
    })

    expect(dates.map((date) => date.id)).toContain(activeDate.id)
    expect(dates.every((date) => date.active === true)).toBe(true)
    expect(dates.every((date) => typeof date.event === 'object' && date.event.state === 'published')).toBe(true)
  })

  it('fills calendar dates even when earlier active dates belong to draft events', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const draftEvent = await payload.create({
      collection: 'events',
      data: {
        title: `Resolver Draft Calendar Noise ${stamp}`,
        slug: `resolver-draft-calendar-noise-${stamp}`,
        state: 'draft',
      },
    })
    track('events', draftEvent.id)
    const publishedEvent = await payload.create({
      collection: 'events',
      data: {
        title: `Resolver Published Calendar Fill ${stamp}`,
        slug: `resolver-published-calendar-fill-${stamp}`,
        state: 'published',
      },
    })
    track('events', publishedEvent.id)

    for (let index = 0; index < 4; index += 1) {
      const date = await payload.create({
        collection: 'event-dates',
        data: {
          event: draftEvent.id,
          dateFrom: `2028-01-0${index + 1}T00:00:00.000Z`,
          dateTo: `2028-01-0${index + 1}T12:00:00.000Z`,
          price: 990,
          vat: 0,
          currency: 'EUR',
          capacity: 8,
          minParticipants: 2,
          active: true,
        },
      })
      track('event-dates', date.id)
    }

    const firstPublishedDate = await payload.create({
      collection: 'event-dates',
      data: {
        event: publishedEvent.id,
        dateFrom: '2028-01-10T00:00:00.000Z',
        dateTo: '2028-01-17T00:00:00.000Z',
        price: 990,
        vat: 0,
        currency: 'EUR',
        capacity: 8,
        minParticipants: 2,
        active: true,
      },
    })
    track('event-dates', firstPublishedDate.id)
    const secondPublishedDate = await payload.create({
      collection: 'event-dates',
      data: {
        event: publishedEvent.id,
        dateFrom: '2028-01-18T00:00:00.000Z',
        dateTo: '2028-01-25T00:00:00.000Z',
        price: 990,
        vat: 0,
        currency: 'EUR',
        capacity: 8,
        minParticipants: 2,
        active: true,
      },
    })
    track('event-dates', secondPublishedDate.id)

    const dates = await resolveCalendarEventDates({
      source: 'upcoming',
      now: new Date('2028-01-01T00:00:00.000Z'),
      limit: 2,
    })

    expect(dates.map((date) => date.id)).toEqual([firstPublishedDate.id, secondPublishedDate.id])
  })

  it('resolves featured partners and filters inactive records', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const partner = await payload.create({
      collection: 'partners',
      data: {
        name: `Resolver Partner ${stamp}`,
        slug: `resolver-partner-${stamp}`,
        active: true,
        featured: true,
      },
    })
    track('partners', partner.id)
    const inactive = await payload.create({
      collection: 'partners',
      data: {
        name: `Resolver Inactive Partner ${stamp}`,
        slug: `resolver-inactive-partner-${stamp}`,
        active: false,
        featured: true,
      },
    })
    track('partners', inactive.id)

    const partners = await resolvePartnerStripPartners({
      source: 'featured',
      limit: 10,
    })

    expect(partners.map((item) => item.id)).toContain(partner.id)
    expect(partners.every((item) => item.active === true && item.featured === true)).toBe(true)
  })

  it('resolves a manual guide profile only when active', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const guide = await payload.create({
      collection: 'guides',
      data: {
        name: `Resolver Profile Guide ${stamp}`,
        slug: `resolver-profile-guide-${stamp}`,
        section: 'team',
        active: true,
      },
    })
    track('guides', guide.id)

    const resolved = await resolveGuideProfileGuide({
      source: 'manual',
      guide: guide.id,
    })

    expect(resolved?.id).toBe(guide.id)
  })

  it('resolves published events for a selected guide', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const guide = await payload.create({
      collection: 'guides',
      data: {
        name: `Resolver Trips Guide ${stamp}`,
        slug: `resolver-trips-guide-${stamp}`,
        section: 'team',
        active: true,
      },
    })
    track('guides', guide.id)
    const event = await payload.create({
      collection: 'events',
      data: {
        title: `Resolver Guide Trip ${stamp}`,
        slug: `resolver-guide-trip-${stamp}`,
        coaches: [guide.id],
        state: 'published',
      },
    })
    track('events', event.id)
    const draft = await payload.create({
      collection: 'events',
      data: {
        title: `Resolver Draft Guide Trip ${stamp}`,
        slug: `resolver-draft-guide-trip-${stamp}`,
        coaches: [guide.id],
        state: 'draft',
      },
    })
    track('events', draft.id)

    const events = await resolveGuideTripsEvents({
      source: 'byGuide',
      guide: guide.id,
      limit: 10,
    })

    expect(events.map((item) => item.id)).toEqual([event.id])
  })
})

function track(collection: string, id: number) {
  trackedIds[collection] = [...(trackedIds[collection] ?? []), id]
}
