import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import {
  getFeaturedEventsForHomepage,
  getHomepageReviews,
} from '@/lib/queries'

describe('getFeaturedEventsForHomepage', () => {
  it('returns at most 6 published+featured events', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    // @ts-expect-error slug auto-filled by the slugField beforeValidate hook
    await payload.create({
      collection: 'events',
      data: {
        title: `Homepage Featured ${stamp}`,
        shortDescription: 'Used by getFeaturedEventsForHomepage test',
        state: 'published',
        featured: true,
      },
    })

    const events = await getFeaturedEventsForHomepage()
    expect(events.length).toBeGreaterThan(0)
    expect(events.length).toBeLessThanOrEqual(6)
    expect(events.every((e) => e.featured === true)).toBe(true)
    expect(events.every((e) => e.state === 'published')).toBe(true)
  })
})

describe('getHomepageReviews', () => {
  it('returns at most 3 active reviews that have no event or type relation', async () => {
    const payload = await getTestPayload()
    await payload.create({
      collection: 'reviews',
      data: {
        quote: `Top-quality coaching ${Date.now()}`,
        reviewerName: 'Test Reviewer',
        active: true,
        position: 10,
      },
    })

    const reviews = await getHomepageReviews()
    expect(reviews.length).toBeGreaterThan(0)
    expect(reviews.length).toBeLessThanOrEqual(3)
    expect(reviews.every((r) => r.active === true)).toBe(true)
    expect(reviews.every((r) => !r.event && !r.type)).toBe(true)
  })
})
