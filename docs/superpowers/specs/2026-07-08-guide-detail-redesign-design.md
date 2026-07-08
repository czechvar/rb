# Guide detail page redesign — design

**Date:** 2026-07-08
**Wireframe:** `docs/html/TEAM/jany-founder-head-coach.html` (copywriter source of truth)
**Route:** `/team/[slug]` (`src/app/(frontend)/team/[slug]/page.tsx`)

## Goal

Bring the guide (team member) detail page up to the copywriter wireframe, using the
same design vocabulary as the redesigned trip detail pages — global classes
(`.section-label`, `.section-title`, `.btn-primary`, `.btn-ghost`), Bebas display
headings, red accent (`--rb-red`), and the dark/mid/light section rhythm — so all
detail pages share elements and font styling.

## Decisions made

1. **Data source:** new optional fields on the `Guides` collection. Every new section
   renders only when its data is filled, so guides without content get a lighter page
   (hero, bio, trips, CTA) instead of empty sections. Jany's content is seeded from
   the wireframe.
2. **No contact leak:** the wireframe's facts-card "Contact" row and social icons are
   **omitted**. The team-pages spec rule stands: public team pages must not expose
   email/phone. The final CTA routes to `/calendar` and `/team` instead of a mailto.
3. **Trips section:** keep the **dynamic** published-events-for-guide grid (not the
   wireframe's curated category cards), restyled to the wireframe's card look.

## Schema — `src/collections/Guides.ts` additions (all optional)

- `heroSub` — textarea. Hero subtitle paragraph.
- `heroCaption` — text. Photo credit line (e.g. "Jany · Pince Sans Rire 7b+").
- `stats` — array `{ value: text, label: text }`. Stats bar under the hero (~4 items).
- `about` — group:
  - `headline` — textarea. One display line per row; a line wrapped in `*asterisks*`
    renders in red (e.g. `CLIMB / BETTER, / HARDER, / *MORE.*`).
  - `facts` — array `{ label: text, value: text }`. Facts card rows.
  - `quote` — textarea. Coach quote block.
  - `quoteAttribution` — text (e.g. "— Jany, on how he coaches").
- `coaching` — group `{ intro: textarea, pillars: array { title: text, body: textarea } }`.
  Rendered as the numbered 01–04 pillar grid. Heading auto-derived:
  `WHAT {FIRSTNAME} COACHES`.
- `achievements` — group `{ intro: textarea, items: array { route: text, location: text, grade: text } }`.
  Heading: `ON THE ROCK`.
- `testimonial` — group `{ quote: textarea, name: text, tripLine: text }`.
  Heading: `COACHED BY {FIRSTNAME}`; always five stars.

Existing fields reused: `role` (hero eyebrow), `content` richtext (About bio
paragraphs), `photo` (hero background), `vimeoId` (video section), `email`/`phone`
(admin-only, never rendered).

Migration created with `payload migrate:create` (never hand-written — Drizzle
snapshot required).

## Page composition (wireframe order)

1. **GuideHero** (restyled) — eyebrow = `role`, giant two-line Bebas name (last word
   on its own line, red/em), `heroSub`, button group: primary
   "Book a course with {firstname} →" → `#trips` anchor; ghost "Meet the full crew"
   → `/team`. `heroCaption` bottom-left.
2. **Stats bar** — new `GuideStatsBar` component (red band, Bebas numbers).
   Note: the team page's `StatsStrip` turned out to be a CTA band, not a numbers
   bar, so it is left untouched instead of parameterized.
3. **About** — two-column `who-grid`: left = section label "The Coach", stacked
   headline, bio from `content` richtext; right = facts card + coach quote block.
4. **Video** — existing Vimeo embed, kept, slotted after About (not in wireframe but
   existing content must not be dropped).
5. **What {X} coaches** — new `GuidePillars` component, same look as the team page's
   `ValuePillars` but data-driven from `coaching`.
6. **Train with {X}** (`id="trips"`) — dynamic events grid restyled to the wireframe
   trip-card look: label = event type name, event title, "See trip →" link.
   Empty state keeps the current "joins selected camps" line.
7. **Achievements** — route / location rows with right-aligned red grade.
8. **Testimonial** — centered card, five stars, quote, name, trip line.
9. **Final CTA** — "LET'S GET ON THE ROCK", body line, buttons: "Find your trip" →
   `/calendar`, "View all guides & coaches" → `/team`.

## Components

- Restyle: `GuideHero` (+ module CSS).
- New (under `src/components/marketing/team/`): `GuideStatsBar`, `GuideAbout`,
  `GuidePillars`, `GuideTrips`, `GuideAchievements`, `GuideTestimonial`,
  `GuideFinalCTA` (reuse `TeamFinalCTA` styling with per-guide copy).
- All headings use global `.section-title` / `.section-label`; buttons use
  `.btn-primary` / `.btn-ghost` / `.btn-dark` equivalents already in `styles.css`.

## Content seeding

- Jany's wireframe copy (hero, stats, about, facts, quote, pillars, achievements,
  testimonial) added to `scripts/seed.ts` and entered into the dev DB so the page is
  verifiable end-to-end.

## Testing

- Int: Guides collection accepts the new field shapes.
- E2e: update team detail assertions (section headings/order, no email in DOM),
  regenerate the guide visual snapshot if one exists (else add one mirroring
  `trip-detail-visual`).
- Full sweep: typecheck, lint, `test:int`, `test:e2e`, manual browser check of
  `/team/jany-*`, `/team`, and one trip detail page at desktop + ~390px.

## Out of scope

- Curated "Train with X" category cards (rejected in favor of dynamic grid).
- Inquiry/contact form (final CTA links to existing pages).
- Team listing page changes beyond the `StatsStrip` prop.
