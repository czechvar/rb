import type { MetadataRoute } from 'next'
import type { Where } from 'payload'

import { siteUrl } from '@/lib/url'
import { tripVariantPath } from '@/lib/occurrence-routing'
import { catalogueDateFloor, eventDateLifecycle } from '@/lib/event-date-visibility'
import { isIndexableContentOnlyParentTrip, isIndexableParentTrip } from '@/lib/parent-trip-layout'

type SitemapDoc = {
  id?: number | string
  slug?: string | null
  updatedAt?: string | null
  category?: number | string | SitemapDoc | null
  event?: number | string | SitemapDoc | null
  tripVariant?: number | string | SitemapDoc | null
  publicDateKey?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  active?: boolean | null
  indexable?: boolean | null
  state?: string | null
  content?: unknown
}

type SitemapCollection =
  | 'events'
  | 'event-dates'
  | 'trip-variants'
  | 'locations'
  | 'guides'
  | 'programs'
  | 'posts'
  | 'post-categories'
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
const LEGACY_BLOG_CATEGORY_SLUGS = ['bouldering', 'video']
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
    (slug) => `/${slug}`,
  )
}

function entriesForPostCategories(posts: SitemapDoc[], legacyCategories: SitemapDoc[]): MetadataRoute.Sitemap {
  const categoriesWithPosts = posts.flatMap((post) => {
    if (!post.category || typeof post.category !== 'object' || !post.category.slug) return []
    return [sitemapEntry(`/blog/category/${post.category.slug}`, post.category.updatedAt ?? post.updatedAt)]
  })
  return uniqueEntries([
    ...categoriesWithPosts,
    ...entriesForDocs(legacyCategories, (slug) => `/blog/category/${slug}`),
  ])
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
      occurrence.active !== true || occurrence.indexable === false ||
      !event?.slug || event.state !== 'published'
    ) return []
    const variant = typeof occurrence.tripVariant === 'object' && occurrence.tripVariant ? occurrence.tripVariant : null
    if (variant) {
      if (!variant.slug || variant.active !== true || variant.indexable !== true || !occurrence.publicDateKey ||
        !occurrence.dateFrom || !occurrence.dateTo ||
        !['upcoming', 'in-progress'].includes(eventDateLifecycle({ dateFrom: occurrence.dateFrom, dateTo: occurrence.dateTo }))) return []
      return [sitemapEntry(
        tripVariantPath(event.slug, variant.slug, occurrence.publicDateKey),
        latestTimestamp(occurrence.updatedAt, variant.updatedAt, event.updatedAt),
      )]
    }
    return []
  })
}

function entriesForVariants(docs: SitemapDoc[]): MetadataRoute.Sitemap {
  return docs.flatMap((variant) => {
    const event = typeof variant.event === 'object' && variant.event ? variant.event : null
    if (!variant.slug || variant.active !== true || variant.indexable !== true || !event?.slug || event.state !== 'published') return []
    return [sitemapEntry(tripVariantPath(event.slug, variant.slug), latestTimestamp(variant.updatedAt, event.updatedAt))]
  })
}

function entriesForParentTrips(variants: SitemapDoc[]): MetadataRoute.Sitemap {
  const byEvent = new Map<string, SitemapDoc[]>()
  for (const variant of variants) {
    const event = typeof variant.event === 'object' && variant.event ? variant.event : null
    if (!event?.slug || event.state !== 'published' || variant.active !== true) continue
    byEvent.set(event.slug, [...(byEvent.get(event.slug) ?? []), variant])
  }
  return [...byEvent].flatMap(([slug, ownVariants]) => {
    const event = ownVariants[0].event as SitemapDoc
    if (!isIndexableParentTrip(event.content, ownVariants.map(variant => ({
      active: variant.active === true, indexable: variant.indexable === true,
    })), slug)) return []
    return [sitemapEntry(`/trips/${slug}`, latestTimestamp(event.updatedAt,
      ...ownVariants.map(variant => variant.updatedAt)))]
  })
}

function entriesForContentOnlyParentTrips(events: SitemapDoc[], variants: SitemapDoc[], currentDates: SitemapDoc[]): MetadataRoute.Sitemap {
  const variantEvents = new Set(variants.flatMap(variant => {
    const event = typeof variant.event === 'object' && variant.event ? variant.event : null
    return variant.active === true && event?.id != null ? [String(event.id)] : []
  }))
  const datedEvents = new Set(currentDates.flatMap(date => {
    const event = typeof date.event === 'object' && date.event ? date.event : null
    return date.active === true && event?.id != null ? [String(event.id)] : []
  }))
  return events.flatMap(event => {
    if (!event.slug || event.id == null || event.state !== 'published') return []
    if (!isIndexableContentOnlyParentTrip(event.content,
      Number(variantEvents.has(String(event.id))), Number(datedEvents.has(String(event.id))), event.slug)) return []
    return [sitemapEntry(`/trips/${event.slug}`, event.updatedAt)]
  })
}

export async function buildSitemap(payload: SitemapPayload): Promise<MetadataRoute.Sitemap> {
  const [events, occurrences, currentDates, variants, locations, guides, programs, posts, legacyCategories, pages] = await Promise.all([
    findAll(payload, {
      collection: 'events',
      where: { state: { equals: 'published' } },
      sort: 'slug',
      depth: 0,
    }),
    findAll(payload, {
      collection: 'event-dates',
      where: { and: [{ active: { equals: true } }, { indexable: { not_equals: false } }] },
      sort: 'slug',
      depth: 2,
    }),
    findAll(payload, {
      collection: 'event-dates',
      where: { and: [{ active: { equals: true } }, { dateTo: { greater_than_equal: catalogueDateFloor() } }] },
      sort: 'dateTo',
      depth: 1,
    }),
    findAll(payload, {
      collection: 'trip-variants',
      // Parent hub approvals can index an Event while its Variants remain thin.
      where: { active: { equals: true } },
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
      collection: 'post-categories',
      where: { slug: { in: LEGACY_BLOG_CATEGORY_SLUGS } },
      sort: 'slug',
      depth: 0,
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
    ...entriesForVariants(variants),
    ...entriesForParentTrips(variants),
    ...entriesForContentOnlyParentTrips(events, variants, currentDates),
    ...entriesForDocs(locations, (slug) => `/destinations/${slug}`),
    ...entriesForDocs(guides, (slug) => `/team/${slug}`),
    ...entriesForDocs(programs, (slug) => `/programs/${slug}`),
    ...entriesForDocs(posts, (slug) => `/blog/${slug}`),
    ...entriesForPostCategories(posts, legacyCategories),
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
