# Team / guide pages

**Date:** 2026-06-11
**Status:** APPROVED — open questions resolved by Jan 2026-06-12 (see Decisions below). A working scaffold of the index/detail pages already accompanies this spec; the decisions below extend it.
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

## Decisions (Jan, 2026-06-12)

1. **Add a `role` text field** to `guides` ("Head coach", "Pro climber", "Physiotherapist") — shown on index cards and the profile header. Schema change ⇒ create the migration with `payload migrate:create` (never hand-written).
2. **Two sections on `/team`:** a `section` select on `guides` (`team` | `friends`, default `team`), rendered as "Rockbusters Team" and "Friends & Ambassadors" headings.
3. **Clean slugs + explicit redirect map:** new guides get clean slugs (`daila-ojeda`); the generic `/team-member/:slug → /team/:slug` pattern rule covers matching slugs, plus a small explicit map in `next.config` for the old suffixed ones.

## Out of scope

Booking-by-coach, guide availability calendars, guide login/self-editing.
