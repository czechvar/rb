# Trip Detail + Team Pages — Wireframe Redesign

**Date:** 2026-07-06
**Status:** Approved
**Wireframes:** `docs/html/TRIP-COURSE/rockbusters_trip_landing_page.html` (+ per-block files in `Rockbusters trip landing page 10 BLOCKS/`), `docs/html/TEAM/rockbusters_community_guides_coaches.html`. Assets extracted to `docs/html/assets/`.

## Goal

Redesign three pages to the copywriter wireframes, reusing the Payload-editable sections that already exist:

1. `/trips/[slug]` — trip detail ("Technique & Mind Masterclass" wireframe)
2. `/team` — team list, now a full community landing page ("Your Rock. Your Limit. Broken." wireframe)
3. `/team/[slug]` — team detail (no wireframe; magazine-hero layout chosen via mockups)

## Approach (decided)

**Restyle in place.** Existing section components are evolved to the wireframe look (dark sections, Bebas Neue display type, `--rb-*` red accents — the token system shipped with the homepage). New components are built only where nothing exists. No forks/v2 copies.

Consequence: seven components shared with `/programs/[slug]` (HighlightsGrid, AudienceCards, ReviewsRow, HowToBook, WhyRockbusters, LocationBlock, FAQList) change that page too. This is intentional — one visual generation across the site. `/programs` is visually checked after each shared-section restyle.

## Decisions log

| Question | Decision |
|---|---|
| Wireframe "Which Format?" block (no Payload field) | **Skip.** Add later if the copywriter confirms it. |
| Guide cards need tagline + tags | **Add `Guides.tagline` + `Guides.tags`** (only schema change in this work). |
| Team detail layout (no wireframe) | **Magazine hero** (option A of three mockups). |
| Existing trip sections absent from wireframe | **Keep where they fit**; drop only HowToBook + WhyRockbusters (content covered elsewhere). |
| Community page vs current /team | **Replaces /team**; Friends & Ambassadors kept as smaller secondary grid. |
| Implementation strategy | **Restyle in place** (approach A). |

## Page 1 — Trip detail `/trips/[slug]`

Section order (all data from existing `Events` fields — zero schema changes):

| # | Section | Component | Notes |
|---|---|---|---|
| 1 | Hero | `DetailHero` | Restyle: full-bleed dark, oversized Bebas title |
| 2 | Intro | `SectionIntro` + `TripPitchBlock` | "Where Movement Meets Mind" |
| 3 | Highlights | `HighlightsGrid` | Kept extra (shared w/ programs) |
| 4 | Audience | `AudienceCards` | "Built for the 6b–8a Climber" persona cards |
| 5 | Pillars | `WhatYouLearn` | Restyled as "Three Pillars of Performance" |
| 6 | Prerequisites + CTA | `Prerequisites`, `BookingCTA` | Kept extra; one mid-page CTA |
| 7 | Typical day | `DayByDayItinerary` | Hour-by-hour schedule exists in `itinerary.days[].schedule[]` |
| 8 | Destination | `LocationBlock` | **Moved onto main page** (wireframe block 6); `/logistics` subpage keeps it too |
| 9 | Coaches | `CoachesMinimal` | "World-Class Coaches" |
| 10 | Partner, Demo | `PartnerBlock`, `DemoLessonBlock` | Kept extras |
| 11 | Reviews | `ReviewsRow` | "What Past Campers Say" |
| 12 | Logistics | `AccommodationLogistics` + `EssentialEquipment` | Restyled as "Everything Sorted" 4-card grid (Accommodation / Getting There / Gear / Group Size) |
| 13 | Gallery | `PhotoGallery` | Kept extra |
| 14 | FAQ | `FAQList` (top ~5) | **New on main page**: inline top questions + "all questions →" link to `/trips/[slug]/faq` |
| 15 | Final CTA | `BookingCTA` / `FinalCTA` | "Ready to Climb Smarter?" with dates + booking |

Dropped from the page: `HowToBook`, `WhyRockbusters` (components stay in the repo while `/programs` still imports them).

## Page 2 — Team list `/team`

Homepage pattern: hardcoded TSX sections + collection-backed feeds. Replaces the current grid page.

| # | Section | Source |
|---|---|---|
| 1 | `TeamHero` — "YOUR ROCK. YOUR LIMIT. BROKEN." | static (new) |
| 2 | `BornOnTheRock` — brand story | static (new) |
| 3 | `ValuePillars` — 6 value props | static (new) |
| 4 | `GuidesGrid` — team cards | `Guides` where `section != 'friends'`, featured-first. Card: photo w/ gradient overlay, name, red tags, tagline, link to detail |
| 5 | `StatsStrip` — "18 elite guides · 40+ destinations" | static copy (like homepage StatsBar) |
| 6 | `UpcomingTrips` — trips feed | Events + EventDates; reuses the homepage FeaturedTrips queries; card shows date range, destination, led-by, grade span, spots left, from-price |
| 7 | `FindYourTrip` — filter-style link groups | pure links into `/programs/...`, `/destinations/...`, `/calendar` — no client-side filtering |
| 8 | Friends & Ambassadors | `Guides` where `section == 'friends'`; smaller secondary grid |
| 9 | Testimonials | homepage testimonials feed (Reviews) |
| 10 | `FinalCTA` — "YOUR NEXT ROUTE STARTS HERE" | static |

## Page 3 — Team detail `/team/[slug]`

Magazine-hero layout, existing data only:

1. `GuideHero` (new) — full-bleed dark hero: red eyebrow (`role`), huge Bebas `name`, tags, `tagline` sub-line, `photo` right
2. Bio — `content` richText, readable measure
3. Vimeo — only when `vimeoId` set (unchanged behaviour)
4. `TripsWithGuide` — same trip-card design as UpcomingTrips (upgrade from text links); empty state keeps current copy
5. Final CTA — "Climb with {name}" → trips/calendar

Fix included: `generateMetadata` uses the real guide name instead of de-slugged text.

Constraint carried over from the team-pages spec: `email`/`phone` are never rendered on public pages.

## Schema change (the only one)

`Guides` gains:

- `tagline` — `textarea`, optional. Punchy one-liner for cards + detail hero.
- `tags` — `array` of `{ text: text (required) }`, optional, ~3 expected (e.g. "Sport 9b", "Basque", "UIAGM").

Migration created with `payload migrate:create` (never hand-written — Drizzle snapshot must be generated). Both fields optional: existing guides render without tags row/tagline until the copywriter fills them in.

## Testing

- **Integration (Vitest, `.env.test` DB):** new/changed queries (upcoming-trips feed reuse, guides feeds) get integration tests per the existing suite's pattern.
- **E2E (Playwright):** one spec per page — renders the section stack, key links navigate (trip FAQ link, guide card → detail, trip card → trip). Update existing trip/team e2e assertions that the redesign breaks.
- **Visual check:** `/programs/[slug]` eyeballed after each shared-component restyle.

## Out of scope

- "Which Format?" section (skipped by decision)
- Any Events schema changes
- Online payments, booking flow changes
- New URL structure (pages keep `/trips/[slug]`, `/team`, `/team/[slug]`)
- SEO redirects (tracked separately in the SEO page-mapping work)
