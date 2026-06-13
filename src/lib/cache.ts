import { revalidateTag, unstable_cache } from 'next/cache'

/**
 * Cache tags, one per in-scope catalogue collection. Single source of truth —
 * imported by both the cached queries (src/lib/queries.ts) and the collection
 * revalidate hooks (src/collections/hooks/revalidate.ts).
 */
export const TAGS = {
  guides: 'guides',
  locations: 'locations',
  events: 'events',
  eventDates: 'event-dates',
  posts: 'posts',
  postCategories: 'post-categories',
} as const

export type CacheTag = (typeof TAGS)[keyof typeof TAGS]

const isProd = (): boolean => process.env.NODE_ENV === 'production'

/**
 * Wraps a data-fetching fn in Next's tag-based cache — but ONLY in production.
 * In dev/test the fn is called directly so pages always reflect fresh DB state
 * (the e2e suite creates fixtures from a separate process whose mutations the
 * dev-server cache would never see; caching there would cause false failures).
 *
 * `keyParts` must include any dynamic args (slug/id) so each variant caches
 * separately. The fn must return JSON-serializable data (Payload local-API
 * docs are) and must NOT call notFound()/redirect() — do that at the page
 * level based on a null return.
 */
export function cachedQuery<T>(
  keyParts: string[],
  tags: CacheTag[],
  fn: () => Promise<T>,
): Promise<T> {
  if (!isProd()) return fn()
  return unstable_cache(fn, keyParts, { tags })()
}

/**
 * revalidateTag that no-ops outside production and never throws. Payload hooks
 * fire from seed scripts and e2e/int fixtures (plain Node, no request scope)
 * where revalidateTag would throw; this swallows that.
 */
export function safeRevalidateTag(tag: CacheTag): void {
  if (!isProd()) return
  try {
    revalidateTag(tag)
  } catch (err) {
    console.warn(`[revalidate] revalidateTag(${tag}) failed:`, err)
  }
}
