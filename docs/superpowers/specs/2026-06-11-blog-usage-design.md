# Blog — usage proposal & collection design — DRAFT (overnight prep, decisions pending)

**Date:** 2026-06-11
**Status:** DRAFT — written autonomously overnight; this one intentionally ships no code. The collection shape and the "how the blog earns its keep" proposal below need Jan's sign-off (and probably the copywriter's) before anything is built.
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
| `category` | select (the 8 old-site categories) | start as select; promote to a collection only if categories need their own content |
| `author` | relationship → guides | posts are bylined by team members; "Rockbusters" fallback when empty |
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

## Open questions for Jan

1. Category as `select` (recommended start) vs separate collection?
2. Author = relation to `guides` (recommended; pro fallback text field?) — or a plain text byline?
3. Which old posts get recreated vs 301-to-index? (Needs Search Console; suggest deciding with Martin.)
4. Is the blog in scope before or after the Figma round-2 storefront work? This spec only stakes out URLs + schema so nothing else blocks on it.

## Out of scope

Comments, RSS, tags beyond the single category, scheduled publishing, localization.
