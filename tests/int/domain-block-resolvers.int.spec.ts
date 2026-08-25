import { afterEach, describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import {
  resolveGuideGridGuides,
  resolveLocationGridLocations,
  resolveProgramGridPrograms,
  resolveReviewGridReviews,
} from '@/lib/block-resolvers/domain-grids'

describe('domain grid block resolvers', () => {
  afterEach(async () => {
    const payload = await getTestPayload()

    await payload.delete({
      collection: 'reviews',
      where: { reviewerName: { contains: 'Resolver Reviewer' } },
    })
    await payload.delete({
      collection: 'programs',
      where: { slug: { contains: 'resolver-' } },
    })
    await payload.delete({
      collection: 'locations',
      where: { slug: { contains: 'resolver-' } },
    })
    await payload.delete({
      collection: 'guides',
      where: { slug: { contains: 'resolver-' } },
    })
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
    const draft = await payload.create({
      collection: 'programs',
      data: {
        name: `Resolver Draft Program ${stamp}`,
        slug: `resolver-draft-program-${stamp}`,
        active: true,
        state: 'draft',
      },
    })

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
    await payload.create({
      collection: 'locations',
      data: {
        name: `Resolver Inactive Location ${stamp}`,
        slug: `resolver-inactive-location-${stamp}`,
        country: 'Spain',
        active: false,
      },
    })

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
    await payload.create({
      collection: 'guides',
      data: {
        name: `Resolver Inactive Guide ${stamp}`,
        slug: `resolver-inactive-guide-${stamp}`,
        section: 'team',
        active: false,
      },
    })

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
    const review = await payload.create({
      collection: 'reviews',
      data: {
        quote: `Resolver review quote ${stamp}`,
        reviewerName: 'Resolver Reviewer',
        program: program.id,
        active: true,
      },
    })
    await payload.create({
      collection: 'reviews',
      data: {
        quote: `Inactive resolver review quote ${stamp}`,
        reviewerName: 'Inactive Resolver Reviewer',
        program: program.id,
        active: false,
      },
    })

    const reviews = await resolveReviewGridReviews({
      source: 'byProgram',
      program: program.id,
      limit: 10,
    })

    expect(reviews.map((item) => item.id)).toEqual([review.id])
  })
})
