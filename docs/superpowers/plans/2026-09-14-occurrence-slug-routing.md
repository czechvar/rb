# Event Date slug routing implementation plan

Status: ready-for-human
Date: 2026-09-14
Implementation: items 1-4 implemented; browser navigation, disposable DB import and legacy editorial resolution outstanding
Decision: [ADR-0015](../../adr/0015-occurrence-slug-routing.md)

## Approved outcome

Each public Event Date has one stable location-and-start-date URL, for example
`/trips/europe-rock-climbing-trip/kalymnos-2026-10-12`. Numeric IDs remain internal
for relationships, Orders and booking. The parent Event remains the shared content
owner but its public route selects a departure rather than rendering an indexable
evergreen page for which sufficient content is not currently available.

The user confirmed the rebuilt site is not live or indexed. Preserving search
signals for its current numeric query URLs is therefore not a launch dependency.
Legacy rockbusters.net URL mapping remains a separate migration concern.

This replaces the indexable-parent and query-URL direction in the existing
[SEO/AEO task](https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/4fcd2a1d-8cc4-45a4-9e76-9f7dd03bea4c).
The [legacy redirect task](https://app.workstreams.ai/teams/S_ZYh417Os/board/AceE0P/tasks/8d966e2a-b385-4691-a8e7-4fa73fe4e7ba)
must use the resulting occurrence URLs when its mapping is refreshed. These board
tasks have not been edited by this documentation change.

## Routing contract

| Request | Response |
| --- | --- |
| Published parent with an upcoming bookable departure | 307 to the earliest such occurrence; deterministic tie-break by slug |
| Published parent with no upcoming bookable departure | 200 noindex availability/enquiry page with public departure links; no automatic sold-out/past fallback |
| Valid public occurrence under its correct parent | 200 with that occurrence's content and self-referencing canonical |
| Past public occurrence | Same URL and useful content; clear past state, no booking, upcoming alternatives |
| Sold-out public occurrence | Same URL; sold-out state, no booking, relevant alternatives |
| Unknown, malformed, inactive or wrong-parent occurrence | Intentional 404; never substitute another departure |
| Existing numeric query selecting a valid public occurrence | 308 directly to its slug URL, if the small compatibility adapter is retained |
| Explicit invalid numeric query | 404; never treat as an omitted selection |

Only eligible canonical occurrence pages enter the trip sitemap. Parent selection
routes are omitted. A 307 is appropriate because its target changes over time;
it is not a promise that a search engine will exclude the parent source URL.
Do not block occurrence crawling with a broad robots rule intended for parents.
Preview indexing protection remains in place; launch-domain indexing is separate.

## 1. Serve a stored occurrence slug end to end

Blocked by: none.

- [x] Add an editable stored slug to Event Dates; generate from the selected
  location slug plus the start calendar date (`YYYY-MM-DD`), without timezone shifts.
- [x] Enforce uniqueness within the parent Event at the database and CMS validation
  boundaries. Reject ambiguous duplicates and request a meaningful qualifier.
- [x] For multi-location or missing-location records, require an explicit editorial
  choice rather than silently deriving identity from relationship array order.
- [x] Generate once. Changes to venue or dates do not regenerate a stored slug.
  Explicit changes must reserve the old path as an alias, reject alias collisions
  and redirect directly to the final URL. Freeze parent reassignment and published
  parent slug changes unless their affected occurrence paths are also preserved.
- [x] Add tracked migration/backfill support and regenerate Payload types. Backfill
  produces a review report for missing locations and collisions before writes.
- [x] Add `/trips/[slug]/[occurrenceSlug]` and a shared URL builder. Resolve by both
  parent and occurrence slug, preserving the established editorial merge and layouts.
- [x] Keep booking URLs and numeric commerce relationships unchanged.
- [x] Prove direct loading renders the requested occurrence and rejects wrong-parent
  and non-public records, including when queries use privileged Payload access.

Likely files: `src/collections/EventDates.ts`, `src/migrations/`,
`src/lib/queries.ts`, `src/lib/trip-detail.ts`, trip route files and integration tests.

## 2. Preserve identity through selection and expiry

Blocked by: 1.

- [x] Separate direct public-occurrence lookup from upcoming availability queries.
  Active/public status must remain distinct from the date having passed.
- [x] Render the exact requested occurrence, including its guides, locations,
  logistics and editorial content. Remove silent fallback for explicit selections.
- [x] Implement parent 307 selection and the noindex fallback described above.
  Use existing booking eligibility rules; do not infer bookability from capacity alone.
- [x] Ensure selection uses current availability and time rather than a long-lived
  cached redirect. Parent fallback metadata must not leak noindex into child routes.
- [x] Handle in-progress occurrences explicitly: retain content and use existing
  booking cutoff rules; show past only after the occurrence ends.
- [x] Keep a minimal numeric-query adapter only if useful for existing internal
  links during migration. No elaborate pre-launch numeric-URL alias inventory.
- [x] Test time advancing past start/end, capacity exhaustion, no upcoming dates,
  all sold out and malformed selectors through deterministic unit/route seams.
- [ ] Add browser back/forward/reload coverage when item 3 moves public navigation
  to occurrence URLs; no deterministic browser fixture was needed for this item.

## 3. Use canonical departure URLs across discovery

Blocked by: 1 and 2.

- [x] Migrate calendar, trip cards, date selectors, destination/team/program blocks,
  breadcrumbs, related-trip links and authored links to the shared URL builder.
  When a link refers to a known occurrence, link directly rather than through the parent.
- [x] Audit `/dates`, `/faq` and `/logistics`: replace redundant parent subpages
  with appropriate selected-occurrence section links/redirects; use the parent
  noindex fallback when no departure can be selected. Keep them out of the sitemap.
  Reserve these route names against occurrence-slug collisions.
- [x] Generate title, description, canonical and JSON-LD from the same resolved
  occurrence used by the page, including correct dates, venue and offer state.
- [x] Include active/public occurrences under published parents in the sitemap
  only when they have substantive useful rendered content. Add a simple editorial
  indexing eligibility control if an explicit policy cannot otherwise be expressed.
  Document and test thin/duplicate handling; URL uniqueness alone is not content uniqueness.
- [x] Retain useful past pages without automatic expiry redirects. Eligible past
  pages may remain indexed; thin pages remain accessible but noindex and omitted.
- [x] Cover inherited Event and occurrence updates in sitemap lastModified;
  keep metadata, canonical, internal links and sitemap URLs consistent.
- [x] Verify all eligible occurrences are enumerated, not silently truncated by
  existing query limits. Keep booking availability out of long-lived content caches.

The runtime and authored link migration is complete wherever both Event and Event
Date identity are populated. Canonical seed and trip-editorial maintenance sources
now preserve stored occurrence paths without destination-database numeric IDs.

Likely files: `src/lib/sitemap.ts`, `src/lib/jsonld.ts`, trip metadata/layouts,
catalogue blocks/components, `src/lib/cache.ts` and revalidation hooks.

## 4. Preserve URLs across seed rebuilds and refresh legacy mapping

Blocked by: 1–3.

- [x] Include stored slugs and aliases in the canonical snapshot and seed workflow;
  seed import must preserve them even when database numeric IDs are remapped.
- [x] Update `scripts/canonical-seed/occurrence-links.ts` and seed verification
  to preserve canonical occurrence links without depending on old numeric IDs.
- [ ] Verify a fresh disposable import and repeat import keep identical public URLs.
- [x] Refresh `.scratch/sitemap-redirect-mapping.json` and its generator using
  current legacy source identities and the new sitemap. Match legacy departure
  to occurrence identity, not a guessed title or a database-local numeric ID.
- [x] Report exact occurrence matches, relevant replacements, unresolved records
  and obsolete URLs separately. Do not automatically approve calendar fallbacks.
- [x] Validate final destinations return the intended content, not merely HTTP 200.
  Do not ship unresolved legacy mappings as part of this routing change.

Offline verification covers 789 stored occurrence slugs and repeat-import behavior
at the seed public seam. A live disposable database import was not run because the
available local target is protected production and the shared test target is stale.
The refreshed 2026-09-14 legacy review has 36 exact occurrence matches, 65 relevant
replacements, 49 unresolved URLs and no asserted obsolete URLs. It emits no
`next.config` redirects; unresolved mappings remain outside implementation.

## Verification and data boundary

- All new/backfilled slug values and canonical snapshot updates are persistent
  migration/seed data. This plan itself creates no database or media records.
- Before running the app, migrations, seed or tests, apply AGENTS.md database
  guards. Confirm the intended dev/test target internally and output only safe
  booleans; never expose environment values. Production remains untouched.
- Use deterministic temporary fixtures only in the test database and clean them
  in teardown. Sandbox seed validation must use a disposable local database.
- Run focused integration tests for uniqueness, publication, route resolution,
  time/availability, metadata/sitemap and seed portability; run relevant Playwright
  direct-load/navigation checks, lint and a guarded production build.
- Final browser audit: exact occurrence content, no parent noindex inheritance,
  no silent date replacement, no duplicate canonical URLs, no broken internal
  trip links, and no stale redirects when the selected departure changes.
- Record counts of migrated slugs, unresolved slugs, eligible sitemap occurrences
  and verified legacy matches. Do not claim launch indexing from local validation.

## Completion boundary

The plan is complete when canonical occurrence URLs work consistently in public
navigation, metadata and sitemap, survive expiry and seed rebuilds, and provide
verified targets for the separate legacy redirect task. Deployment, enabling
production indexing and resolving unrelated legacy content gaps remain separate.
