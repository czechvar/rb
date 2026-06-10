# Trip detail page — Figma Round 3, hero only

**Date:** 2026-06-01
**Scope:** Hero of `/trips/[slug]` — image + title/lead + sidebar pricing card + tag-chip strip + transparent header overlay
**Figma source:** `RB-website-2025` file, frame `Our Trips - detail page` (`fileKey=ch2aIrEQMWVr6Q1uGorVoV`, `node-id=1232-329`). Hero is the top 1920×1204 region of that frame.
**Builds on:** [`2026-05-28-trip-detail-figma-r2-design.md`](./2026-05-28-trip-detail-figma-r2-design.md). R2 established the section list and visual language; R3 replaces the hero treatment.

## Goal

The R2 hero (`DetailHero`) is a full-bleed image with the title and a small price meta line stacked at the bottom-left. Figma R3 introduces a richer hero: title and lead on the left, a white sidebar **pricing card** on the right with structured trip metadata and a primary CTA, plus a **tag-chip strip** straddling the bottom edge of the hero. The page header is now a transparent overlay on the hero rather than the opaque white bar that sits above it.

This spec covers only those hero changes. Sections below the hero stay as they are after R2.

## Decisions captured during brainstorming

So this spec reads standalone:

- **Scope:** hero + tag chips only. Everything below the hero (Trip Highlights, *Who this camp for*, etc.) is unchanged this round.
- **Sidebar data:** all sidebar values are **hardcoded strings** in `DetailHero.tsx` for this round (price, dates summary, duration, location, level, coaches, demo callout). No Payload schema changes, no per-event variation. Data wiring is a deferred round.
- **Header treatment:** transparent overlay over the hero, flips to the existing opaque/scrolled style once the user scrolls past the hero. Implemented as a `transparent` prop on the shared `Header` (not a one-off custom header for this page).
- **Nav labels:** Figma shows two items (`Climbing Adventures`, `Destinations`) but current code has four (`Programs`, `Destinations`, `Team`, `Blog`). Renaming nav is site-wide and out of scope; keep current four labels.
- **Tag chips:** position matches Figma — pills straddle the bottom edge of the hero image (overlapping by ~50% of chip height). Hardcoded array for now.
- **Breadcrumb on this page:** suppressed. Current Breadcrumb is what pushes content below the fixed Header (`margin-top: var(--headerTotalHeight)`); skipping it on the trip detail page lets the hero naturally start at the top of the viewport. No negative-margin hacks needed.
- **Snowbusters reference:** consulted `frontend/src/components/header/AppHeader.vue`, `components/content/HeaderBanner.vue`, and `CourseModule/pages/Course.vue`. Confirmed the transparent-header + hero-starts-at-top pattern. Pricing-sidebar layout is **new** — snowbusters' detail page uses a different price-tag treatment, not a sidebar card.
- **Visual regression testing:** not in scope. The repo has no Percy/Chromatic infra and adding it is scope creep. A Playwright smoke test covers structural correctness.

## Component plan

Files touched or added:

| File | Change |
|---|---|
| `src/components/marketing/Header.tsx` | Accept `transparent?: boolean`. When `true`, render with transparent background and the contacts bar hidden (reusing the existing `headerScrolledHide` translate). On scroll past ~80% of the hero height, flip to the existing opaque/scrolled state. Default `false` → every other page unchanged. |
| `src/components/marketing/MarketingShell.tsx` | Accept `transparentHeader?: boolean`; pass through to `Header`. When `transparentHeader` is `true`, skip rendering the `Breadcrumb` so the hero lands at the top of the viewport. |
| `src/components/marketing/marketing.module.css` | New `.headerTransparent` modifier (transparent bg + still-white text). Existing `--headerBg` / `--headerBgScrolled` vars unchanged. |
| `src/components/sections/DetailHero.tsx` + `.module.css` | Rewrite. Image + dark gradient overlay (unchanged). New 2-column grid on top: title/lead left, `PricingSidebar` right. `TagChipStrip` absolutely positioned to straddle the bottom edge. |
| `src/components/sections/PricingSidebar.tsx` + `.module.css` (new) | White rounded card with hardcoded sidebar content (price, secondary price, 5 metadata rows, demo callout, CTA). Props are plain strings + an array, not Payload types. |
| `src/components/sections/TagChipStrip.tsx` + `.module.css` (new) | Horizontal pill row. Each chip: white bg, small shadow, red icon (SVG), uppercase label. Props: `chips: { icon: string; label: string }[]`. |
| `src/app/(frontend)/trips/[slug]/page.tsx` | Pass `transparentHeader={true}` to `MarketingShell`. No other section-list changes. |

Subcomponents (`PricingSidebar`, `TagChipStrip`) take plain props so they're easy to test and easy to rewire to real data later. `DetailHero` hardcodes the Figma values inline for now.

## Visual specification

Drawn from the Figma `Our Trips - detail page` frame (1920×1204 hero region).

### Hero container

- Position: relative, full viewport width, `height: 80vh; min-height: 600px` (matches current `DetailHero.module.css`).
- Background image: `next/image` with `fill`, `object-fit: cover`, `priority`, `sizes="100vw"`.
- Dark gradient overlay above the image, slightly darker than current: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.60) 100%)`.

### Content grid

A `display: grid` overlay positioned absolutely inside the hero, constrained to `var(--contentMaxWidth)` and `var(--contentPadding)`:

- `grid-template-columns: 1fr minmax(280px, 340px);`
- `gap: 4rem;`
- `align-items: center;` (text and card both vertically centered)
- Bottom padding leaves room for the tag-chip strip (`padding-bottom: 6rem` desktop).

**Left column (text):**
- `h1` — white, weight 700, `font-size: clamp(3.2rem, 6vw, 8rem)` (one clamp covers all breakpoints; final values tuned at implementation). Multi-line, left-aligned.
- `p` (lead) — white, `--pFontSize` (current var), `max-width: 60ch`, `opacity: 0.92`.

**Right column (`PricingSidebar`):**
- White rounded card, `border-radius: 6px`, subtle drop-shadow.
- Internal padding: `2.4rem`.
- Vertical stack:
  1. Primary price (`€ 950 / 1 week`) — `~3.6rem` size, weight 700, dark text.
  2. Secondary price (`€ 1,650 for 2 weeks`) — `~1.4rem` size, weight 600, red (`var(--colPrimary)`).
  3. Caption (`per person · coaching included`) — `~1.3rem`, grey.
  4. Thin horizontal rule.
  5. 5 metadata rows. Each row is 2 columns: label (grey, ~1.3rem) left, value (dark, ~1.4rem, semi-bold) right. Vertical gap `0.8rem`.
     - `Dates` — `May 2026/2027 – see below`
     - `Duration` — `1 week / 2 weeks`
     - `Location` — `Rodellar, Aragon, Spain`
     - `Level` — `Outdoor lead 6b-8a`
     - `Coaches` — `Klemen Bečan, Jany Novotny, Pablo Ruiz Seco`
  6. Red-bordered callout chip: `1px solid var(--colPrimary)`, dark-red text, padding `1rem 1.2rem`, content `Free demo of Evolv & Singing Rock climbing equipment`.
  7. Red CTA button (`<button>` or anchor styled like the existing `joinUs` button): full-width, `BOOK YOUR SPOT →`.

### Tag-chip strip

- Container: absolute, `bottom: -2rem` (so chips overlap the hero/below-section boundary by ~50%), `left: 50%`, `transform: translateX(-50%)`.
- Pills: `display: flex; gap: 0.8rem;` row.
- Each pill:
  - Background: white.
  - Border-radius: `999px` (full pill).
  - Padding: `0.8rem 1.4rem`.
  - Drop-shadow: subtle.
  - Layout: `display: inline-flex; align-items: center; gap: 0.6rem;`.
  - Icon: red SVG, ~`1.6rem` square, `color: var(--colPrimary)`.
  - Label: dark text, uppercase, `font-size: 1.2rem`, `letter-spacing: 0.06em`, `font-weight: 600`.
- Chips for this round (hardcoded array in `DetailHero.tsx`):
  - `pin` icon — `RODELLAR, ARAGON, SPAIN`
  - `tag` icon — `SPORT CLIMBING`
  - `mountain` icon — `OUTDOOR LEAD 6b-8a`
  - `calendar` icon — `MAY 2026`
  - `gift` icon — `EVOLV & SINGING ROCK CLIMBING GEAR DEMO`

Icon SVGs: inlined in `TagChipStrip.tsx`, same approach the existing `Header.tsx` uses for its icons. Pick neutral generic icons; exact glyphs finalized at implementation.

### Header in transparent mode

- Existing styles in `marketing.module.css` stay; add a new `.headerTransparent` class applied when `transparent={true}` and the page is at/near the top of the viewport:
  ```css
  .headerTransparent {
    background-color: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  ```
- While `transparent` is true and the user is at the top, also apply `headerScrolledHide` to keep the contacts bar hidden over the hero.
- On scroll past `~80vh` (or `0.8 * window.innerHeight`, whichever is simpler), drop the `headerTransparent` class so the existing `headerScrolled` background takes over. Existing scroll listener in `Header.tsx` already maintains a `scrolled` state — extend it to track a `pastHero` boolean against the new threshold.
- Nav text and logo are already `color: var(--colLightest)` so they remain visible over both the hero image and the opaque scrolled background.

## Responsive behavior

Three breakpoints. Final pixel values tuned at implementation.

**Desktop (≥ 1024px)** — matches Figma:
- Hero grid: 1fr / 340px columns, gap 4rem.
- Tag chips: single row, centered, overlapping bottom edge.

**Tablet (768–1023px):**
- Hero grid: 1fr / 280px columns, smaller gap.
- Title shrinks via `clamp()`.
- Tag chips: wrap to second row if needed, still centered.

**Mobile (< 768px):**
- Hero grid collapses to a single column.
- `PricingSidebar` exits the absolute layer; it renders as a normal in-flow card below the hero image at full width.
- Tag chips become a horizontal scroll strip (`overflow-x: auto`, hidden scrollbar). Sits at the bottom of the hero image, no longer overlapping a boundary.
- Title font-size is unchanged at this breakpoint — the single `clamp()` from the desktop spec already handles the scale-down.

Mobile is "looks good and reads well", not pixel-perfect to a mobile Figma frame — the Figma frames we have are desktop only.

## Test plan

**Playwright smoke** — extend the existing `tests/int/trip-detail` smoke (or add a new spec file alongside it):
- `/trips/<seeded-slug>` returns 200.
- Hero title text from the seeded event is in the DOM.
- A `BOOK YOUR SPOT` button is visible.
- At least one tag-chip label (`SPORT CLIMBING`) is in the DOM.
- The Header renders (logo is in the DOM) and the breadcrumb is **not** present on the trip detail page.

**No unit tests** for the new presentational components. They take plain props and have no logic; the smoke test covers their structural rendering. Unit tests come in when we wire real data in a follow-up round.

**Manual verification before declaring done** (per CLAUDE.md UI-changes rule):
- Run `pnpm dev`, open `/trips/<slug>` in a browser.
- Eyeball desktop and mobile widths.
- Confirm header is transparent on the hero and flips to opaque past it.
- Confirm chips and sidebar render with correct copy.
- No console errors.
- Spot-check `/`, `/calendar`, and an account page — confirm the Header looks unchanged there (no regressions from the new `transparent` prop default).

## Out of scope

- Wiring sidebar fields to Payload (Dates summary, Duration, Level, Coaches list, Demo callout). Deferred to a follow-up round once schema additions are agreed.
- Changing nav labels to match Figma's two-item nav.
- Adding the new `TRIP INQUIRY FORM` section that exists in Figma — that's a separate round.
- Bringing other lower sections fully in line with Figma — they're acceptable as R2 left them.
- Mobile pixel-perfect tuning to a mobile Figma frame.
- Visual regression / screenshot tests.

## Open questions

None blocking. Documented for the follow-up round:

- What is the canonical mapping from Payload `Event` + `EventDate` fields to the sidebar rows? (Some — `Duration`, `Level`, `Demo callout` — probably need new Payload fields.)
- Should the breadcrumb reappear somewhere on the trip detail page (e.g., over the hero in a subdued style) for SEO / wayfinding?
- Do we want to ship the Figma nav label changes (`Climbing Adventures`, removing `Team`/`Blog`) as their own round?
