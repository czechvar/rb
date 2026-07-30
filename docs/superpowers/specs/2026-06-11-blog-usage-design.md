# Blog — usage & collection design

**Date:** 2026-06-11
**Status:** APPROVED for schema + routes — decisions resolved by Jan 2026-06-12 (see Decisions below); old-post recreation list to follow from Jan/Search Console.
**Scope:** a `posts` collection, `/blog` index + `/blog/[slug]` + `/blog/category/[slug]` routes, and how blog content plugs into the rest of the site.

## Ground truth (verified tonight)

- The live site has an **active, indexed blog** at `/blog/<slug>/` (15+ posts visible on the index: destination guides, training articles, promo/news) with category archives at `/blog/category/<slug>/` (categories: promo, guest-post, climbing-destinations, trad-climbing, bouldering, sport-climbing, training, multi-pitch-climbing).
- The new build has **no posts collection** and `/blog` (header nav) 404s.
- Snowbusters' equivalent is a generic CMS-pages module (EditorJS blocks + menu + SEO) — a precedent for block-based editorial content, but not a real blog (no dates/categories/authors). Payload's Lexical richText is the native fit here.
- Content production runs through the copywriter workflow (Martin drafts maximalist HTML wireframes into `docs/`, then a scoping meeting) — blog posts should enter through that same pipeline.

## Proposed `posts` collection

| Field | Type | Notes |
|---|---|---|
| `title` | text, required | |
| `slug` | slugField('title') | match old-site slugs when recreating indexed posts |
| `heroImage` | upload → media | index cards + post header |
| `excerpt` | textarea | card teaser + meta description fallback |
| `content` | richText (Lexical) | |
| `category` | relationship → `post-categories` | categories are their own collection (Decision 1) |
| `author` | text, default "Rockbusters" | plain byline for now (Decision 2) |
| `publishedAt` | date | index ordering |
| `state` | select draft/published | mirror the `events.state` pattern + access rule |
| `seo` | seoFields | existing shared group |

## Routes

- `/blog` — index in `MarketingShell`: hero card for the newest post, then a card grid (heroImage, category chip, title, excerpt, date). Category filter via the category-archive links.
- `/blog/[slug]` — post: hero image, title, byline (author photo + name, links to `/team/<slug>`), date, content, "more from the blog" row.
- `/blog/category/[slug]` — **same paths as the old site**, so category archives stay 301-free.

## How the blog earns its keep on the site (the "usage" part)

1. **SEO continuity first:** recreate the old posts that still rank (Search Console knows which; the destination guides — Fontainebleau, Magic Wood, Ticino — are obvious keepers). Posts recreated with identical slugs need zero redirects. The rest 301 to `/blog`.
2. **Destination cross-linking:** destination detail pages get a "Reading" row pulling posts in `climbing-destinations` (later: an explicit `relatedLocations` field if category matching proves too blunt).
3. **Trip-page support content:** training/technique posts linked from trip pages ("how to prepare") — manual links in richText at first, no schema.
4. **Homepage teaser row** (3 newest posts) — later round, after the Figma pass covers it.
5. **News/promo channel:** the promo category replaces ad-hoc landing pages for announcements (lottery, new courses), giving them stable URLs.

## Decisions (Jan, 2026-06-12)

1. **Category is a full collection** (`post-categories`: name, slugField, optional description, SEO), seeded with the 8 old-site categories under their old slugs so `/blog/category/<slug>` survives verbatim. `posts.category` becomes a relationship.
2. **Author is plain text for now** (default "Rockbusters"); relation to `guides` is a possible later upgrade.
3. **Old-post recreation list:** Jan provides later (Search Console); until then unmatched `/blog/*` paths 301 to `/blog`.
4. **Sequencing:** built after destinations; schema + routes only, content enters via the copywriter workflow.

## Out of scope

Comments, RSS, tags beyond the single category, scheduled publishing, localization.
