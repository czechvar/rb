# Data Import — Guides + Locations from Old Rockbusters DB (Design Spec)

Status: ready-for-agent
Date: 2026-08-27

## Problem Statement

The v3 rebuild needs the old rockbusters.net catalogue seeded into Payload so the content team can review, refine, and publish it — instead of re-typing every guide profile and destination page from scratch. The old site is a Symfony/MySQL app; a full MySQL dump lives at `old_db/20260827_rb.sql` (584 MB, gitignored). Blog content has already been imported from the live site via a separate scrape pipeline (`origin/blogImport`); everything else — guides, locations, programs, events, categories, reviews, testimonials — is still absent from v3 except for the hand-crafted Jany founder seed and a small dev seed.

This spec covers the **first slice**: `team_member` → `guides`, and `location` → `locations`. Other entities follow in later specs.

## Solution

A two-stage, throwaway import pipeline under `scripts/data-import/`, modelled on the existing `scripts/blog-import/` pattern:

1. **Extract** — one script per source table. Connects to a local MySQL instance loaded from the dump, queries only what's needed, transforms rows into a stable JSON shape, writes `data/guides.json` and `data/locations.json` (both gitignored).
2. **Import** — a single Payload Local API script. Reads the JSON, converts body HTML → Lexical, upserts by slug with **skip-if-exists** semantics, refuses the production DB without `--allow-production`, logs a per-entity summary at the end.

Text-only. No images — the user re-uploads all photos through the admin. No enrichment of the rich profile-page fields that don't exist in the old schema.

## User Stories

1. As Jan, I want to run one command per stage (`pnpm data-import:extract`, `pnpm data-import:import`) so that the import is scriptable and repeatable.
2. As Jan, I want the extract stage to produce audit-friendly JSON I can `jq` before importing, so that a bad parse can be caught without hitting Payload.
3. As Jan, I want the import stage to upsert by slug with **skip-if-exists**, so that Jany's hand-crafted founder profile and any admin-edited row is never clobbered by re-running the script.
4. As Jan, I want the imported guide/location URLs to match the old-site slugs verbatim, so that the SEO redirect map I still owe covers only genuine URL changes (rename/reroute cases), not incidental slug drift.
5. As Jan, I want the import to refuse the production Neon host without `--allow-production`, so that a stray `.env` swap can't repeat the 2026-06-12 fixture leak.
6. As Jan, I want `<img>` tags stripped from body HTML during import, so that the imported richtext is clean text and images are added later through the admin like every other manually-uploaded photo.
7. As Jan, I want a per-row count of stripped images logged at import time, so that I know which guides/locations had photos to re-add and roughly how many.
8. As the content team, I want all 39 team members imported — including `display=0` retired members — with `active` mirroring the old `display` flag, so that the full historical roster is visible in admin and only the currently-published ones render on the site.
9. As the content team, I want all 63 locations imported the same way — `active = display`, retired kept in admin.
10. As the content team, I want the rich profile-page fields (stats, about, coaching pillars, achievements, testimonial, tagline, role, hero-caption) left empty on import, so that we can fill them in through the copywriter workflow rather than reviewing algorithmically-generated placeholders.
11. As the content team, I want location `content` (main body), `country` (English long form), `coordinates` (`[lng, lat]`), `seo.description`, and `seo.keywords` populated from the source — everything else empty for humans to fill.
12. As Jan, I want the location `country` text populated from a JOIN on `country.nicename`, so that a filter/facet on "France" / "Spain" / "Italy" Just Works after import without needing a second normalization pass.
13. As Jan, I want the `content_block` table (homepage/team-page static copy) left alone by this import — it's not row-linked content, it belongs to a later homepage/static-blocks pass.
14. As Jan, I want no automated tests for the import scripts themselves, so that a throwaway pipeline stays throwaway.
15. As Jan, I want the import to write no git commits — I review the DB state (via admin) after the run and commit the scripts themselves manually.
16. As an AI agent picking up other-entity imports later (`programs`, `events`, `reviews`, etc.), I want this pipeline's shape to be the template I extend, so that the second-through-nth imports look like the first.

## Implementation Decisions

### Source & scope

- **Source**: `old_db/20260827_rb.sql` — MySQL 5.7 dump, 584 MB, gitignored. Directory `old_db/` added to `.gitignore` (already done).
- **Access at runtime**: user loads the dump into their local MAMP MySQL (or any locally-available MySQL 5.7+) once, then the extract script connects via `mysql2`. Docker fallback documented in `scripts/data-import/README.md`.
- **Connection**: driven by a new env var `OLD_DB_URL` (e.g. `mysql://root@127.0.0.1:8889/rockbusters`). Kept out of `.env` — user sets it inline or in `.env.local` (already gitignored).
- **Locale**: English only. Payload has no `localization` config; old site has `en_US` + `de` in `ext_translations` but the base tables carry the English content already. `ext_translations` is not read.
- **In scope**: `team_member` → `guides`, `location` → `locations`. Country name resolved via JOIN.
- **Out of scope** (later specs): `content_block`, `blog*`, `event*`, `partner`, `testimonial`, `fos_user_*`, media/gallery, ACL.

### Field mapping — Guides (39 rows)

| Old `team_member` | New `guides` | Notes |
|---|---|---|
| `name` | `name` | Direct copy. |
| `slug` | `slug` | Verbatim. Unique in both schemas. |
| `body` (HTML) | `content` (Lexical) | See "Body HTML cleanup" below. |
| `email` | `email` | Direct copy; NULL → empty. |
| `phone` | `phone` | Direct copy; NULL → empty. |
| `display` (bool) | `active` | Direct cast. |
| `image_id` | *(skipped)* | Photos re-uploaded through admin. |
| `created`, `updated` | *(skipped)* | Payload sets its own timestamps. |
| — | `section` | Always `'team'` (default). Admin re-classifies "Friends & Ambassadors" by hand — no signal in source. |
| — | `role`, `tagline` | Empty. |
| — | `heroSub`, `heroCaption`, `stats`, `about`, `coaching`, `achievements`, `testimonial`, `vimeoId` | Empty. |
| — | `featured`, `isFounder` | `false`. |
| — | `seo.title`, `seo.keywords`, `seo.description` | Empty. |

### Field mapping — Locations (63 rows)

| Old `location` | New `locations` | Notes |
|---|---|---|
| `title` | `name` | Direct copy. |
| `slug` | `slug` | Verbatim. |
| `body` (HTML) | `content` (Lexical) | See "Body HTML cleanup". |
| `latitude`, `longitude` | `coordinates` | Payload `point` = `[longitude, latitude]`. Skip field only if both are `0`. |
| `country_id` | `country` (text) | JOIN → `country.nicename`. NULL → empty. |
| `keywords` | `seo.keywords` | Direct copy; NULL → empty. |
| `description` | `seo.description` | Direct copy; NULL → empty. |
| `display` (bool) | `active` | Direct cast. |
| `image_id` | *(skipped)* | Photos re-uploaded through admin. |
| `created`, `updated` | *(skipped)* | Payload sets its own. |
| — | `address`, `city`, `mainPicture`, `gallery` | Empty. |
| — | `featured` | `false`. |
| — | `seo.title` | Empty. |

### Body HTML cleanup (both entities)

Applied in the import script, before `convertHTMLToLexical`:

1. **Decode HTML entities.** `&hellip;`, `&rsquo;`, `&aacute;` → their Unicode chars. (Node's `html-entities` or equivalent.)
2. **Strip `<img>` tags.** Regex-remove `<img [^>]*>` (and `<img …/>` variants); count stripped-per-row for the run report. Any surrounding empty paragraph left behind by the strip is dropped in step 4.
3. **Strip inline `style=` attributes.** Word-paste noise (`style="font-family: …; color: …"`). Keep tag structure; drop the attribute.
4. **Drop empty paragraphs and stray `&nbsp;`-only paragraphs.** `<p></p>`, `<p>&nbsp;</p>`, `<p>\s*</p>` after entity decoding.
5. **Convert.** Feed cleaned HTML to `convertHTMLToLexical` from `@payloadcms/richtext-lexical`, using the same `editorConfigFactory` pattern the blog importer uses.

Placeholder/test content (Jany's `<p>dfd gfd gofgfd fdg</p>`) is **not** detected algorithmically — Jany is protected by skip-if-exists; any other junk-body row surfaces on content-team review.

### Slug & idempotency

- **Reuse old slugs verbatim.** URL preservation minimizes the 301-redirect surface.
- **Skip-if-exists on `slug`.** For each candidate row, the import queries `payload.find({ collection, where: { slug: { equals } }, limit: 1 })`. If a doc exists, skip and log `existed`. Never update. Never delete.
- **Effect on Jany**: his slug `jan-novotny` is already present via `seed.ts`, so the import skips him. His rich profile stays intact.
- **Re-runnability**: safe to re-run at any time — subsequent runs are no-ops for rows already present.

### Pipeline shape

Two stages, mirroring `scripts/blog-import/`:

```
scripts/data-import/
  README.md                — run instructions + prod guard note
  extract.ts               — reads OLD_DB_URL, writes data/*.json
  import.ts                — reads data/*.json, upserts via Payload Local API
  data/                    — gitignored, JSON only
    guides.json
    locations.json
```

- **Extract order within a run**: locations first (cleaner mapping — surfaces any HTML-conversion issues on the easy set), then guides.
- **Import order within a run**: same — locations, then guides. (No FK between the two.)
- **JSON shape**: `{ generatedAt: ISO, source: 'old_db/20260827_rb.sql', rows: Array<...> }`. Rows carry the pre-transform field names (`title`, `body`, …) so that any transform bugs can be re-executed by tweaking `import.ts` alone.

### Environment & guards

- Extract stage reads `OLD_DB_URL` from environment (`dotenv/config` will pick up `.env.local`).
- Import stage reads `DATABASE_URL` (Payload target) from `.env`.
- **Production guard**: if `DATABASE_URL` host equals `PRODUCTION_DB_HOST` (`ep-weathered-pine-alvc3sdj`), refuse to run unless `--allow-production` is passed. Same guard, same constant, as `scripts/blog-import/import.ts`.
- **`PAYLOAD_DISABLE_DB_PUSH=true`** is documented in the README as the fix for the interactive-schema-push hang.

### Package wiring

`package.json` scripts (added alongside `blog:scrape` / `blog:import` conventions):

- `data-import:extract` — `tsx scripts/data-import/extract.ts`
- `data-import:import` — `tsx scripts/data-import/import.ts`

`scripts/README.md` gets two new rows in the reference table.

### Reporting

At end of each stage, print a compact summary to stdout:

```
extract:
  locations: 63 rows → data/locations.json
  guides:    39 rows → data/guides.json

import (locations): imported=63 skipped-existing=0 total=63 imgs-stripped=124
import (guides):   imported=38 skipped-existing=1 total=39 imgs-stripped=87
```

Any error on a single row aborts the whole import (throw). No partial-success mode — for 100 rows it's cleaner to fix and rerun than to reconcile partial state.

### What this spec does NOT do

- Homepage/team-page static copy blocks (`content_block`).
- Any FK-heavy entity (`event`, `event_date`, `event_date_team`, `event_location`, `order`).
- Photo/gallery import.
- Locale/`ext_translations` handling.
- The 301 redirect map — separate exercise, tracked in `MEMORY.md` under `[[seo-page-mapping]]`. This spec's slug-verbatim decision minimizes the surface but doesn't produce the map.
- Enrichment of the empty rich fields on guides. If manual admin fill becomes painful across 38 profiles, a follow-up LLM-enrichment spec is a possibility, not part of this one.

## Testing Decisions

- **No automated tests for the import scripts.** Throwaway pipeline; a test suite is ceremony. Verification is by:
  - Running `pnpm data-import:extract` and inspecting `data/*.json` counts and a spot-sample of rows (`jq '.rows[0]'`).
  - Running `pnpm data-import:import` against the dev branch and reviewing the admin UI (`/admin/collections/guides`, `/admin/collections/locations`) — expect 38 new guides + 63 new locations, Jany untouched.
  - Loading `/team` and `/destinations` in the dev server, browsing a handful of imported profiles and destination pages, confirming they render (name + body content + empty structured sections gracefully hidden).
- **Detail-page rendering check**: before running the import, confirm the current guide detail page (`/team/[slug]`) doesn't crash when the rich fields (stats/about/coaching/achievements/testimonial) are absent. If it does, the import spec grows by "make the affected sections conditionally render on empty data." Verified in the plan.
- **Manual pre-run check** on the SQL dump loaded into MAMP: `SELECT COUNT(*) FROM team_member;` = 39, `SELECT COUNT(*) FROM location;` = 63.

## Verification checklist

- [ ] `old_db/` is in `.gitignore` (done).
- [ ] MAMP MySQL loaded with `mysql rockbusters < old_db/20260827_rb.sql`.
- [ ] `OLD_DB_URL` set in `.env.local` (never committed).
- [ ] `pnpm data-import:extract` produces `data/guides.json` (39 rows) and `data/locations.json` (63 rows).
- [ ] `pnpm data-import:import` reports `imported=38 skipped-existing=1` for guides and `imported=63 skipped-existing=0` for locations against a fresh dev branch (Jany pre-seeded → the 1 skip).
- [ ] Sample 3 imported guides and 3 imported locations in admin — all base fields populated correctly, rich fields empty, `active` matches source `display`.
- [ ] Load `/team/laszlo-juhasz` and `/destinations/rodellar` in dev server — pages render, structured sections gracefully hide when empty.
- [ ] Re-run `pnpm data-import:import` — reports 100% skipped-existing (idempotency check).
