# On-demand revalidation — tag-based ISR for catalogue pages

**Date:** 2026-06-13
**Status:** APPROVED for implementation — design approved by Jan 2026-06-13. Implementation to be executed in a Claude CLI session with remote (Vercel/Neon) access for production verification.
**Scope:** Make admin edits to core-catalogue content appear on the live (production) static pages without a redeploy, using Next.js cache tags + `revalidateTag` fired from Payload collection hooks. Dev and tests stay uncached. Closes the long-standing "Payload edits invisible until redeploy" gap (see `MEMORY.md` → ISR/revalidation pending).

## Ground truth (verified 2026-06-13)

- Catalogue pages fetch through `getPayloadClient()` → `payload.find(...)` **directly in server components** (e.g. `src/app/(frontend)/team/page.tsx`, `src/app/(frontend)/blog/page.tsx`). No `fetch`, so Next's fetch-tagging does not apply.
- **No** `export const revalidate`, `export const dynamic`, or `generateStaticParams` anywhere in the catalogue pages. With no dynamic APIs, Next statically renders these at build and serves them frozen until the next deploy — exactly the reported problem.
- `revalidatePath` is already used in-repo, but only in the **account** server actions (`account/profile/actions.ts`, `account/addresses/actions.ts`, `account/orders/[id]/actions.ts`) for per-user dynamic pages. Those are unrelated to this work and stay as they are.
- The home page (`src/app/(frontend)/page.tsx`) renders **no CMS data** — it needs no revalidation.
- Stack: Next **16.2.6**, Payload **3.84.1**. Payload runs embedded in the Next app (single Vercel deployment), so admin mutations execute inside Next route handlers — the request scope `revalidateTag` needs is present in production.

### Page → collection dependency map (the fan-out)

Derived by reading each catalogue page's `payload.find` calls and the `depth` each uses (depth drives which related docs are embedded in the rendered output):

| Page | Collections read | Notes |
|---|---|---|
| `/team`, `/team/[slug]` | guides | `/team/[slug]` also lists the guide's events at **depth 0** (title + slug only) → tag `events` on that query |
| `/destinations`, `/destinations/[slug]` | locations | detail lists events at **depth 0** → tag `events` on that query |
| `/trips/[slug]` | events (**depth 2**) | embeds full coach (Guide), partner, and location docs → query depends on `events`, `guides`, `locations` |
| `/trips/[slug]/dates` | events, event-dates | |
| `/trips/[slug]/faq` | events, faqs | faqs out of scope |
| `/trips/[slug]/logistics` | events | |
| `/programs` | events, event-dates | |
| `/programs/[slug]` | types, events, faqs, reviews | only `events` in scope |
| `/calendar` | event-dates (+ event title via depth) | tag `event-dates`, `events` |
| `/blog`, `/blog/[slug]` | posts (**depth 1** → category) | embeds category name on cards → tag `posts`, `post-categories` |
| `/blog/category/[slug]` | post-categories, posts | |

**Key asymmetry:** `/trips/[slug]` uses `depth: 2` and renders coach and location *display fields*, so a Guide or Location rename must refresh trip pages. `/destinations/[slug]` and `/team/[slug]` list events at `depth: 0` (title + slug only), so they do **not** embed guide/location display fields.

## Approach (decided)

**Tag-based revalidation** (chosen over path-based and coarse catch-all). **Core-catalogue scope**: `guides`, `locations`, `events`, `event-dates`, `posts`, `post-categories`. Reviews/FAQs/Partners/Types/Airports/Categories/Difficulties are deliberately out of scope for now and can be added later by appending one tag to the relevant query.

### Model: tags live with the query; hooks revalidate one tag each

Each page's data query is wrapped in a cached function that declares **every in-scope collection whose data it embeds** — including relations pulled in via `depth` — as cache tags. Each collection's Payload hook then revalidates **exactly one** tag: its own. All dependency knowledge is co-located with the query (reviewable in one place); hooks stay one-liners.

Worked example: the `/trips/[slug]` query is tagged `['events', 'guides', 'locations']`. The `guides` hook only calls `revalidateTag('guides')`, yet that refreshes both `/team` and every trip page, because the trip query carries the `guides` tag. No per-relationship logic in any hook.

### Tag map (query → tags)

| Query | Tags |
|---|---|
| `/team` guides; `/team/[slug]` guide | `guides` |
| `/team/[slug]` events (depth 0) | `events` |
| `/destinations`, `/destinations/[slug]` location | `locations` |
| `/destinations/[slug]` events (depth 0) | `events` |
| `/trips/[slug]` event (depth 2) | `events`, `guides`, `locations` |
| `/trips/[slug]/dates`, `/programs` | `events`, `event-dates` |
| `/trips/[slug]/logistics`, `/trips/[slug]/faq`, `/programs/[slug]` | `events` |
| `/calendar` | `event-dates`, `events` |
| `/blog`, `/blog/[slug]` | `posts`, `post-categories` |
| `/blog/category/[slug]` | `post-categories`, `posts` |

> The exact tag set per query depends on the `depth` each `payload.find` uses. During implementation, re-confirm each query's `depth` and tag it with every in-scope collection it transitively embeds. The table above reflects the depths read on 2026-06-13.

### Hooks (one tag each, `afterChange` + `afterDelete`)

| Collection | Revalidates |
|---|---|
| Guides | `guides` |
| Locations | `locations` |
| Events | `events` |
| EventDates | `event-dates` |
| Posts | `posts` |
| PostCategories | `post-categories` |

## Components

- **`src/lib/cache.ts`** (new)
  - Tag constants for the six collections (single source of truth, imported by both queries and hooks).
  - `cachedQuery(keyParts, tags, fn)` — wraps `fn` in `unstable_cache` **only when `process.env.NODE_ENV === 'production'`**; otherwise calls `fn` directly.
  - `safeRevalidateTag(tag)` — short-circuits when `NODE_ENV !== 'production'`, and wraps `revalidateTag` in try/catch as a belt-and-suspenders net.
- **`src/lib/queries.ts`** (new) — one cached function per catalogue query, each declaring its tag set per the table above. Replaces the inline `payload.find` calls in the pages. Dynamic-segment queries (slug/id) include the param in `keyParts`.
- **`src/collections/hooks/revalidate.ts`** (new) — a `revalidateOnChange(tag)` factory returning `{ afterChange, afterDelete }` that call `safeRevalidateTag(tag)`.
- **Edits**
  - Catalogue pages swap inline finds for `queries.ts` imports: `team`, `team/[slug]`, `destinations`, `destinations/[slug]`, `blog`, `blog/[slug]`, `blog/category/[slug]`, `programs`, `programs/[slug]`, `trips/[slug]`, `trips/[slug]/dates`, `trips/[slug]/faq`, `trips/[slug]/logistics`, `calendar`.
  - The six collection configs (`Guides.ts`, `Locations.ts`, `Events.ts`, `EventDates.ts`, `Posts.ts`, `PostCategories.ts`) wire in the hook factory. `EventDates.ts` and `Orders.ts` already have hooks — merge, don't overwrite.

## Two deliberate gotchas (and how they're handled)

1. **Caching is production-only.** `cachedQuery` applies `unstable_cache` only in production; in dev and test it calls straight through.
   - *Why it's correct:* dev wants fresh data on every request.
   - *Why it matters for tests:* the Playwright e2e suite creates fixtures from a **separate Node process** (its own `getPayload`), whose mutations the running dev server's cache could never see. If queries were cached in dev, an e2e fixture created in `beforeAll` might not appear on the page → false failure. Production-only caching sidesteps this entirely; the e2e suite keeps seeing fresh data.
2. **`revalidateTag` throws outside a request scope.** Seed scripts and the e2e/int fixture setup call `payload.create` / `payload.delete` in a plain Node process; the hooks fire there with no static-generation store, and `revalidateTag` would throw (`Invariant: static generation store missing`). `safeRevalidateTag` short-circuits when `NODE_ENV !== 'production'` (covers seed, e2e in dev, and vitest int tests), and the try/catch covers any residual production-but-no-request path (e.g. a future background job).

## Caching API choice

Use **`unstable_cache`**, not the newer `"use cache"` directive. `"use cache"` requires enabling `experimental.cacheComponents`, which restructures app-wide caching semantics (Suspense boundary requirements, default dynamic/static behavior) — too invasive for this task. `unstable_cache` is fully supported in Next 16 and needs no `next.config.ts` change. Migrating to `"use cache"` is a possible later, separate effort.

## Testing

- **Unit (vitest int suite):**
  - The tag map: assert each query's declared tag set matches the table (a pure data structure / small functions — easy to assert).
  - `revalidateOnChange(tag)`: mock `next/cache`, assert `afterChange` and `afterDelete` call `safeRevalidateTag` with the expected tag, and that `safeRevalidateTag` is a no-op when `NODE_ENV !== 'production'`.
- **Not unit-tested:** the production-gated `unstable_cache` path and live revalidation behavior — these are verified manually against the deployed site (edit content in admin → confirm the page updates without redeploy) during the remote-access implementation session.
- **Regression guard:** the existing e2e suite must stay green; production-only caching means it should be unaffected. Run it only after the local `.env` is repointed at the Neon `dev` branch (see env work below) — never against production.

## Out of scope

- Hooks for Reviews, FAQs, Partners, Types, Airports, Categories, Difficulties.
- Account/booking pages — dynamic, auth-gated, must stay uncached.
- Migrating to the `"use cache"` directive / Cache Components.
- The home page (no CMS data).

## Relationship to the DB-split work

This spec was triggered alongside splitting the local/e2e database off the production Neon branch (creating a `dev` branch, refreshing the `test` branch, and adding `afterAll` fixture cleanup to the e2e specs). That env work is independent of revalidation but shares a deadline: the e2e regression check for this feature must run against the `dev` branch, not production.
