import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import {
  getFeaturedEventsForHomepage,
  getHomepageReviews,
  getHomepageFAQs,
  getHomepagePartners,
  getProClimberGuides,
  getFounderGuide,
} from '@/lib/queries'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const richText = (text: string): any => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', version: 1, text }],
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
})

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

describe('getHomepageFAQs', () => {
  it('returns up to 6 active FAQs with no event or type relation, sorted by position', async () => {
    const payload = await getTestPayload()
    await payload.create({
      collection: 'faqs',
      data: {
        question: `Where do you climb? ${Date.now()}`,
        answer: richText('We climb on the best European limestone.'),
        active: true,
        position: 5,
      },
    })

    const faqs = await getHomepageFAQs()
    expect(faqs.length).toBeGreaterThan(0)
    expect(faqs.length).toBeLessThanOrEqual(6)
    expect(faqs.every((f) => f.active === true)).toBe(true)
    expect(faqs.every((f) => !f.event && !f.type)).toBe(true)
  })
})

describe('getHomepagePartners', () => {
  it('returns up to 5 featured active partners sorted by name', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug auto-filled
    await payload.create({
      collection: 'partners',
      data: {
        name: `Aaa Partner ${Date.now()}`,
        featured: true,
        active: true,
      },
    })

    const partners = await getHomepagePartners()
    expect(partners.length).toBeGreaterThan(0)
    expect(partners.length).toBeLessThanOrEqual(5)
    expect(partners.every((p) => p.featured === true && p.active === true)).toBe(true)
  })
})

describe('getProClimberGuides', () => {
  it('returns up to 3 featured active friends-section guides sorted by name', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug auto-filled
    await payload.create({
      collection: 'guides',
      data: {
        name: `Pro Climber ${Date.now()}`,
        section: 'friends',
        featured: true,
        active: true,
      },
    })

    const guides = await getProClimberGuides()
    expect(guides.length).toBeGreaterThan(0)
    expect(guides.length).toBeLessThanOrEqual(3)
    expect(guides.every((g) => g.section === 'friends' && g.featured && g.active)).toBe(true)
  })
})

describe('getFounderGuide', () => {
  it('returns the single isFounder guide when one exists', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug auto-filled
    await payload.create({
      collection: 'guides',
      data: {
        name: `Test Founder ${Date.now()}`,
        section: 'team',
        active: true,
        isFounder: true,
      },
    })

    const founder = await getFounderGuide()
    expect(founder).not.toBeNull()
    expect(founder?.isFounder).toBe(true)
    expect(founder?.active).toBe(true)
  })
})
