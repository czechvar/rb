import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildRobots, buildSitemap } from '@/lib/sitemap'

const publishedEvent = {
  id: 10,
  slug: 'kalymnos-camp',
  state: 'published',
  updatedAt: '2026-01-08T03:04:05.000Z',
}

const indexableVariant = {
  slug: 'kalymnos', active: true, indexable: true,
  updatedAt: '2026-01-09T03:04:05.000Z', event: publishedEvent,
}

const docsByCollection = {
  'event-dates': [
    {
      slug: 'kalymnos-2026-10-12', active: true, indexable: true,
      dateFrom: '2026-10-12', dateTo: '2026-10-19',
      updatedAt: '2026-01-02T03:04:05.000Z', event: publishedEvent,
      tripVariant: indexableVariant, publicDateKey: '2026-10-12-to-2026-10-19',
    },
    {
      slug: 'kalymnos-2020-10-12', active: true, indexable: true,
      dateFrom: '2020-10-12', dateTo: '2020-10-19',
      updatedAt: '2026-02-02T03:04:05.000Z', event: publishedEvent,
    },
    { slug: 'thin', active: true, indexable: false, event: publishedEvent },
    { slug: 'draft-parent', active: true, indexable: true, event: { ...publishedEvent, state: 'draft' } },
  ],
  'trip-variants': [indexableVariant, { ...indexableVariant, slug: 'thin', indexable: false }],
  locations: [{ slug: 'kalymnos', updatedAt: '2026-01-04T03:04:05.000Z' }],
  guides: [{ slug: 'jany', updatedAt: '2026-01-05T03:04:05.000Z' }],
  programs: [{ slug: 'performance-lab', updatedAt: '2026-01-06T03:04:05.000Z' }],
  posts: [
    { slug: 'training-plan', updatedAt: '2026-01-07T03:04:05.000Z', category: { slug: 'training', updatedAt: '2026-01-08T03:04:05.000Z' } },
  ],
  pages: [
    { slug: 'contact', updatedAt: '2026-09-12T00:00:00.000Z' },
    { slug: 'about-us', updatedAt: '2026-01-09T03:04:05.000Z' },
    { slug: 'home', updatedAt: '2026-01-10T03:04:05.000Z' },
    { slug: 'trips', updatedAt: '2026-01-11T03:04:05.000Z' },
  ],
} as const

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
})

describe('buildSitemap', () => {
  it('publishes indexable evergreen variants and dated leaves without legacy archive URLs', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net/'
    const find = vi.fn(async ({ collection }: { collection: keyof typeof docsByCollection }) => ({
      docs: [...docsByCollection[collection]], hasNextPage: false,
    }))

    const sitemap = await buildSitemap({ find })
    const urls = sitemap.map((entry) => entry.url)

    expect(urls).toContain('https://rockbusters.net/trips/kalymnos-camp/kalymnos')
    expect(urls).toContain('https://rockbusters.net/trips/kalymnos-camp/kalymnos?date=2026-10-12-to-2026-10-19')
    expect(urls).not.toContain('https://rockbusters.net/trips/kalymnos-camp/kalymnos-2026-10-12')
    expect(urls).not.toContain('https://rockbusters.net/trips/kalymnos-camp/kalymnos-2020-10-12')
    expect(urls).not.toContain('https://rockbusters.net/trips/kalymnos-camp')
    expect(urls).not.toContain('https://rockbusters.net/trips/kalymnos-camp/dates')
    expect(urls).not.toContain('https://rockbusters.net/trips/kalymnos-camp/faq')
    expect(urls).not.toContain('https://rockbusters.net/trips/kalymnos-camp/logistics')
    expect(urls).not.toContain('https://rockbusters.net/trips/kalymnos-camp/thin')
    expect(urls).not.toContain('https://rockbusters.net/trips/kalymnos-camp/draft-parent')
    expect(sitemap.find((entry) => entry.url.endsWith('2026-10-12-to-2026-10-19'))?.lastModified)
      .toEqual(new Date('2026-01-09T03:04:05.000Z'))
    expect(urls).toEqual(expect.arrayContaining([
      'https://rockbusters.net/', 'https://rockbusters.net/trips',
      'https://rockbusters.net/destinations/kalymnos', 'https://rockbusters.net/team/jany',
      'https://rockbusters.net/programs/performance-lab', 'https://rockbusters.net/blog/training-plan',
      'https://rockbusters.net/blog/category/training', 'https://rockbusters.net/contact',
      'https://rockbusters.net/cms-pages/about-us',
    ]))
  })

  it('queries the public occurrence policy and paginates every collection to exhaustion', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net/'
    const second = {
      ...docsByCollection['event-dates'][0],
      slug: 'kalymnos-2027-10-12',
      publicDateKey: '2027-10-12-to-2027-10-19',
      updatedAt: '2027-01-01T00:00:00.000Z',
    }
    const find = vi.fn(async ({ collection, page }: { collection: keyof typeof docsByCollection; page?: number }) => {
      if (collection === 'event-dates') {
        return page === 1
          ? { docs: [docsByCollection['event-dates'][0]], hasNextPage: true }
          : { docs: [second], hasNextPage: false }
      }
      return { docs: page === 1 ? [...docsByCollection[collection]] : [], hasNextPage: false }
    })

    const urls = (await buildSitemap({ find })).map((entry) => entry.url)
    expect(urls).toContain('https://rockbusters.net/trips/kalymnos-camp/kalymnos?date=2026-10-12-to-2026-10-19')
    expect(urls).toContain('https://rockbusters.net/trips/kalymnos-camp/kalymnos?date=2027-10-12-to-2027-10-19')
    expect(find).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'event-dates',
      where: { and: [{ active: { equals: true } }, { indexable: { not_equals: false } }] },
      depth: 2,
      page: 1,
      pagination: true,
    }))
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'event-dates', page: 2 }))
    for (const collection of Object.keys(docsByCollection)) {
      expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection, page: 1, pagination: true }))
    }
  })
})

describe('buildRobots', () => {
  it('points crawlers at the canonical sitemap and disallows all crawling', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net/'
    expect(buildRobots()).toEqual({
      rules: [{ userAgent: '*', disallow: '/' }],
      sitemap: 'https://rockbusters.net/sitemap.xml',
    })
  })
})
