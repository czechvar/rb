# Team / guide pages — DRAFT (overnight prep, scaffolded for review)

**Date:** 2026-06-11
**Status:** DRAFT — written autonomously overnight. This is the least ambiguous of the three areas (zero schema changes required to render), so a working scaffold accompanies this spec on the same branch. Review and amend rather than treat as final.
**Scope:** `/team` index + `/team/[slug]` detail pages from the existing `guides` collection; 301 mapping from the old site's `/team-member/*`.

## Ground truth (verified tonight)

- The live site has **~33 indexed pages at `/team-member/<slug>/`** — coaches, IFMGA guides, pro climbers (Adam Ondra, Hazel Findlay, Dave Graham…), and specialists (physio). Some old slugs carry role suffixes (`daila-ojeda-pro-climber`).
- The `guides` collection exists: name, slug, photo (upload), richText content, email, phone, vimeoId, featured, active, SEO. Seeded with two real-ish coaches; `klemen-becan` matches its old-site slug exactly.
- `events.coaches` (hasMany → guides) already powers the trip-detail coaches section, so "trips coached by X" is a `where: { coaches: { contains: id } }` query away.
- Header `/team` and footer "Rockbusters Team" links currently 404.

## Design (as scaffolded)

- `/team` — index in `MarketingShell` (crumbs `Home / Team`). Grid of cards from `guides` where `active`, `featured` first then alphabetical: photo, name, short teaser (first paragraph of content). Card links to detail.
- `/team/[slug]` — detail: photo, name, richText content, Vimeo embed when `vimeoId` is set, and an **"Upcoming trips with <name>"** list (published events whose `coaches` contains the guide; falls back to "joins selected camps" copy when empty). 404 for unknown/inactive slugs.
- **Privacy call made in the scaffold:** `email`/`phone` exist on the collection but are NOT rendered publicly. Flag if you want a contact line.

### Schema deltas

None required. One optional nice-to-have for parity with the old site: a `role` text field ("Head coach", "Pro climber", "Physiotherapist") shown on cards — old site bakes roles into slugs/titles. Not added tonight; decide at review.

### URL & redirect plan

- New canonical: `/team/<slug>`. 301 `/team-member/:slug → /team/:slug` (single pattern rule in `next.config`).
- Old suffix-y slugs (`…-pro-climber`) only stay continuous if guides are recreated with those exact slugs. Recommendation: when (re)creating guides in Payload, copy the old slug verbatim — ugly slugs are cheaper than ranking loss. Alternatively a small explicit map for the handful of suffixed ones.

## Open questions for Jan

1. Add the `role` field now or later? (Cards look bare with just names; recommended: add at review.)
2. Pro climbers vs working coaches — one flat grid (scaffolded) or two sections ("Team" / "Friends & ambassadors")? The old site mixes them.
3. Should `/team` replace the footer's "Rockbusters Team" link target as-is? (Scaffold assumes yes — link starts working with no footer change.)

## Out of scope

Booking-by-coach, guide availability calendars, guide login/self-editing.
