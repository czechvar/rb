# On-demand Revalidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make admin edits to core-catalogue content appear on the live (production) static pages without a redeploy, via Next.js cache tags + `revalidateTag` fired from Payload collection hooks.

**Architecture:** Each catalogue page's data query is wrapped in a cached function (`cachedQuery`) that declares every in-scope collection whose data it embeds — including relations pulled in via `depth` — as cache tags. Caching is applied **only in production** (dev/test call straight through, so the e2e suite and local dev always see fresh data). Each of the six core collections gets one-line `afterChange`/`afterDelete` hooks that call `safeRevalidateTag(<its tag>)`. Because each query is tagged by the collections it embeds, a single per-collection tag revalidation refreshes every page that depends on it — no per-relationship logic in any hook.

**Tech Stack:** Next.js 16.2.6 (App Router, `unstable_cache`/`revalidateTag` from `next/cache`), Payload 3.84.1 (embedded), TypeScript, vitest (int suite, `tests/int/**/*.int.spec.ts`, jsdom).

**Source spec:** `docs/superpowers/specs/2026-06-13-on-demand-revalidation-design.md`

---

## Prerequisites & ordering notes

- **Tasks 1–8 need no database.** The new vitest specs are DB-free (they mock `next/cache` and `@/lib/cache`); `tsc` and `eslint` need no DB. So implementation can proceed before the Neon `dev`/`test` branch work lands.
- **Task 9 (full verification) depends on the DB-split work:** the full `pnpm test:int` suite needs the refreshed `.env.test` test branch, and `pnpm test:e2e` must run against the local `.env` **`dev`** branch — never production. Do not run e2e until `.env` is repointed off `ep-weathered-pine-alvc3sdj`.
- **Production verification** (editing content in the live admin and confirming the page updates without redeploy) is the only check for the prod-only caching path — do it in the Claude CLI session that has Vercel/Neon access.

## File structure

| File | Responsibility | Action |
|---|---|---|
| `src/lib/cache.ts` | Tag constants (`TAGS`), `cachedQuery` (prod-only `unstable_cache` wrapper), `safeRevalidateTag` (prod-only, never-throws) | Create |
| `src/lib/queries.ts` | One cached, tagged function per catalogue query; replaces inline `payload.find` in pages | Create |
| `src/collections/hooks/revalidate.ts` | `revalidateOnChange(tag)` factory → `{ afterChange, afterDelete }` | Create |
| `tests/int/cache.int.spec.ts` | Unit tests for `cachedQuery` + `safeRevalidateTag` gating | Create |
| `tests/int/revalidate-hook.int.spec.ts` | Unit tests for the hook factory | Create |
| `tests/int/queries.int.spec.ts` | Table-driven assertions that each query wires the right keyParts + tags | Create |
| `src/collections/{Guides,Locations,Events,EventDates,Posts,PostCategories}.ts` | Add `hooks: revalidateOnChange(TAGS.x)` | Modify |
| 14 catalogue pages under `src/app/(frontend)/` | Swap inline finds for `queries.ts` imports | Modify |

**Scope:** core catalogue only — `guides`, `locations`, `events`, `event-dates`, `posts`, `post-categories`. Reviews/FAQs/Types/Partners queries stay as direct (uncached) `payload.find` calls; those pages still refresh whenever an in-scope tag regenerates them, but edits to those out-of-scope collections won't independently trigger a refresh. Account/booking pages are untouched (dynamic, auth-gated).

---

## Task 1: Cache helper (`src/lib/cache.ts`)

**Files:**
- Create: `src/lib/cache.ts`
- Test: `tests/int/cache.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/cache.int.spec.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

// vi.mock is hoisted above the file, so any fns its factory references must be
// created via vi.hoisted (which is hoisted with it).
const { revalidateTag, unstableCache } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  // unstable_cache(fn, keyParts, opts) returns a fn that, when called, runs fn.
  unstableCache: vi.fn(
    (fn: (...a: unknown[]) => unknown) =>
      (...a: unknown[]) =>
        fn(...a),
  ),
}))

vi.mock('next/cache', () => ({
  revalidateTag,
  unstable_cache: unstableCache,
}))

import { cachedQuery, safeRevalidateTag, TAGS } from '@/lib/cache'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('safeRevalidateTag', () => {
  it('calls revalidateTag in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    safeRevalidateTag(TAGS.guides)
    expect(revalidateTag).toHaveBeenCalledWith('guides')
  })

  it('is a no-op outside production', () => {
    vi.stubEnv('NODE_ENV', 'test')
    safeRevalidateTag(TAGS.guides)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('swallows revalidateTag errors in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    revalidateTag.mockImplementationOnce(() => {
      throw new Error('static generation store missing')
    })
    expect(() => safeRevalidateTag(TAGS.events)).not.toThrow()
  })
})

describe('cachedQuery', () => {
  it('calls fn directly and skips unstable_cache outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const fn = vi.fn(async () => 42)
    const result = await cachedQuery(['k'], [TAGS.guides], fn)
    expect(result).toBe(42)
    expect(fn).toHaveBeenCalledOnce()
    expect(unstableCache).not.toHaveBeenCalled()
  })

  it('wraps fn in unstable_cache with keyParts and tags in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const fn = vi.fn(async () => 7)
    const result = await cachedQuery(['guide-by-slug', 'x'], [TAGS.guides], fn)
    expect(unstableCache).toHaveBeenCalledWith(fn, ['guide-by-slug', 'x'], {
      tags: ['guides'],
    })
    expect(result).toBe(7)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/int/cache.int.spec.ts`
Expected: FAIL — cannot resolve `@/lib/cache` / `cachedQuery is not a function`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/cache.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/int/cache.int.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cache.ts tests/int/cache.int.spec.ts
git commit -m "feat(cache): prod-only cachedQuery + safeRevalidateTag helpers

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: Revalidate hook factory (`src/collections/hooks/revalidate.ts`)

**Files:**
- Create: `src/collections/hooks/revalidate.ts`
- Test: `tests/int/revalidate-hook.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/revalidate-hook.int.spec.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }))
vi.mock('next/cache', () => ({
  revalidateTag,
  unstable_cache: (fn: unknown) => fn,
}))

import { revalidateOnChange } from '@/collections/hooks/revalidate'
import { TAGS } from '@/lib/cache'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('revalidateOnChange', () => {
  it('returns one afterChange and one afterDelete hook', () => {
    const hooks = revalidateOnChange(TAGS.guides)
    expect(hooks.afterChange).toHaveLength(1)
    expect(hooks.afterDelete).toHaveLength(1)
  })

  it('afterChange revalidates the tag in production and returns the doc', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const hooks = revalidateOnChange(TAGS.events)
    const doc = { id: 1 }
    const out = hooks.afterChange[0]({ doc } as never)
    expect(revalidateTag).toHaveBeenCalledWith('events')
    expect(out).toBe(doc)
  })

  it('afterDelete revalidates the tag in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const hooks = revalidateOnChange(TAGS.posts)
    hooks.afterDelete[0]({ doc: { id: 2 } } as never)
    expect(revalidateTag).toHaveBeenCalledWith('posts')
  })

  it('is a no-op outside production', () => {
    vi.stubEnv('NODE_ENV', 'test')
    const hooks = revalidateOnChange(TAGS.locations)
    hooks.afterChange[0]({ doc: {} } as never)
    hooks.afterDelete[0]({ doc: {} } as never)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/int/revalidate-hook.int.spec.ts`
Expected: FAIL — cannot resolve `@/collections/hooks/revalidate`.

- [ ] **Step 3: Write the implementation**

Create `src/collections/hooks/revalidate.ts`:

```ts
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'
import { safeRevalidateTag, type CacheTag } from '@/lib/cache'

/**
 * afterChange + afterDelete hooks that revalidate a single cache tag.
 * Wire into a collection config: `hooks: revalidateOnChange(TAGS.guides)`.
 * safeRevalidateTag is a no-op outside production, so seed/test mutations
 * (which run outside a Next request scope) are safe.
 */
export function revalidateOnChange(tag: CacheTag): {
  afterChange: CollectionAfterChangeHook[]
  afterDelete: CollectionAfterDeleteHook[]
} {
  return {
    afterChange: [
      ({ doc }) => {
        safeRevalidateTag(tag)
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        safeRevalidateTag(tag)
        return doc
      },
    ],
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/int/revalidate-hook.int.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/collections/hooks/revalidate.ts tests/int/revalidate-hook.int.spec.ts
git commit -m "feat(cache): revalidateOnChange collection-hook factory

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: Wire hooks into the six core collections

**Files (all Modify):** `src/collections/Guides.ts`, `Locations.ts`, `Events.ts`, `EventDates.ts`, `Posts.ts`, `PostCategories.ts`

None of these has an existing collection-level `hooks` block (verified 2026-06-13 — `EventDates.ts` has only *field-level* `afterRead` hooks on its virtual fields, not a top-level `hooks` key). So this is a clean add in each. If during implementation you find a top-level `hooks` block was added since, **merge** the arrays rather than overwriting.

- [ ] **Step 1: Edit `src/collections/Guides.ts`**

Add the imports at the top (after the existing imports):

```ts
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'
```

Add this property to the `Guides` config object, immediately after the `admin: { ... }` line:

```ts
  hooks: revalidateOnChange(TAGS.guides),
```

- [ ] **Step 2: Edit the other five collections identically**

Apply the same two imports and the same `hooks:` line (with the matching tag) to each:

| File | `hooks:` line |
|---|---|
| `src/collections/Locations.ts` | `hooks: revalidateOnChange(TAGS.locations),` |
| `src/collections/Events.ts` | `hooks: revalidateOnChange(TAGS.events),` |
| `src/collections/EventDates.ts` | `hooks: revalidateOnChange(TAGS.eventDates),` |
| `src/collections/Posts.ts` | `hooks: revalidateOnChange(TAGS.posts),` |
| `src/collections/PostCategories.ts` | `hooks: revalidateOnChange(TAGS.postCategories),` |

Place each `hooks:` line right after that collection's `admin: { ... }` property. The relative import path is `./hooks/revalidate` from every file in `src/collections/`.

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0 (no type errors).

- [ ] **Step 4: Commit**

```bash
git add src/collections/Guides.ts src/collections/Locations.ts src/collections/Events.ts src/collections/EventDates.ts src/collections/Posts.ts src/collections/PostCategories.ts
git commit -m "feat(cache): revalidate hooks on core catalogue collections

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 4: Cached queries module (`src/lib/queries.ts`)

**Files:**
- Create: `src/lib/queries.ts`
- Test: `tests/int/queries.int.spec.ts`

> **Type names:** this module imports generated types from `@/payload-types` (`Guide`, `Location`, `Event`, `EventDate`, `Post`, `PostCategory`). If any name differs, run `pnpm generate:types` and use the exact exported names; `tsc` in Step 5 will catch mismatches.

- [ ] **Step 1: Write the failing test**

Create `tests/int/queries.int.spec.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

const { cachedQuery } = vi.hoisted(() => ({
  cachedQuery: vi.fn(
    (_keyParts: string[], _tags: string[], _fn: () => unknown) =>
      Promise.resolve(undefined),
  ),
}))

vi.mock('@/lib/cache', () => ({
  cachedQuery,
  TAGS: {
    guides: 'guides',
    locations: 'locations',
    events: 'events',
    eventDates: 'event-dates',
    posts: 'posts',
    postCategories: 'post-categories',
  },
}))
// Stub the Payload client so importing queries never touches the DB.
vi.mock('@/lib/payload', () => ({ getPayloadClient: vi.fn() }))

import * as q from '@/lib/queries'

afterEach(() => vi.clearAllMocks())

const cases: Array<[string, () => unknown, string[], string[]]> = [
  ['getActiveGuides', () => q.getActiveGuides(), ['active-guides'], ['guides']],
  ['getGuideBySlug', () => q.getGuideBySlug('s'), ['guide-by-slug', 's'], ['guides']],
  ['getPublishedEventsForGuide', () => q.getPublishedEventsForGuide(1), ['events-for-guide', '1'], ['events']],
  ['getActiveLocations', () => q.getActiveLocations(), ['active-locations'], ['locations']],
  ['getLocationBySlug', () => q.getLocationBySlug('s'), ['location-by-slug', 's'], ['locations']],
  ['getPublishedEventsForLocation', () => q.getPublishedEventsForLocation(2), ['events-for-location', '2'], ['events']],
  ['getPublishedPosts', () => q.getPublishedPosts(), ['published-posts'], ['posts', 'post-categories']],
  ['getPublishedPostBySlug', () => q.getPublishedPostBySlug('s'), ['post-by-slug', 's'], ['posts', 'post-categories']],
  ['getPostCategoryBySlug', () => q.getPostCategoryBySlug('s'), ['post-category-by-slug', 's'], ['post-categories']],
  ['getPublishedPostsByCategory', () => q.getPublishedPostsByCategory(3), ['posts-by-category', '3'], ['posts', 'post-categories']],
  ['getPublishedEventBySlug', () => q.getPublishedEventBySlug('s'), ['event-by-slug', 's'], ['events', 'guides', 'locations']],
  ['getActiveEventDatesForEvent', () => q.getActiveEventDatesForEvent(4), ['event-dates-for-event', '4'], ['event-dates']],
  ['getPublishedEventsWithLocations', () => q.getPublishedEventsWithLocations(), ['published-events-with-locations'], ['events', 'locations']],
  ['getPublishedEventsForType', () => q.getPublishedEventsForType(5), ['events-for-type', '5'], ['events']],
  ['getActiveEventDates', () => q.getActiveEventDates(), ['active-event-dates'], ['event-dates', 'events', 'locations']],
]

describe('query tag wiring', () => {
  it.each(cases)('%s wires keyParts + tags', (_name, call, keyParts, tags) => {
    call()
    const lastCall = cachedQuery.mock.calls.at(-1)
    expect(lastCall?.[0]).toEqual(keyParts)
    expect(lastCall?.[1]).toEqual(tags)
  })

  it('getActiveEventDatesForEvents(non-empty) wires event-dates', () => {
    q.getActiveEventDatesForEvents([1, 2])
    const lastCall = cachedQuery.mock.calls.at(-1)
    expect(lastCall?.[0]).toEqual(['event-dates-for-events', '1,2'])
    expect(lastCall?.[1]).toEqual(['event-dates'])
  })

  it('getActiveEventDatesForEvents([]) returns [] without caching', async () => {
    const out = await q.getActiveEventDatesForEvents([])
    expect(out).toEqual([])
    expect(cachedQuery).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/int/queries.int.spec.ts`
Expected: FAIL — cannot resolve `@/lib/queries`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/queries.ts`:

```ts
import { getPayloadClient } from '@/lib/payload'
import { cachedQuery, TAGS } from '@/lib/cache'
import type {
  Guide,
  Location,
  Event,
  EventDate,
  Post,
  PostCategory,
} from '@/payload-types'

// --- Guides / team -------------------------------------------------------

export function getActiveGuides() {
  return cachedQuery(['active-guides'], [TAGS.guides], async (): Promise<Guide[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'guides',
      where: { active: { equals: true } },
      limit: 100,
      depth: 1,
    })
    return docs
  })
}

export function getGuideBySlug(slug: string) {
  return cachedQuery(['guide-by-slug', slug], [TAGS.guides], async (): Promise<Guide | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'guides',
      where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
      limit: 1,
      depth: 1,
    })
    return docs[0] ?? null
  })
}

// depth 0 → only title + slug are rendered on /team/[slug], so this depends on events only.
export function getPublishedEventsForGuide(guideId: number) {
  return cachedQuery(['events-for-guide', String(guideId)], [TAGS.events], async (): Promise<Event[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      where: { and: [{ coaches: { contains: guideId } }, { state: { equals: 'published' } }] },
      limit: 20,
      depth: 0,
    })
    return docs
  })
}

// --- Locations / destinations -------------------------------------------

export function getActiveLocations() {
  return cachedQuery(['active-locations'], [TAGS.locations], async (): Promise<Location[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'locations',
      where: { active: { equals: true } },
      limit: 200,
      depth: 1,
    })
    return docs
  })
}

export function getLocationBySlug(slug: string) {
  return cachedQuery(['location-by-slug', slug], [TAGS.locations], async (): Promise<Location | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'locations',
      where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
      limit: 1,
      depth: 1,
    })
    return docs[0] ?? null
  })
}

// depth 0 → only title + slug rendered on /destinations/[slug].
export function getPublishedEventsForLocation(locationId: number) {
  return cachedQuery(['events-for-location', String(locationId)], [TAGS.events], async (): Promise<Event[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      where: { and: [{ locations: { contains: locationId } }, { state: { equals: 'published' } }] },
      limit: 20,
      depth: 0,
    })
    return docs
  })
}

// --- Posts / blog --------------------------------------------------------
// depth 1 embeds the category (name shown on cards/byline) → tag post-categories too.

export function getPublishedPosts() {
  return cachedQuery(['published-posts'], [TAGS.posts, TAGS.postCategories], async (): Promise<Post[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { state: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 50,
      depth: 1,
    })
    return docs
  })
}

export function getPublishedPostBySlug(slug: string) {
  return cachedQuery(['post-by-slug', slug], [TAGS.posts, TAGS.postCategories], async (): Promise<Post | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
      limit: 1,
      depth: 1,
    })
    return docs[0] ?? null
  })
}

export function getPostCategoryBySlug(slug: string) {
  return cachedQuery(['post-category-by-slug', slug], [TAGS.postCategories], async (): Promise<PostCategory | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'post-categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    return docs[0] ?? null
  })
}

export function getPublishedPostsByCategory(categoryId: number) {
  return cachedQuery(['posts-by-category', String(categoryId)], [TAGS.posts, TAGS.postCategories], async (): Promise<Post[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { and: [{ category: { equals: categoryId } }, { state: { equals: 'published' } }] },
      sort: '-publishedAt',
      limit: 50,
      depth: 1,
    })
    return docs
  })
}

// --- Events / trips ------------------------------------------------------
// depth 2 embeds coaches (guides) + locations on /trips/[slug] → tag all three.

export function getPublishedEventBySlug(slug: string) {
  return cachedQuery(['event-by-slug', slug], [TAGS.events, TAGS.guides, TAGS.locations], async (): Promise<Event | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
      limit: 1,
      depth: 2,
    })
    return docs[0] ?? null
  })
}

export function getActiveEventDatesForEvent(eventId: number) {
  return cachedQuery(['event-dates-for-event', String(eventId)], [TAGS.eventDates], async (): Promise<EventDate[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'event-dates',
      where: { and: [{ event: { equals: eventId } }, { active: { equals: true } }] },
      sort: 'dateFrom',
      limit: 100,
    })
    return docs
  })
}

// --- Programs ------------------------------------------------------------
// depth 1 embeds the location (name shown on program cards) → tag locations too.

export function getPublishedEventsWithLocations() {
  return cachedQuery(['published-events-with-locations'], [TAGS.events, TAGS.locations], async (): Promise<Event[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      where: { state: { equals: 'published' } },
      sort: '-featured',
      depth: 1,
      limit: 100,
    })
    return docs
  })
}

// Returns [] for an empty id list without hitting the cache or the DB.
export function getActiveEventDatesForEvents(eventIds: number[]) {
  if (eventIds.length === 0) return Promise.resolve<EventDate[]>([])
  return cachedQuery(['event-dates-for-events', eventIds.join(',')], [TAGS.eventDates], async (): Promise<EventDate[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'event-dates',
      where: { and: [{ event: { in: eventIds } }, { active: { equals: true } }] },
      sort: 'dateFrom',
      depth: 0,
      limit: 500,
    })
    return docs
  })
}

// LinkedEvents on /programs/[slug]. The page's primary `types` doc and its
// faqs/reviews stay as direct (uncached) finds — out of scope.
export function getPublishedEventsForType(typeId: number) {
  return cachedQuery(['events-for-type', String(typeId)], [TAGS.events], async (): Promise<Event[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      where: { and: [{ types: { contains: typeId } }, { state: { equals: 'published' } }] },
      sort: 'title',
      depth: 1,
      limit: 50,
    })
    return docs
  })
}

// --- Calendar ------------------------------------------------------------
// depth 2 embeds the event and its location (event title + location name shown).

export function getActiveEventDates() {
  return cachedQuery(['active-event-dates'], [TAGS.eventDates, TAGS.events, TAGS.locations], async (): Promise<EventDate[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'event-dates',
      where: { active: { equals: true } },
      sort: 'dateFrom',
      depth: 2,
      limit: 500,
    })
    return docs
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/int/queries.int.spec.ts`
Expected: PASS (15 table cases + 2 extra).

- [ ] **Step 5: Typecheck and commit**

Run: `pnpm exec tsc --noEmit` → expect exit 0.

```bash
git add src/lib/queries.ts tests/int/queries.int.spec.ts
git commit -m "feat(cache): tagged cached queries for catalogue pages

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 5: Migrate team + destinations pages

These are pure refactors (behavior-identical in dev/test because `cachedQuery` is a passthrough there). The existing e2e specs `team-pages.spec.ts` and `destination-pages.spec.ts` are the regression guard (run in Task 9). After each edit, remove the now-unused `getPayloadClient` import where no direct `payload` call remains.

**Files (Modify):** `src/app/(frontend)/team/page.tsx`, `team/[slug]/page.tsx`, `destinations/page.tsx`, `destinations/[slug]/page.tsx`

- [ ] **Step 1: `team/page.tsx`**

Replace `import { getPayloadClient } from '@/lib/payload'` with:
```ts
import { getActiveGuides } from '@/lib/queries'
```
Replace the two data-fetch lines:
```ts
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'guides',
    where: { active: { equals: true } },
    limit: 100,
    depth: 1,
  })
```
with:
```ts
  const docs = await getActiveGuides()
```

- [ ] **Step 2: `team/[slug]/page.tsx`**

Replace `import { getPayloadClient } from '@/lib/payload'` with:
```ts
import { getGuideBySlug, getPublishedEventsForGuide } from '@/lib/queries'
```
Replace:
```ts
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'guides',
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    limit: 1,
    depth: 1,
  })
  const guide = docs[0]
  if (!guide) notFound()
```
with:
```ts
  const guide = await getGuideBySlug(slug)
  if (!guide) notFound()
```
Then replace the events fetch:
```ts
  const { docs: events } = await payload.find({
    collection: 'events',
    where: { and: [{ coaches: { contains: guide.id } }, { state: { equals: 'published' } }] },
    limit: 20,
    depth: 0,
  })
```
with:
```ts
  const events = await getPublishedEventsForGuide(guide.id)
```
(Keep the explanatory comment about not leaking contacts.)

- [ ] **Step 3: `destinations/page.tsx`**

Replace `import { getPayloadClient } from '@/lib/payload'` with:
```ts
import { getActiveLocations } from '@/lib/queries'
```
Replace:
```ts
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'locations',
    where: { active: { equals: true } },
    limit: 200,
    depth: 1,
  })
```
with:
```ts
  const docs = await getActiveLocations()
```

- [ ] **Step 4: `destinations/[slug]/page.tsx`**

Replace `import { getPayloadClient } from '@/lib/payload'` with:
```ts
import { getLocationBySlug, getPublishedEventsForLocation } from '@/lib/queries'
```
Replace:
```ts
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'locations',
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    limit: 1,
    depth: 1,
  })
  const loc = docs[0]
  if (!loc) notFound()

  const { docs: events } = await payload.find({
    collection: 'events',
    where: { and: [{ locations: { contains: loc.id } }, { state: { equals: 'published' } }] },
    limit: 20,
    depth: 0,
  })
```
with:
```ts
  const loc = await getLocationBySlug(slug)
  if (!loc) notFound()

  const events = await getPublishedEventsForLocation(loc.id)
```

- [ ] **Step 5: Typecheck and commit**

Run: `pnpm exec tsc --noEmit` → expect exit 0.
```bash
git add "src/app/(frontend)/team/page.tsx" "src/app/(frontend)/team/[slug]/page.tsx" "src/app/(frontend)/destinations/page.tsx" "src/app/(frontend)/destinations/[slug]/page.tsx"
git commit -m "refactor(team,destinations): fetch via cached tagged queries

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 6: Migrate blog pages

**Files (Modify):** `src/app/(frontend)/blog/page.tsx`, `blog/[slug]/page.tsx`, `blog/category/[slug]/page.tsx`

- [ ] **Step 1: `blog/page.tsx`**

Replace `import { getPayloadClient } from '@/lib/payload'` with:
```ts
import { getPublishedPosts } from '@/lib/queries'
```
Replace:
```ts
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    where: { state: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 50,
    depth: 1,
  })
```
with:
```ts
  const docs = await getPublishedPosts()
```

- [ ] **Step 2: `blog/[slug]/page.tsx`**

Replace `import { getPayloadClient } from '@/lib/payload'` with:
```ts
import { getPublishedPostBySlug } from '@/lib/queries'
```
Replace:
```ts
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
  })
  const post = docs[0]
```
with:
```ts
  const post = await getPublishedPostBySlug(slug)
```
(Keep the `if (!post) permanentRedirect('/blog')` line and its comment exactly as-is.)

- [ ] **Step 3: `blog/category/[slug]/page.tsx`**

Replace `import { getPayloadClient } from '@/lib/payload'` with:
```ts
import { getPostCategoryBySlug, getPublishedPostsByCategory } from '@/lib/queries'
```
Replace:
```ts
  const payload = await getPayloadClient()

  const { docs: cats } = await payload.find({
    collection: 'post-categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const category = cats[0]
  if (!category) permanentRedirect('/blog')

  const { docs } = await payload.find({
    collection: 'posts',
    where: { and: [{ category: { equals: category.id } }, { state: { equals: 'published' } }] },
    sort: '-publishedAt',
    limit: 50,
    depth: 1,
  })
```
with:
```ts
  const category = await getPostCategoryBySlug(slug)
  if (!category) permanentRedirect('/blog')

  const docs = await getPublishedPostsByCategory(category.id)
```

- [ ] **Step 4: Typecheck and commit**

Run: `pnpm exec tsc --noEmit` → expect exit 0.
```bash
git add "src/app/(frontend)/blog/page.tsx" "src/app/(frontend)/blog/[slug]/page.tsx" "src/app/(frontend)/blog/category/[slug]/page.tsx"
git commit -m "refactor(blog): fetch via cached tagged queries

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 7: Migrate trips pages

**Files (Modify):** `src/app/(frontend)/trips/[slug]/page.tsx`, `trips/[slug]/dates/page.tsx`, `trips/[slug]/faq/page.tsx`, `trips/[slug]/logistics/page.tsx`

> `trips/[slug]/page.tsx` and `trips/[slug]/faq/page.tsx` keep `getPayloadClient` (reviews / faqs remain direct, out-of-scope finds). `dates` and `logistics` lose it.

- [ ] **Step 1: `trips/[slug]/page.tsx`**

Add this import (keep the existing `getPayloadClient` import):
```ts
import { getPublishedEventBySlug } from '@/lib/queries'
```
Replace:
```ts
  const { docs: eventDocs } = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const event = eventDocs[0]
  if (!event) notFound()
```
with:
```ts
  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()
```
(Leave the `payload` const and the `reviews` find untouched.)

- [ ] **Step 2: `trips/[slug]/dates/page.tsx`**

Replace `import { getPayloadClient } from '@/lib/payload'` with:
```ts
import { getPublishedEventBySlug, getActiveEventDatesForEvent } from '@/lib/queries'
```
Replace:
```ts
  const payload = await getPayloadClient()

  const { docs: eventDocs } = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const event = eventDocs[0]
  if (!event) notFound()

  const { docs: dates } = await payload.find({
    collection: 'event-dates',
    where: { and: [{ event: { equals: event.id } }, { active: { equals: true } }] },
    sort: 'dateFrom',
    limit: 100,
  })
```
with:
```ts
  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()

  const dates = await getActiveEventDatesForEvent(event.id)
```

- [ ] **Step 3: `trips/[slug]/faq/page.tsx`**

Add this import (keep the existing `getPayloadClient` import):
```ts
import { getPublishedEventBySlug } from '@/lib/queries'
```
Replace:
```ts
  const { docs: eventDocs } = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const event = eventDocs[0]
  if (!event) notFound()
```
with:
```ts
  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()
```
(Leave the `payload` const and the `faqs` find untouched.)

- [ ] **Step 4: `trips/[slug]/logistics/page.tsx`**

Replace `import { getPayloadClient } from '@/lib/payload'` with:
```ts
import { getPublishedEventBySlug } from '@/lib/queries'
```
Replace:
```ts
  const payload = await getPayloadClient()

  const { docs: eventDocs } = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const event = eventDocs[0]
  if (!event) notFound()
```
with:
```ts
  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()
```

- [ ] **Step 5: Typecheck and commit**

Run: `pnpm exec tsc --noEmit` → expect exit 0.
```bash
git add "src/app/(frontend)/trips/[slug]/page.tsx" "src/app/(frontend)/trips/[slug]/dates/page.tsx" "src/app/(frontend)/trips/[slug]/faq/page.tsx" "src/app/(frontend)/trips/[slug]/logistics/page.tsx"
git commit -m "refactor(trips): fetch event via cached tagged query

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 8: Migrate programs + calendar pages

**Files (Modify):** `src/app/(frontend)/programs/page.tsx`, `programs/[slug]/page.tsx`, `calendar/page.tsx`

> `programs/[slug]/page.tsx` keeps `getPayloadClient` (its `types`, `faqs`, `reviews` finds stay direct — out of scope). `programs/page.tsx` and `calendar/page.tsx` lose it.

- [ ] **Step 1: `programs/page.tsx`**

Replace `import { getPayloadClient } from '@/lib/payload'` with:
```ts
import { getPublishedEventsWithLocations, getActiveEventDatesForEvents } from '@/lib/queries'
```
You may also drop the now-unused `EventDate` from the `@/payload-types` import if `tsc` flags it. Replace:
```ts
  const payload = await getPayloadClient()

  const { docs: events } = await payload.find({
    collection: 'events',
    where: { state: { equals: 'published' } },
    sort: '-featured',
    depth: 1,
    limit: 100,
  })

  const eventIds = events.map((e) => e.id)
  const { docs: dates } =
    eventIds.length === 0
      ? { docs: [] as EventDate[] }
      : await payload.find({
          collection: 'event-dates',
          where: {
            and: [{ event: { in: eventIds } }, { active: { equals: true } }],
          },
          sort: 'dateFrom',
          depth: 0,
          limit: 500,
        })
```
with:
```ts
  const events = await getPublishedEventsWithLocations()
  const eventIds = events.map((e) => e.id)
  const dates = await getActiveEventDatesForEvents(eventIds)
```

- [ ] **Step 2: `programs/[slug]/page.tsx`**

Add this import (keep the existing `getPayloadClient` import):
```ts
import { getPublishedEventsForType } from '@/lib/queries'
```
Replace the `Promise.all` block:
```ts
  const [eventsResult, faqsResult, reviewsResult] = await Promise.all([
    payload.find({
      collection: 'events',
      where: {
        and: [
          { types: { contains: type.id } },
          { state: { equals: 'published' } },
        ],
      },
      depth: 1,
      sort: 'title',
      limit: 50,
    }),
    payload.find({
      collection: 'faqs',
      where: { and: [{ type: { equals: type.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
    payload.find({
      collection: 'reviews',
      where: { and: [{ type: { equals: type.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
  ])
```
with:
```ts
  const [events, faqsResult, reviewsResult] = await Promise.all([
    getPublishedEventsForType(type.id),
    payload.find({
      collection: 'faqs',
      where: { and: [{ type: { equals: type.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
    payload.find({
      collection: 'reviews',
      where: { and: [{ type: { equals: type.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
  ])
```
Then update the JSX prop:
```ts
        <LinkedEvents events={eventsResult.docs} />
```
to:
```ts
        <LinkedEvents events={events} />
```

- [ ] **Step 3: `calendar/page.tsx`**

Replace `import { getPayloadClient } from '@/lib/payload'` with:
```ts
import { getActiveEventDates } from '@/lib/queries'
```
Replace:
```ts
  const payload = await getPayloadClient()

  const { docs: dates } = await payload.find({
    collection: 'event-dates',
    where: { active: { equals: true } },
    sort: 'dateFrom',
    depth: 2,
    limit: 500,
  })
```
with:
```ts
  const dates = await getActiveEventDates()
```

- [ ] **Step 4: Typecheck, lint, and commit**

Run: `pnpm exec tsc --noEmit` → expect exit 0.
Run: `pnpm lint` → expect exit 0 (fixes any unused-import errors surfaced by the migrations).
```bash
git add "src/app/(frontend)/programs/page.tsx" "src/app/(frontend)/programs/[slug]/page.tsx" "src/app/(frontend)/calendar/page.tsx"
git commit -m "refactor(programs,calendar): fetch via cached tagged queries

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 9: Full verification

> Requires the DB-split work first (see Prerequisites). The new unit tests pass without a DB, but the full int suite and e2e need the `test`/`dev` Neon branches.

- [ ] **Step 1: New unit tests (no DB required)**

Run: `pnpm vitest run tests/int/cache.int.spec.ts tests/int/revalidate-hook.int.spec.ts tests/int/queries.int.spec.ts`
Expected: all PASS.

- [ ] **Step 2: Full int suite (needs refreshed `.env.test`)**

Run: `pnpm test:int`
Expected: PASS. If it fails to connect, the `.env.test` test-branch credentials still need refreshing (separate DB-split task).

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both exit 0.

- [ ] **Step 4: Production build — confirm pages still statically render**

Run: `pnpm build`
Expected: build succeeds. In the route table, the catalogue routes (`/team`, `/destinations`, `/blog`, `/programs`, `/calendar`, and the `[slug]` routes) should be marked static / ISR (`○`/prerendered or `ƒ` only if they were already dynamic) — **not** newly forced-dynamic. Wrapping queries in `unstable_cache` must not flip a page to dynamic. Also watch the build log for any `unstable_cache` serialization warnings (Payload local-API docs are JSON-serializable, so none expected).

- [ ] **Step 5: e2e regression (against the Neon `dev` branch ONLY)**

Confirm `.env` `DATABASE_URL` points at the `dev` branch (host is **not** `ep-weathered-pine-alvc3sdj`), then run:
Run: `pnpm test:e2e`
Expected: PASS — especially `team-pages`, `destination-pages`, `blog`, `programs`, `trips-*`, `booking`. Because `cachedQuery` is a passthrough outside production, behavior is unchanged in dev; green e2e confirms the refactor preserved behavior.

- [ ] **Step 6: Manual production verification (in the remote-access session)**

After deploying the branch to a Vercel preview (or production):
1. Open a catalogue page (e.g. `/team`) and note current content.
2. In the Payload admin, edit an in-scope record (rename a guide; toggle a post's published state; change an event title).
3. Reload the public page within a few seconds — the change should appear **without a redeploy**.
4. Spot-check a cross-tag case: edit a coach (Guide) and confirm `/trips/<slug>` reflects it (trip pages are tagged `guides` via the `depth: 2` event query).

- [ ] **Step 7: Use superpowers:finishing-a-development-branch** to decide how to integrate (merge/PR).

---

## Notes on scope & known limitations

- **Out-of-scope collections** (reviews, FAQs, types, partners, categories, difficulties, airports): their pages still regenerate whenever an in-scope tag fires, but editing *only* an out-of-scope record won't trigger a refresh until the next in-scope change or redeploy. Adding them later is a one-line tag append per query + a `revalidateOnChange` hook on the collection.
- **`/programs/[slug]`** is primarily driven by the out-of-scope `types` collection; only its LinkedEvents (events) sub-query is cached/tagged. Type edits won't auto-refresh it this round.
- **Migration to `"use cache"`**: deliberately deferred — it requires enabling `experimental.cacheComponents`, a larger change. `unstable_cache` is the supported path for Next 16 here.
