import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildRobots, buildSitemap } from '@/lib/sitemap'

const docsByCollection = {
  events: [
    { slug: 'kalymnos-camp', updatedAt: '2026-01-02T03:04:05.000Z' },
    { slug: null, updatedAt: '2026-01-03T03:04:05.000Z' },
  ],
  locations: [{ slug: 'kalymnos', updatedAt: '2026-01-04T03:04:05.000Z' }],
  guides: [{ slug: 'jany', updatedAt: '2026-01-05T03:04:05.000Z' }],
  programs: [{ slug: 'performance-lab', updatedAt: '2026-01-06T03:04:05.000Z' }],
  posts: [
    {
      slug: 'training-plan',
      updatedAt: '2026-01-07T03:04:05.000Z',
      category: { slug: 'training', updatedAt: '2026-01-08T03:04:05.000Z' },
    },
    {
      slug: 'technique-drills',
      updatedAt: '2026-01-09T03:04:05.000Z',
      category: { slug: 'training', updatedAt: '2026-01-08T03:04:05.000Z' },
    },
    { slug: 'uncategorized', updatedAt: '2026-01-10T03:04:05.000Z', category: null },
  ],
  pages: [
    { slug: 'about-us', updatedAt: '2026-01-09T03:04:05.000Z' },
    { slug: 'home', updatedAt: '2026-01-10T03:04:05.000Z' },
  ],
} as const

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
})

describe('buildSitemap', () => {
  it('returns static and public Payload-backed URLs', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net/'

    const find = vi.fn(async ({ collection }: { collection: keyof typeof docsByCollection }) => ({
      docs: [...docsByCollection[collection]],
    }))

    const sitemap = await buildSitemap({ find })
    const urls = sitemap.map((entry) => entry.url)

    expect(urls).toEqual([
      'https://rockbusters.net/',
      'https://rockbusters.net/programs',
      'https://rockbusters.net/destinations',
      'https://rockbusters.net/team',
      'https://rockbusters.net/blog',
      'https://rockbusters.net/calendar',
      'https://rockbusters.net/trips/kalymnos-camp',
      'https://rockbusters.net/trips/kalymnos-camp/dates',
      'https://rockbusters.net/trips/kalymnos-camp/faq',
      'https://rockbusters.net/trips/kalymnos-camp/logistics',
      'https://rockbusters.net/destinations/kalymnos',
      'https://rockbusters.net/team/jany',
      'https://rockbusters.net/programs/performance-lab',
      'https://rockbusters.net/blog/training-plan',
      'https://rockbusters.net/blog/technique-drills',
      'https://rockbusters.net/blog/uncategorized',
      'https://rockbusters.net/blog/category/training',
      'https://rockbusters.net/cms-pages/about-us',
    ])
    expect(urls).not.toContain('https://rockbusters.net/trips')
    expect(urls).not.toContain('https://rockbusters.net/cms-pages/home')
    expect(sitemap.find((entry) => entry.url.endsWith('/trips/kalymnos-camp'))?.lastModified).toEqual(
      new Date('2026-01-02T03:04:05.000Z'),
    )
  })

  it('queries only indexable collection states', async () => {
    const find = vi.fn(async ({ collection }: { collection: keyof typeof docsByCollection }) => ({
      docs: [...docsByCollection[collection]],
    }))

    await buildSitemap({ find })

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'events',
        where: { state: { equals: 'published' } },
        depth: 0,
        pagination: false,
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'locations',
        where: { active: { equals: true } },
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'guides',
        where: { active: { equals: true } },
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'programs',
        where: { and: [{ state: { equals: 'published' } }, { active: { equals: true } }] },
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'posts',
        where: { state: { equals: 'published' } },
        depth: 1,
      }),
    )
    expect(find).not.toHaveBeenCalledWith(expect.objectContaining({ collection: 'post-categories' }))
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        where: { status: { equals: 'published' } },
      }),
    )
  })
})

describe('buildRobots', () => {
  it('points crawlers at the canonical sitemap and disallows all crawling', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net/'

    expect(buildRobots()).toEqual({
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
      sitemap: 'https://rockbusters.net/sitemap.xml',
    })
  })
})
