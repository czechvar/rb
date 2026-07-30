# Trip detail page — Figma Round 2 rebuild

**Date:** 2026-05-28
**Scope:** `/trips/[slug]` and three minimal sub-pages
**Figma source:** `RB-website-2025` file, frame `Our Trips - detail page` (`fileKey=ch2aIrEQMWVr6Q1uGorVoV`, `node-id=1232-329`)

## Goal

Rebuild the existing `/trips/[slug]` page against the Figma Round 2 design under a "hybrid" rule: **Figma drives structure and visual language, current Payload data drives content.** Cut sections from the main page that aren't in Figma and relocate them to minimal sub-pages, so the main trip page stays focused.

## Decisions

Captured during brainstorming so this spec reads standalone:

- **Scope rule:** hybrid. Figma's section order and visual language are the target. Keep existing sections that have richer data than Figma shows; only add Figma sections that bring new value.
- **Trip Inquiry Form** (Figma 1343h block): replaced by `BookingCTA` — a button that links to `/trips/[slug]/dates`. No new inquiry collection, no new email flow.
- **Off-map sections** (FAQList, EventDatesList, LocationBlock, EventAccommodationLogistics): cut from the main trip page; relocate to three minimal sub-pages.
- **HowToBook + WhyRockbusters:** keep on the main trip page at the bottom, restyled to match Figma visual language.
- **Mid-page "Decision" CTA + final CTA:** same `BookingCTA` component used twice.
- **Demo block** ("DOWN DEMO Intro"): a per-event "free demo / try-out session" pitch. New fields on Events; block hidden when not enabled.
- **Token scope:** extract only what this page needs into `styles.css`. No global design-system overhaul.
- **Breakdown:** one spec, four PR-sized slices.

## Section map: Figma → code

Read top-to-bottom against the Figma frame.

| # | Figma section (height) | Action | Component |
|---|---|---|---|
| 1 | HEADER (1204h) | Restyle in slice 4 | `MarketingShell` Header + `DetailHero` overlay |
| 2 | INTRO FRAME (SH1 no-eyebrow, 205h) | New primitive | `SectionIntro` |
| 3 | TEXT 1-col + button (415h) | New | `TripPitchBlock` |
| 4 | "Who this camp for" (983h) | Restyle | `AudienceCards` |
| 5 | INTRO + CARD_3 col (594h) | Restyle | `HighlightsGrid` |
| 6 | FILLER_Daily flow (1299h) | Restyle | `DayByDayItinerary` |
| 7 | INTRO + INTRO + CARD_3 col (799h) | Restyle | `WhatYouLearn` rendered as 3-card grid |
| 8 | FILLER_Decision + BIG CTA (940h) | New | `BookingCTA` (mid-page instance) |
| 9 | GUIDES INTRO FRAME (1018h) | Restyle | `CoachesMinimal` |
| 10 | DOWN DEMO Intro (1083h) | New | `DemoLessonBlock` |
| 11 | TEXT 2-col ×2 (546h) | Restyle | `Prerequisites` + `EssentialEquipment` as 2-col |
| 12 | TRIP INQUIRY FORM (1343h) | Replaced | `BookingCTA` (final instance) |
| 13 | TESTI Snippet (810h) | Restyle | `ReviewsRow` rendered as single highlight testimonial |
| 14 | BIG CTA BUTTON FRAME (786h) | Replaced | `BookingCTA` (final instance — already covered by #12) |
| 15 | INTRO + PHOTO GALLERY (1515h) | New | `PhotoGallery` (uses existing `event.gallery`) |
| 16 | FOOTER (1517h) | Restyle in slice 4 | `MarketingShell` Footer |

Sections from the current page that have **no slot** in the Figma:
`EventDatesList`, `FAQList`, `LocationBlock`, `EventAccommodationLogistics`. These are removed from `/trips/[slug]` and rendered on dedicated sub-pages (below).

## Main page structure

`/trips/[slug]` after rebuild:

```
HEADER (MarketingShell)
SectionIntro
TripPitchBlock          ← lead copy + primary "Book" CTA
AudienceCards
HighlightsGrid
DayByDayItinerary
WhatYouLearn (3-card)
BookingCTA              ← mid-page
CoachesMinimal
DemoLessonBlock         ← hidden when demoEnabled === false
Prerequisites (2-col)
EssentialEquipment (2-col)
BookingCTA              ← final
ReviewsRow (highlight)
PhotoGallery
HowToBook
WhyRockbusters
FOOTER (MarketingShell)
```

## Sub-pages

Three minimal pages, each rendering one existing section component inside `MarketingShell`. No new visual design beyond what the existing component already does — they're functional landing spots for off-map data.

| Path | Renders | Source data |
|---|---|---|
| `/trips/[slug]/dates` | `EventDatesList` (full, all upcoming) | `event-dates` filtered by event |
| `/trips/[slug]/faq` | `FAQList` | `faqs` filtered by event |
| `/trips/[slug]/logistics` | `LocationBlock` + `EventAccommodationLogistics` | `event.content`, `event.accommodation`, `event.transport` |

Each sub-page:
- Reuses `MarketingShell` with breadcrumbs `Home / Calendar / {Trip} / {Sub-page}`.
- Has a `← back to trip` link at the bottom that returns to `/trips/[slug]`.
- 404s when the parent event isn't found or isn't published.
- The trip page links *into* the sub-pages from natural slots: the `BookingCTA` button → `/dates`, a small "Read trip FAQ" link near `WhyRockbusters` → `/faq`, a "Logistics & accommodation" link inside `DayByDayItinerary` or `AudienceCards` area → `/logistics`. (Exact link placement decided during slice 3.)

## New components

### `SectionIntro`
- **Purpose:** reusable title + lead helper matching Figma's "SH1 Header with description". Used across the page wherever a section needs a centered header block.
- **Props:** `eyebrow?: string`, `title: string`, `lead?: string`, `align?: 'left' | 'center'`.
- **Data:** all from parent.

### `TripPitchBlock`
- **Purpose:** above-the-fold lead pitch + primary booking CTA.
- **Data:** `event.title`, `event.shortDescription` (existing fields).
- **CTA target:** `/trips/[slug]/dates`.

### `DemoLessonBlock`
- **Purpose:** "free demo / try-out session" pitch, per-event.
- **Render:** when `event.demoEnabled === true`, render heading + body + optional CTA. Otherwise the component returns `null` and the slot collapses.
- **New fields on `events` collection:**
  - `demoEnabled: checkbox` (default `false`)
  - `demoHeading: text` (optional)
  - `demoBody: richText` (optional)
  - `demoCta: group { label: text, url: text }` (optional)
- **Migration:** additive; existing events default to `demoEnabled: false` so behaviour is unchanged.

### `PhotoGallery`
- **Purpose:** photo strip/grid at the bottom of the trip page.
- **Data:** existing `event.gallery` (already declared as `upload, hasMany: true, relationTo: 'media'`). No new fields.
- **Layout:** matches Figma's PHOTO GALLERY block. Specific grid/carousel shape decided during slice 3 based on the Figma layout (`node-id=1468:6883`).
- **Empty state:** when `gallery.length === 0`, component returns `null`.

### `BookingCTA`
- **Purpose:** single component used twice (mid-page, final). Visually large CTA block with heading + supporting copy + button.
- **Data:** `event.title`, `event.slug`. Button label hardcoded ("Book this trip" / equivalent) initially; can become a prop later.
- **Target:** `/trips/[slug]/dates`.
- **Replaces:** the existing `EventFinalCTA` component (which is deleted in slice 3).

## Restyled components

Existing components whose visual treatment is updated to match Figma. No data-shape changes unless called out.

- `DetailHero` — restyle for Figma hero overlay (slice 1).
- `AudienceCards` — restyle for Figma "Who this camp for" pattern (slice 1).
- `HighlightsGrid` — restyle to Figma 3-col card pattern (slice 2).
- `DayByDayItinerary` — visual overhaul to Figma "Daily flow" layout (slice 2).
- `WhatYouLearn` — **render change.** Currently a rich-text block. Render as 3-card grid by treating each top-level heading inside the existing rich content as a card title and the following content as the card body. No new fields. If this proves too brittle in practice, follow-up adds a `whatYouLearnCards: array` field; tracked as an open question, not a blocker.
- `CoachesMinimal` — richer "meet the guides" treatment per Figma (slice 2).
- `Prerequisites` — render as 2-col text per Figma (slice 3).
- `EssentialEquipment` — render as 2-col text per Figma (slice 3).
- `ReviewsRow` — render as single highlight testimonial per Figma (slice 3). Component picks the first published review by `position`; rest become available on a future review-archive page (out of scope here).
- `HowToBook` — restyle to Figma visual language (slice 3).
- `WhyRockbusters` — restyle to Figma visual language (slice 3).

## Components removed from the trip page

These remain in code (they're rendered by the sub-pages), but their import is removed from `src/app/(frontend)/trips/[slug]/page.tsx`:

- `EventDatesList`
- `FAQList`
- `LocationBlock`
- `EventAccommodationLogistics`
- `EventFinalCTA` (deleted entirely — replaced by `BookingCTA`)

## Visual primitives in `styles.css`

Narrow scope: only what this page needs.

- **Type ramp:** diff Figma's H1/H2/H3/body sizes against current `--h1FontSize`, `--h2FontSize`, `--h3FontSize`, `--bodyFontSize`. Update tokens only where Figma diverges. Don't touch unrelated tokens.
- **Spacing rhythm:** the Figma uses consistent vertical spacing between sections. Add 2–3 spacing tokens (`--section-gap-lg`, `--section-gap-md`, `--section-gap-sm`) and apply to section wrappers.
- **Card primitives:** the 3-col card pattern is reused (HighlightsGrid, WhatYouLearn). Extract a base card style — either a `.card` class in a shared `_primitives.module.css` or a small `<Card />` wrapper component. Decision deferred to slice 2 when both card uses land; first one informs the second.
- **Button styles:** verify the primary CTA against Figma; update if it diverges. Don't redesign buttons globally.

Nothing else gets touched. `MarketingShell` colours, neutrals, status colours, etc. stay as they are until slice 4 (where the shell itself is restyled).

## Slice breakdown

Four PR-sized chunks. Each ships under one spec; we re-evaluate between slices.

### Slice 1 — Foundations & top of page

- Diff Figma type ramp against current tokens; update divergent tokens in `styles.css`.
- Add section-gap spacing tokens.
- Build `SectionIntro` primitive.
- Build `TripPitchBlock` component.
- Restyle `DetailHero` to Figma hero overlay.
- Restyle `AudienceCards` to Figma "Who this camp for".
- Wire all four into `src/app/(frontend)/trips/[slug]/page.tsx`.
- **Transient state acceptable:** lower page still uses old visuals after this slice ships.

### Slice 2 — Middle content

- Extract shared card primitive (decide `<Card />` vs `.card` class on the first use).
- Restyle `HighlightsGrid` to Figma 3-col cards.
- Restyle `DayByDayItinerary` to Figma "Daily flow".
- Restyle `WhatYouLearn` as 3-card render of existing rich content.
- Build `BookingCTA`. Drop it into the mid-page "Decision" slot.
- Restyle `CoachesMinimal` to Figma "Meet your guides".
- Add `demoEnabled` + `demoHeading` + `demoBody` + `demoCta` fields to `events` collection. Generate Payload migration. Update seed where appropriate.
- Build `DemoLessonBlock`. Drop it in below `CoachesMinimal`.

### Slice 3 — Bottom of page + sub-pages

- Restyle `Prerequisites` as 2-col text.
- Restyle `EssentialEquipment` as 2-col text.
- Drop final `BookingCTA` into the page (re-use of slice-2 component).
- Restyle `ReviewsRow` as highlight testimonial.
- Build `PhotoGallery`.
- Restyle `HowToBook`.
- Restyle `WhyRockbusters`.
- Remove `EventDatesList`, `FAQList`, `LocationBlock`, `EventAccommodationLogistics` imports from `trips/[slug]/page.tsx`.
- Delete `EventFinalCTA` component (replaced).
- Build sub-pages: `/trips/[slug]/dates`, `/trips/[slug]/faq`, `/trips/[slug]/logistics`. Each is a thin route file rendering `MarketingShell` + the relevant existing section component + a back link.
- Add cross-links from the main trip page to each sub-page in natural slots.

### Slice 4 — Shell

- Restyle `MarketingShell` Header to Figma.
- Restyle `MarketingShell` Footer to Figma.
- Touches every page; ships last so any visual regression on other pages can be addressed in the same PR.

## Testing

- **Visual smoke:** Playwright screenshot test for `/trips/[slug]` against the seeded demo event. One snapshot per slice; baseline updated as visuals land.
- **Data integrity:** seed continues to render the page without errors. Defaults (`demoEnabled: false`, empty `gallery`) verified to produce hidden/collapsed sections rather than visual artefacts.
- **Sub-pages:** Playwright smoke crawls the three sub-pages for the seeded event and asserts 200 + presence of the expected section component.
- **No new unit tests** beyond what exists — components in this spec are presentational. Logic-bearing changes (Payload field additions) rely on Payload's own field validation.

## Open issues

Not blockers for starting; flagged so we can revisit if they bite.

1. **`WhatYouLearn` rich-block → card-grid render** is opportunistic. If existing rich content doesn't decompose cleanly into 3 cards per event, slice 2 may need a follow-up to add a `whatYouLearnCards: array` field with explicit per-card data. Decide during slice 2.
2. **Card primitive shape** (`<Card />` component vs shared `.card` class) decided during slice 2's first card use. Both are reasonable; pick after seeing the second card variant.
3. **Cross-link placement** from main page to sub-pages decided during slice 3 based on visual fit, not pre-committed in this spec.
4. **Booking CTA button label** hardcoded initially. If the client wants per-event override copy, becomes a prop in a follow-up.
5. **Sub-page visual polish** is deferred. They're functional stubs; a future spec can give them their own designed treatments if needed.

## Out of scope

- Real inquiry-form lead capture (replaced by booking-CTA-to-dates per decision above).
- Global design-system refactor; only tokens this page needs are touched.
- Booking/checkout flow itself — this spec wires the *entry point* to it, not the flow.
- Translation/i18n — copy stays in current language(s).
- Mobile-specific design — Figma frame is at desktop width (1920); responsive behaviour follows existing patterns in the components being restyled.
