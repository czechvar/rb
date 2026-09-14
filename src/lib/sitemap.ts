import type { MetadataRoute } from 'next'
import type { Where } from 'payload'

import { siteUrl } from '@/lib/url'

type SitemapDoc = {
  id?: number | string
  slug?: string | null
  updatedAt?: string | null
  category?: number | string | SitemapDoc | null
  event?: number | string | SitemapDoc | null
  active?: boolean | null
  indexable?: boolean | null
  state?: string | null
}

type SitemapCollection =
  | 'event-dates'
  | 'locations'
  | 'guides'
  | 'programs'
  | 'posts'
  | 'pages'

type SitemapPayload = {
  find(args: {
    collection: SitemapCollection
    where?: Where
    sort?: string
    limit: number
    depth: number
    pagination?: boolean
    page?: number
  }): Promise<{ docs: SitemapDoc[]; hasNextPage?: boolean }>
}

const STATIC_PATHS = ['/', '/trips', '/programs', '/destinations', '/team', '/blog', '/calendar']
const PAGE_SIZE = 100

function sitemapEntry(pathname: string, updatedAt?: string | null): MetadataRoute.Sitemap[number] {
  return {
    url: siteUrl(pathname),
    ...(updatedAt ? { lastModified: new Date(updatedAt) } : {}),
  }
}

function entriesForDocs(
  docs: SitemapDoc[],
  pathForSlug: (slug: string) => string | string[],
): MetadataRoute.Sitemap {
  return docs.flatMap((doc) => {
    if (!doc.slug) return []
    const paths = pathForSlug(doc.slug)
    return (Array.isArray(paths) ? paths : [paths]).map((path) => sitemapEntry(path, doc.updatedAt))
  })
}

function entriesForCmsPages(docs: SitemapDoc[]): MetadataRoute.Sitemap {
  return entriesForDocs(
    docs.filter((doc) => doc.slug !== 'home' && doc.slug !== 'trips'),
    (slug) => slug === 'contact' ? '/contact' : `/cms-pages/${slug}`,
  )
}

function entriesForPostCategories(posts: SitemapDoc[]): MetadataRoute.Sitemap {
  return uniqueEntries(
    posts.flatMap((post) => {
      if (!post.category || typeof post.category !== 'object' || !post.category.slug) return []
      return [sitemapEntry(`/blog/category/${post.category.slug}`, post.category.updatedAt ?? post.updatedAt)]
    }),
  )
}

function uniqueEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>()
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false
    seen.add(entry.url)
    return true
  })
}

async function findAll(
  payload: SitemapPayload,
  args: Omit<Parameters<SitemapPayload['find']>[0], 'limit' | 'page' | 'pagination'>,
): Promise<SitemapDoc[]> {
  const docs: SitemapDoc[] = []
  let page = 1
  while (true) {
    const result = await payload.find({ ...args, limit: PAGE_SIZE, page, pagination: true })
    docs.push(...result.docs)
    if (!result.hasNextPage) return docs
    page += 1
  }
}

function latestTimestamp(...values: Array<string | null | undefined>): string | undefined {
  const valid = values.filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value!)))
  return valid.sort((left, right) => Date.parse(right) - Date.parse(left))[0]
}

function entriesForOccurrences(docs: SitemapDoc[]): MetadataRoute.Sitemap {
  return docs.flatMap((occurrence) => {
    const event = typeof occurrence.event === 'object' && occurrence.event ? occurrence.event : null
    if (
      occurrence.active !== true || occurrence.indexable === false || !occurrence.slug ||
      !event?.slug || event.state !== 'published'
    ) return []
    return [sitemapEntry(
      `/trips/${event.slug}/${occurrence.slug}`,
      latestTimestamp(occurrence.updatedAt, event.updatedAt),
    )]
  })
}

export async function buildSitemap(payload: SitemapPayload): Promise<MetadataRoute.Sitemap> {
  const [occurrences, locations, guides, programs, posts, pages] = await Promise.all([
    findAll(payload, {
      collection: 'event-dates',
      where: { and: [{ active: { equals: true } }, { indexable: { not_equals: false } }] },
      sort: 'slug',
      depth: 1,
    }),
    findAll(payload, {
      collection: 'locations',
      where: { active: { equals: true } },
      sort: 'slug',
      depth: 0,
    }),
    findAll(payload, {
      collection: 'guides',
      where: { active: { equals: true } },
      sort: 'slug',
      depth: 0,
    }),
    findAll(payload, {
      collection: 'programs',
      where: { and: [{ state: { equals: 'published' } }, { active: { equals: true } }] },
      sort: 'slug',
      depth: 0,
    }),
    findAll(payload, {
      collection: 'posts',
      where: { state: { equals: 'published' } },
      sort: 'slug',
      depth: 1,
    }),
    findAll(payload, {
      collection: 'pages',
      where: { status: { equals: 'published' } },
      sort: 'slug',
      depth: 0,
    }),
  ])

  return uniqueEntries([
    ...STATIC_PATHS.map((path) => sitemapEntry(path)),
    ...entriesForOccurrences(occurrences),
    ...entriesForDocs(locations, (slug) => `/destinations/${slug}`),
    ...entriesForDocs(guides, (slug) => `/team/${slug}`),
    ...entriesForDocs(programs, (slug) => `/programs/${slug}`),
    ...entriesForDocs(posts, (slug) => `/blog/${slug}`),
    ...entriesForPostCategories(posts),
    ...entriesForCmsPages(pages),
  ])
}

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
    sitemap: siteUrl('/sitemap.xml'),
  }
}
