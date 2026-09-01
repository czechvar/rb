import type { MetadataRoute } from 'next'
import type { Where } from 'payload'

import { siteUrl } from '@/lib/url'

type SitemapDoc = {
  slug?: string | null
  updatedAt?: string | null
  category?: number | string | SitemapDoc | null
}

type SitemapCollection =
  | 'events'
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
  }): Promise<{ docs: SitemapDoc[] }>
}

const STATIC_PATHS = ['/', '/programs', '/destinations', '/team', '/blog', '/calendar']
const TRIP_SUBPATHS = ['', '/dates', '/faq', '/logistics']

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
    docs.filter((doc) => doc.slug !== 'home'),
    (slug) => `/cms-pages/${slug}`,
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

export async function buildSitemap(payload: SitemapPayload): Promise<MetadataRoute.Sitemap> {
  const [events, locations, guides, programs, posts, pages] = await Promise.all([
    payload.find({
      collection: 'events',
      where: { state: { equals: 'published' } },
      sort: 'slug',
      limit: 1000,
      depth: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'locations',
      where: { active: { equals: true } },
      sort: 'slug',
      limit: 1000,
      depth: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'guides',
      where: { active: { equals: true } },
      sort: 'slug',
      limit: 1000,
      depth: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'programs',
      where: { and: [{ state: { equals: 'published' } }, { active: { equals: true } }] },
      sort: 'slug',
      limit: 1000,
      depth: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'posts',
      where: { state: { equals: 'published' } },
      sort: 'slug',
      limit: 1000,
      depth: 1,
      pagination: false,
    }),
    payload.find({
      collection: 'pages',
      where: { status: { equals: 'published' } },
      sort: 'slug',
      limit: 1000,
      depth: 0,
      pagination: false,
    }),
  ])

  return uniqueEntries([
    ...STATIC_PATHS.map((path) => sitemapEntry(path)),
    ...entriesForDocs(events.docs, (slug) => TRIP_SUBPATHS.map((subpath) => `/trips/${slug}${subpath}`)),
    ...entriesForDocs(locations.docs, (slug) => `/destinations/${slug}`),
    ...entriesForDocs(guides.docs, (slug) => `/team/${slug}`),
    ...entriesForDocs(programs.docs, (slug) => `/programs/${slug}`),
    ...entriesForDocs(posts.docs, (slug) => `/blog/${slug}`),
    ...entriesForPostCategories(posts.docs),
    ...entriesForCmsPages(pages.docs),
  ])
}

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/account',
          '/book',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/design-system',
          '/my-route',
        ],
      },
    ],
    sitemap: siteUrl('/sitemap.xml'),
  }
}
