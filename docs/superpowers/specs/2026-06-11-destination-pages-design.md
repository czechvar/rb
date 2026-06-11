# Destination pages — DRAFT (overnight prep, decisions pending)

**Date:** 2026-06-11
**Status:** DRAFT — written autonomously overnight; open questions below need Jan's call before implementation.
**Scope:** `/destinations` index + `/destinations/[slug]` detail pages, fed by the existing `locations` collection; 301 mapping from the old site's `/location/*` URLs.

## Ground truth (verified tonight)

- The live rockbusters.net has **56 indexed venue-level pages at `/location/<slug>/`** (arco, kalymnos, siurana, dolomites, …). There are **no country-level destination pages** on the old site — the new footer's `/destinations/spain|italy|france|czechia` links were invented during the wireframe round and currently 404, as does the header's `/destinations`.
- The `locations` collection already exists (name, slug, richText content, address/city/country, `point` coordinates, active, SEO) and `events.locations` (hasMany) already relates trips to venues. Seed has 4 locations with real content.
- **Slug mismatch:** old slugs are short (`arco`, `dolomites`); seeded slugs are suffixed (`arco-italy`, `dolomites-italy`). SEO memory says URL continuity is a hard requirement.
- Copywriter worksheet (trip-detail, May 25) left an open item: *"Open a follow-up worksheet for the Destination page once Martin's drafted one"* — destination page content sections are expected to come from Martin's workflow.

## Recommended design

**Venue-level destination pages that inherit the old site's URL inventory.**

- `/destinations` — index. Cards grouped under country headings (derived from `locations.country`, no new collection). Card: picture, name, country, 1-line teaser.
- `/destinations/[slug]` — detail: hero picture, name + country, richText content, map (coordinates exist; static map image or embed — decide), **upcoming trips here** (published events whose `locations` contains this venue, with future event-dates → links to trip pages), related blog posts later (see blog spec).
- Both wrapped in `MarketingShell` with crumbs (`Home / Destinations / <name>`).

### Schema deltas (small)

- `locations`: add `mainPicture` (upload) + optional `gallery` (upload hasMany) — the collection has **no image fields** today, and destination pages are image-led.
- Optional: `featured` checkbox for index ordering / future homepage row.

### URL & redirect plan

- New canonical: `/destinations/<slug>`. 301 `/location/:slug → /destinations/:slug` via `next.config` redirects (pattern-level, one rule).
- **Re-align new slugs to the old ones** (`arco`, not `arco-italy`) so the pattern redirect covers everything; fix the 4 seed slugs. Where a venue is never recreated, the pattern 301 will land on the new page's 404 — acceptable, or add a catch-all to `/destinations`.
- Footer country links: replace `/destinations/<country>` with links to the index (optionally `/destinations#spain` anchors from the country grouping). Header `/destinations` starts working as-is.

## Open questions for Jan

1. **Slug policy:** adopt old short slugs (recommended) or keep `-country` suffixes and maintain an explicit redirect map?
2. **Map rendering:** static image (zero deps), OpenStreetMap embed, or skip maps in v1?
3. **Content sections:** wait for Martin's destination worksheet before fixing the detail-page section list, or ship name/photo/content/trips as v1 and let the worksheet drive v2? (Recommended: ship the thin v1 — it's all existing data.)
4. Which of the 56 old venues get recreated in Payload first? (Suggest: the ones with upcoming trips, then top-traffic ones from Search Console.)

## Out of scope

Country landing pages, weather/conditions widgets, per-destination FAQs, data migration from the old site.
