# Trip Detail Page — Figma Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/trips/[slug]` and add three sub-pages to match the Figma Round 2 design, executing in four PR-sized slices.

**Architecture:** Hybrid rebuild — Figma drives section structure and visual language; current Payload data drives content. Each slice is independently shippable. Slice 1 lays foundations (tokens, primitives, top of page). Slice 2 does middle content + a per-event Demo block (additive Payload migration). Slice 3 does bottom of page, adds three minimal sub-pages, and deletes the old `EventFinalCTA`. Slice 4 restyles the global `MarketingShell` Header/Footer and ships last because it touches every page.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS modules, Payload CMS 3, Postgres, Playwright (e2e), Vitest (integration). Package manager: `pnpm`. CSS tokens at `1rem = 10px`.

**Spec:** `docs/superpowers/specs/2026-05-28-trip-detail-figma-r2-design.md`

---

## Pre-flight reference

Read these before starting any slice — they answer "how do I do X here":

- **Spec:** `docs/superpowers/specs/2026-05-28-trip-detail-figma-r2-design.md` (decisions, section map, open issues).
- **Tokens:** `src/app/(frontend)/styles.css` (lines 1–138 are the desktop + mobile token roots).
- **Current trip page:** `src/app/(frontend)/trips/[slug]/page.tsx` — wires the section components together.
- **Shell:** `src/components/marketing/{Header,Footer,MarketingShell,Breadcrumb}.tsx`.
- **Events collection:** `src/collections/Events.ts` (field shapes the components read).
- **Existing migration format:** `src/migrations/20260527_125021.ts` — raw `sql\`...\`` blocks via `@payloadcms/db-postgres`; both `up` and `down` are written by hand.
- **Playwright tests:** `tests/e2e/` (run with `pnpm test:e2e`).

**Figma file:** `fileKey=ch2aIrEQMWVr6Q1uGorVoV`. Frame: `node-id=1232:329`. When a task says "Reference Figma node X:Y" use:

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=X:Y
```

Key node IDs (collected from `get_metadata` on the parent frame):

| Section | Node ID |
|---|---|
| HEADER (site nav + page hero) | `5108:15087` |
| INTRO FRAME level2 (SH1 no eyebrow) | `1465:5403` |
| TEXT 1-col + button (SH1 + button) | `5147:7892` |
| Who this camp for | `5109:5726` |
| CARD_3 col (first — Highlights) | `5110:6514` |
| FILLER_Daily flow | `5110:7089` |
| CARD_3 col (second — WhatYouLearn) | `5110:7144` |
| FILLER_Decision + BIG CTA | `5110:7789` |
| GUIDES INTRO FRAME | `1468:6898` |
| DOWN DEMO Intro | `1465:7528` |
| TEXT 2-col (Prerequisites/Equipment) | `1468:6051`, `1468:6064` |
| TRIP INQUIRY FORM area | `1465:5411` |
| TESTI Snippet | `1468:6951` |
| BIG CTA BOTTON FRAME | `1468:7516` |
| PHOTO GALLERY | `1468:6881` |
| FOOTER | `1463:25077` |

**Commit conventions** (see `git log --oneline -10`): conventional-commit prefix, lowercase scope, present-tense. Examples: `feat(trip-detail): add SectionIntro primitive`, `fix(audience-cards): align spacing to Figma`. Use `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` if running via an agent.

---

# Slice 1 — Foundations & top of page

Lands `--sectionGap*` spacing tokens, `SectionIntro` primitive, `TripPitchBlock`, and restyles `DetailHero` + `AudienceCards`. Lower page still uses old visuals (transient state — fine).

### Task 1.1: Diff Figma type ramp & add spacing tokens

**Files:**
- Modify: `src/app/(frontend)/styles.css` (token block, lines 1–138)

- [ ] **Step 1: Fetch Figma context for the section-header pattern**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=1465:5403
```

Read out the H1/H2/H3 font sizes, line heights, letter spacing. Compare to the current values in `styles.css`:

- `--h1FontSize: 12rem`, `--h1LineHeight: 11rem`
- `--h2FontSize: 4.1rem`, `--h2LineHeight: 4.8rem`
- `--h3FontSize: 3.6rem`, `--h3LineHeight: 3.8rem`
- `--pFontSize: 2rem`, `--textLineHeight: 2.8rem`

- [ ] **Step 2: Update divergent tokens only**

For each H1/H2/H3/body token where the Figma value differs from the current value, update the value in `styles.css`. Also update the matching mobile override block at lines 117–138 if the Figma's mobile/responsive sizes differ. Do NOT touch tokens that already match. Do NOT introduce new typography tokens beyond what the section header pattern uses.

- [ ] **Step 3: Add sectionGap spacing tokens**

In the `:root` block (after `--gap: 1rem;` at line 105), add:

```css
  /* Section rhythm (Figma round 2) */
  --sectionGapLg: 12rem;
  --sectionGapMd: 8rem;
  --sectionGapSm: 4rem;
```

Mobile override (inside the `@media screen and (max-width: 767px)` block at lines 117–138):

```css
    --sectionGapLg: 8rem;
    --sectionGapMd: 5rem;
    --sectionGapSm: 3rem;
```

(Adjust the desktop values to match the Figma's measured vertical gaps between section frames. The above are starting values from the metadata; verify against the Figma's actual gap pixels.)

- [ ] **Step 4: Visual sanity check**

Run `pnpm dev`. Visit `/trips/<seeded-slug>`. Confirm nothing visibly regressed — only sections that use the tokens this task changed should look different. Some headings may shift in size; that's expected.

- [ ] **Step 5: Commit**

```
git add src/app/(frontend)/styles.css
git commit -m "feat(tokens): diff Figma R2 type ramp; add sectionGap tokens"
```

### Task 1.2: `SectionIntro` primitive

A reusable title + description block matching Figma's "SH1 Header with description — no eyebrow".

**Files:**
- Create: `src/components/sections/SectionIntro.tsx`
- Create: `src/components/sections/SectionIntro.module.css`

- [ ] **Step 1: Create the component**

`src/components/sections/SectionIntro.tsx`:

```tsx
import styles from './SectionIntro.module.css'

export function SectionIntro({
  eyebrow,
  title,
  lead,
  align = 'center',
}: {
  eyebrow?: string
  title: string
  lead?: string
  align?: 'left' | 'center'
}) {
  return (
    <section
      className={`${styles.intro} ${align === 'center' ? styles.center : styles.left}`}
    >
      <div className={styles.inner}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 className={styles.title}>{title}</h2>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create the styles**

`src/components/sections/SectionIntro.module.css`:

```css
.intro {
  padding: var(--sectionGapMd) var(--contentPadding);
}

.inner {
  max-width: var(--contentTextMaxWidth);
  margin: 0 auto;
}

.center {
  text-align: center;
}

.left {
  text-align: left;
}

.eyebrow {
  font-size: var(--eyebrowFontSize);
  line-height: var(--eyebrowLineHeight);
  letter-spacing: var(--eyebrowLetterSpacing);
  text-transform: uppercase;
  margin-bottom: var(--eyebrowMarginBottom);
  color: var(--colPrimary);
}

.title {
  font-size: var(--h2FontSize);
  line-height: var(--h2LineHeight);
  margin-bottom: 1.5rem;
}

.lead {
  font-size: var(--pFontSize);
  line-height: var(--textLineHeight);
  color: var(--colText);
}

@media screen and (max-width: 767px) {
  .intro {
    padding: var(--sectionGapSm) var(--contentPadding);
  }
}
```

- [ ] **Step 3: Verify import resolves**

```
pnpm exec tsc --noEmit
```

Expected: zero new errors.

- [ ] **Step 4: Commit**

```
git add src/components/sections/SectionIntro.tsx src/components/sections/SectionIntro.module.css
git commit -m "feat(sections): add SectionIntro primitive"
```

### Task 1.3: `TripPitchBlock` component

A lead-pitch block (H1-style headline + lead paragraph + primary CTA) that lives high on the trip page, derived from Figma's "TEXT 1-col + button".

**Files:**
- Create: `src/components/sections/TripPitchBlock.tsx`
- Create: `src/components/sections/TripPitchBlock.module.css`

- [ ] **Step 1: Fetch Figma context for the exact styling target**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=5147:7892
```

Note the headline size, lead paragraph treatment, button style, alignment, and surrounding padding.

- [ ] **Step 2: Create the component**

`src/components/sections/TripPitchBlock.tsx`:

```tsx
import Link from 'next/link'
import type { Event } from '@/payload-types'
import styles from './TripPitchBlock.module.css'

export function TripPitchBlock({ event }: { event: Event }) {
  return (
    <section className={styles.pitch}>
      <div className={styles.inner}>
        <h2 className={styles.headline}>{event.title}</h2>
        {event.shortDescription && (
          <p className={styles.lead}>{event.shortDescription}</p>
        )}
        <Link href={`/trips/${event.slug}/dates`} className={styles.cta}>
          Book this trip
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create the styles**

`src/components/sections/TripPitchBlock.module.css`:

```css
.pitch {
  padding: var(--sectionGapMd) var(--contentPadding);
  background: var(--colLighter);
}

.inner {
  max-width: var(--contentTextMaxWidth);
  margin: 0 auto;
  text-align: center;
}

.headline {
  font-size: var(--h2FontSize);
  line-height: var(--h2LineHeight);
  margin-bottom: 2rem;
}

.lead {
  font-size: var(--pFontSize);
  line-height: var(--textLineHeight);
  margin-bottom: 3rem;
  color: var(--colText);
}

.cta {
  display: inline-block;
  padding: 1.5rem 3rem;
  background: var(--colPrimary);
  color: var(--colTextOnPrimary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15rem;
  font-size: 1.6rem;
  transition: background var(--transitionTimeBase) ease;
}

.cta:hover {
  background: var(--colPrimaryHover);
  color: var(--colTextOnPrimaryHover);
}
```

After fetching Figma context in Step 1, refine these CSS rules to match Figma's specific button shape (border-radius, font, exact padding). The structure above is the scaffolding; Figma-specific tweaks layer on top.

- [ ] **Step 4: TypeScript verification**

```
pnpm exec tsc --noEmit
```

Expected: zero new errors.

- [ ] **Step 5: Commit**

```
git add src/components/sections/TripPitchBlock.tsx src/components/sections/TripPitchBlock.module.css
git commit -m "feat(sections): add TripPitchBlock with /dates CTA"
```

### Task 1.4: Restyle `DetailHero` to Figma

Current `DetailHero` (39 lines, see `src/components/sections/DetailHero.tsx`) has a side-aside booking pane with price + "JOIN US →" + "ASK A QUESTION". Figma's HEADER frame (node `5108:15087`) is a full-bleed hero with overlay text on imagery.

**Files:**
- Modify: `src/components/sections/DetailHero.tsx`
- Modify: `src/components/sections/DetailHero.module.css`

- [ ] **Step 1: Fetch Figma context**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=5108:15087
```

The HEADER node contains BOTH the global site header (top nav bar — slice 4 territory) and the page hero (this task's target). Read the part below the site-nav bar — typically a full-bleed image with title + sub-text + breadcrumb-ish overlay.

- [ ] **Step 2: Replace `DetailHero.tsx`**

Open `src/components/sections/DetailHero.tsx`. Replace the side-aside booking layout with a full-bleed hero. New file contents (refine Figma-derived classnames as needed):

```tsx
import Image from 'next/image'
import type { Event, EventDate } from '@/payload-types'
import styles from './DetailHero.module.css'

export function DetailHero({
  event,
  firstDate,
}: {
  event: Event
  firstDate?: EventDate
}) {
  const mainPic =
    typeof event.mainPicture === 'object' && event.mainPicture
      ? event.mainPicture
      : null

  return (
    <section className={styles.hero}>
      {mainPic?.url && (
        <Image
          src={mainPic.url}
          alt={mainPic.alt || event.title}
          fill
          priority
          className={styles.image}
          sizes="100vw"
        />
      )}
      <div className={styles.overlay} />
      <div className={styles.text}>
        <h1 className={styles.title}>{event.title}</h1>
        {event.shortDescription && (
          <p className={styles.lead}>{event.shortDescription}</p>
        )}
        {firstDate && (
          <p className={styles.meta}>
            From {firstDate.currency} {firstDate.price.toLocaleString()} · per person
          </p>
        )}
      </div>
    </section>
  )
}
```

Note: removed `JOIN US →` and `ASK A QUESTION` buttons — booking entry now lives in `TripPitchBlock` (Task 1.3) and the two `BookingCTA` instances (slice 2 / slice 3). Confirm the hero CTA is genuinely absent in Figma; if present, add a single primary CTA pointing to `/trips/${event.slug}/dates`.

- [ ] **Step 3: Replace `DetailHero.module.css`**

```css
.hero {
  position: relative;
  width: 100%;
  height: 80vh;
  min-height: 600px;
  overflow: hidden;
  color: var(--colTextOnPrimary);
}

.image {
  object-fit: cover;
  object-position: center;
  z-index: 0;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.55) 100%);
  z-index: 1;
}

.text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 var(--contentPadding) var(--sectionGapMd);
  max-width: var(--contentMaxWidth);
  margin: 0 auto;
  z-index: 2;
}

.title {
  font-size: var(--h1FontSize);
  line-height: var(--h1LineHeight);
  margin-bottom: 1.5rem;
}

.lead {
  font-size: var(--pFontSize);
  line-height: var(--textLineHeight);
  max-width: 60ch;
  margin-bottom: 2rem;
  opacity: 0.92;
}

.meta {
  font-size: var(--smallTextFontSize);
  letter-spacing: 0.1rem;
  text-transform: uppercase;
  opacity: 0.85;
}

@media screen and (max-width: 767px) {
  .hero {
    height: 70vh;
    min-height: 480px;
  }
}
```

- [ ] **Step 4: Visual check**

```
pnpm dev
```

Visit `/trips/<seeded-slug>`. Hero should be full-bleed with the seeded `mainPicture` and gradient overlay. Title/lead/price legible.

- [ ] **Step 5: Commit**

```
git add src/components/sections/DetailHero.tsx src/components/sections/DetailHero.module.css
git commit -m "feat(detail-hero): restyle to Figma R2 full-bleed hero"
```

### Task 1.5: Restyle `AudienceCards` to Figma "Who this camp for"

`AudienceCards` already exists. Figma node `5109:5726` shows a "Who this camp for" section with what looks like 3 columns of audience profiles + a possible callout.

**Files:**
- Modify: `src/components/sections/AudienceCards.tsx` (only if structural changes needed; otherwise CSS-only)
- Modify: `src/components/sections/AudienceCards.module.css`

- [ ] **Step 1: Fetch Figma context**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=5109:5726
```

- [ ] **Step 2: Read current implementation**

```
cat src/components/sections/AudienceCards.tsx
cat src/components/sections/AudienceCards.module.css
```

The Events collection exposes `audienceCards` as an array of `{ heading, body, highlighted }`. Figma's "highlighted" treatment likely shows a featured card (per the `highlighted: boolean` field).

- [ ] **Step 3: Update the CSS** to match Figma — typography, card padding, gap between cards, highlighted-card treatment (likely red background or border per the rockbusters palette). Keep `.tsx` structure if it already maps onto the data. If Figma shows a section title above the cards, ensure the JSX has a `<SectionIntro>` (or inline `h2`) above the grid.

- [ ] **Step 4: Wire `SectionIntro` above the cards if missing**

If the current `AudienceCards` has its own heading markup, replace it with a `<SectionIntro title="Who this camp for" lead={...} />` (Task 1.2 component). Pass the lead from a new optional prop, or from `event.audienceLead` if you decide to add a field (don't add the field in this slice — pass via prop).

- [ ] **Step 5: Visual check + commit**

```
pnpm dev
# Visit /trips/<seeded-slug>, verify audience section
git add src/components/sections/AudienceCards.tsx src/components/sections/AudienceCards.module.css
git commit -m "feat(audience-cards): restyle to Figma R2 'Who this camp for'"
```

### Task 1.6: Wire new components into the trip page

**Files:**
- Modify: `src/app/(frontend)/trips/[slug]/page.tsx`

- [ ] **Step 1: Add imports**

```ts
import { SectionIntro } from '@/components/sections/SectionIntro'
import { TripPitchBlock } from '@/components/sections/TripPitchBlock'
```

- [ ] **Step 2: Insert components in the JSX**

Between `<DetailHero ... />` and `<HighlightsGrid ... />` (lines 69–70 of the current file), insert:

```tsx
<SectionIntro title={event.title} lead={event.shortDescription ?? undefined} />
<TripPitchBlock event={event} />
```

The exact text passed to `SectionIntro` may differ from `event.title` — refine when content is finalized (treat as placeholder copy hook).

- [ ] **Step 3: Visual check**

```
pnpm dev
```

Visit `/trips/<seeded-slug>`. Confirm DetailHero → SectionIntro → TripPitchBlock → HighlightsGrid order renders.

- [ ] **Step 4: Commit**

```
git add src/app/(frontend)/trips/[slug]/page.tsx
git commit -m "feat(trip-detail): wire SectionIntro + TripPitchBlock into /trips/[slug]"
```

### Task 1.7: Slice 1 Playwright screenshot baseline

**Files:**
- Create or Modify: `tests/e2e/trip-detail-visual.spec.ts`

- [ ] **Step 1: Inspect existing Playwright config**

```
cat playwright.config.ts
ls tests/e2e/
```

- [ ] **Step 2: Add or update the spec**

If `tests/e2e/trip-detail-visual.spec.ts` doesn't exist, create it:

```ts
import { test, expect } from '@playwright/test'

const SLUG = 'tatra-sport-climbing' // adjust to actual seed slug

test('trip detail page renders (slice 1 baseline)', async ({ page }) => {
  await page.goto(`/trips/${SLUG}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page).toHaveScreenshot('trip-detail-slice-1.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
```

Confirm the slug exists in your seed file (`scripts/seed.ts`). Adjust as needed.

- [ ] **Step 3: Generate baseline**

```
pnpm test:e2e -- --update-snapshots tests/e2e/trip-detail-visual.spec.ts
```

Expected: snapshot file `trip-detail-slice-1.png` written.

- [ ] **Step 4: Re-run to verify it passes**

```
pnpm test:e2e tests/e2e/trip-detail-visual.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```
git add tests/e2e/trip-detail-visual.spec.ts tests/e2e/trip-detail-visual.spec.ts-snapshots/
git commit -m "test(trip-detail): slice 1 visual baseline"
```

---

# Slice 2 — Middle content

Prerequisite: Slice 1 shipped. `--sectionGap*` tokens + `SectionIntro` are available.

### Task 2.1: Shared Card primitive

**Decision (committed):** Use a `<Card />` React component, not a `.card` CSS class. Reasoning: components compose cleanly with TypeScript prop types; the card pattern is reused across `HighlightsGrid` (icon + text) and `WhatYouLearn` (heading + bullets) — these have different inner content so a component with `children` slot is cleaner than a class.

**Files:**
- Create: `src/components/sections/Card.tsx`
- Create: `src/components/sections/Card.module.css`

- [ ] **Step 1: Fetch Figma context for the card 3-col pattern**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=5110:6514
```

Note: card background, border, radius, padding, gap-between-cards, icon area treatment.

- [ ] **Step 2: Create the component**

`src/components/sections/Card.tsx`:

```tsx
import styles from './Card.module.css'

export function Card({
  variant = 'default',
  children,
}: {
  variant?: 'default' | 'highlighted'
  children: React.ReactNode
}) {
  return (
    <div className={`${styles.card} ${variant === 'highlighted' ? styles.highlighted : ''}`}>
      {children}
    </div>
  )
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid}>{children}</div>
}
```

- [ ] **Step 3: Create the styles**

`src/components/sections/Card.module.css`:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem;
  max-width: var(--contentTextMaxWidth);
  margin: 0 auto;
  padding: 0 var(--contentPadding);
}

.card {
  background: var(--colLightest);
  border: 1px solid var(--colLight);
  border-radius: 0.4rem;
  padding: 4rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.highlighted {
  background: var(--colPrimary);
  color: var(--colTextOnPrimary);
  border-color: var(--colPrimary);
}

@media screen and (max-width: 767px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .card {
    padding: 3rem 2.5rem;
  }
}
```

Refine these values against the Figma node from Step 1.

- [ ] **Step 4: Type check + commit**

```
pnpm exec tsc --noEmit
git add src/components/sections/Card.tsx src/components/sections/Card.module.css
git commit -m "feat(sections): add Card + CardGrid primitives"
```

### Task 2.2: Restyle `HighlightsGrid` using Card

**Files:**
- Modify: `src/components/sections/HighlightsGrid.tsx`
- Modify: `src/components/sections/HighlightsGrid.module.css`

- [ ] **Step 1: Replace `HighlightsGrid.tsx`**

```tsx
import type { Event } from '@/payload-types'
import { Card, CardGrid } from './Card'
import { SectionIntro } from './SectionIntro'
import styles from './HighlightsGrid.module.css'

export function HighlightsGrid({
  items,
  heading = 'Trip Highlights',
}: {
  items?: Event['highlights']
  heading?: string
}) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <SectionIntro title={heading} />
      <CardGrid>
        {items.map((h, i) => (
          <Card key={i}>
            <span className={styles.icon}>✓</span>
            <p className={styles.text}>{h.text}</p>
          </Card>
        ))}
      </CardGrid>
    </section>
  )
}
```

Note: the props type changed from `Type['highlights']` to `Event['highlights']` — the original import was likely stale. Verify the actual collection slug matches `@/payload-types` after the next `generate:types` run.

- [ ] **Step 2: Trim `HighlightsGrid.module.css`** down to only what's still used (the icon and text styles); remove old `.grid` and `.card` rules (now in `Card.module.css`).

```css
.section {
  padding: var(--sectionGapMd) 0;
}

.icon {
  font-size: 3rem;
  color: var(--colPrimary);
  line-height: 1;
}

.text {
  font-size: var(--pFontSize);
  line-height: var(--textLineHeight);
  margin: 0;
}
```

- [ ] **Step 3: Visual + commit**

```
pnpm dev  # spot-check
git add src/components/sections/HighlightsGrid.tsx src/components/sections/HighlightsGrid.module.css
git commit -m "feat(highlights): restyle via Card primitive"
```

### Task 2.3: Restyle `DayByDayItinerary` to "Daily flow"

The Figma "Daily flow" (node `5110:7089`) replaces the current day-by-day list with a vertical timeline / flow layout (likely numbered days with image + heading + meta-line + schedule rows).

**Files:**
- Modify: `src/components/sections/DayByDayItinerary.tsx`
- Modify: `src/components/sections/DayByDayItinerary.module.css`

- [ ] **Step 1: Fetch Figma context**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=5110:7089
```

- [ ] **Step 2: Read the current implementation**

```
cat src/components/sections/DayByDayItinerary.tsx
cat src/components/sections/DayByDayItinerary.module.css
```

The data shape is fixed (`event.itinerary.days[]` with `dayBadge`, `destinationName`, `metaLine`, `eyebrow`, `heading`, `description`, `highlightTags[]`, `schedule[]`, `image`). The restyle is presentational — adjust JSX and CSS to flow each day vertically per Figma.

- [ ] **Step 3: Refactor JSX** to use the Figma's flow pattern. Typical pattern:

```tsx
<section className={styles.section}>
  <SectionIntro
    title="Daily flow"
    lead={data?.intro ?? undefined}
  />
  <ol className={styles.flow}>
    {data?.days?.map((day, i) => (
      <li key={i} className={styles.day}>
        {/* day badge, image, heading, schedule */}
      </li>
    ))}
  </ol>
</section>
```

Refine inner JSX from the Figma context. Keep the existing prop interface (`data: Event['itinerary']`).

- [ ] **Step 4: CSS to match Figma** (vertical timeline, day connectors, image treatment).

- [ ] **Step 5: Visual + commit**

```
git add src/components/sections/DayByDayItinerary.tsx src/components/sections/DayByDayItinerary.module.css
git commit -m "feat(itinerary): restyle to Figma 'Daily flow' layout"
```

### Task 2.4: Restyle `WhatYouLearn` (with data-shape clarification)

**Discovery:** The spec says "render existing rich content as 3-card grid". But the actual `whatYouLearn` data shape (see `src/collections/Events.ts:99-118`) is a **group with two boxes** (`box1Heading`/`box1Bullets`, `box2Heading`/`box2Bullets`), not 3 cards and not rich content. The plan therefore renders **2 cards** (one per box), with optional intro paragraph above. Flag this as an open issue (see "Open issues" at the end) — if content wants 3 cards, the migration in slice 2 should add a `box3*` set.

**Files:**
- Modify: `src/components/sections/WhatYouLearn.tsx`
- Modify: `src/components/sections/WhatYouLearn.module.css`

- [ ] **Step 1: Fetch Figma context**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=5110:7144
```

If Figma genuinely shows 3 cards, surface this in your slice-2 PR description so it can be resolved before merging. If 2 cards fit visually, ship 2-card.

- [ ] **Step 2: Replace `WhatYouLearn.tsx`**

```tsx
import type { Event } from '@/payload-types'
import { Card, CardGrid } from './Card'
import { SectionIntro } from './SectionIntro'
import styles from './WhatYouLearn.module.css'

export function WhatYouLearn({ data }: { data?: Event['whatYouLearn'] }) {
  if (!data) return null
  const boxes = [
    data.box1Heading && {
      heading: data.box1Heading,
      bullets: data.box1Bullets ?? [],
    },
    data.box2Heading && {
      heading: data.box2Heading,
      bullets: data.box2Bullets ?? [],
    },
  ].filter(Boolean) as { heading: string; bullets: { text: string }[] }[]

  if (!boxes.length) return null

  return (
    <section className={styles.section}>
      <SectionIntro
        title="What you'll learn"
        lead={data.intro ?? undefined}
      />
      <CardGrid>
        {boxes.map((box, i) => (
          <Card key={i}>
            <h3 className={styles.heading}>{box.heading}</h3>
            <ul className={styles.bullets}>
              {box.bullets.map((b, j) => (
                <li key={j}>{b.text}</li>
              ))}
            </ul>
          </Card>
        ))}
      </CardGrid>
    </section>
  )
}
```

Note: the CardGrid CSS currently uses `repeat(3, 1fr)`. For a 2-card case, add a `cols={2}` prop variant to CardGrid OR add a custom wrapper class — pick the simpler path. If two cards in a 3-col grid look fine visually (with the third column blank), leave it; otherwise add the prop.

- [ ] **Step 3: Trim `WhatYouLearn.module.css`**

```css
.section {
  padding: var(--sectionGapMd) 0;
}

.heading {
  font-size: var(--h4FontSize);
  line-height: var(--h4LineHeight);
  margin-bottom: 1.5rem;
}

.bullets {
  list-style: disc inside;
  font-size: var(--pFontSize);
  line-height: var(--textLineHeight);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
```

- [ ] **Step 4: Commit**

```
git add src/components/sections/WhatYouLearn.tsx src/components/sections/WhatYouLearn.module.css
git commit -m "feat(what-you-learn): restyle to Card grid (2 cards from current data)"
```

### Task 2.5: Build `BookingCTA` component

**Files:**
- Create: `src/components/sections/BookingCTA.tsx`
- Create: `src/components/sections/BookingCTA.module.css`

- [ ] **Step 1: Fetch Figma context for mid-page (Decision) CTA**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=5110:7789
```

- [ ] **Step 2: Create the component**

```tsx
import Link from 'next/link'
import type { Event } from '@/payload-types'
import styles from './BookingCTA.module.css'

export function BookingCTA({
  event,
  heading = 'Ready to join?',
  body,
}: {
  event: Event
  heading?: string
  body?: string
}) {
  return (
    <section className={styles.cta}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>{heading}</h2>
        {body && <p className={styles.body}>{body}</p>}
        <Link href={`/trips/${event.slug}/dates`} className={styles.button}>
          Book this trip →
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create the styles**

```css
.cta {
  padding: var(--sectionGapLg) var(--contentPadding);
  background: var(--colPrimaryDark);
  color: var(--colTextOnPrimary);
}

.inner {
  max-width: var(--contentTextMaxWidth);
  margin: 0 auto;
  text-align: center;
}

.heading {
  font-size: var(--h2FontSize);
  line-height: var(--h2LineHeight);
  margin-bottom: 2rem;
}

.body {
  font-size: var(--pFontSize);
  line-height: var(--textLineHeight);
  margin-bottom: 3rem;
  opacity: 0.92;
}

.button {
  display: inline-block;
  padding: 1.8rem 3.6rem;
  background: var(--colPrimary);
  color: var(--colTextOnPrimary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15rem;
  font-size: 1.6rem;
  transition: background var(--transitionTimeBase) ease;
}

.button:hover {
  background: var(--colPrimaryHover);
  color: var(--colTextOnPrimaryHover);
}
```

- [ ] **Step 4: Commit**

```
git add src/components/sections/BookingCTA.tsx src/components/sections/BookingCTA.module.css
git commit -m "feat(sections): add BookingCTA component"
```

### Task 2.6: Wire mid-page BookingCTA

**Files:**
- Modify: `src/app/(frontend)/trips/[slug]/page.tsx`

- [ ] **Step 1: Add import**

```ts
import { BookingCTA } from '@/components/sections/BookingCTA'
```

- [ ] **Step 2: Insert mid-page**

Per spec section map, the mid-page CTA sits between `WhatYouLearn` and `CoachesMinimal`. Insert:

```tsx
<BookingCTA event={event} />
```

between those two existing components.

- [ ] **Step 3: Commit**

```
git add src/app/(frontend)/trips/[slug]/page.tsx
git commit -m "feat(trip-detail): drop mid-page BookingCTA"
```

### Task 2.7: Restyle `CoachesMinimal`

Figma node `1468:6898` shows a "Meet your guides" pattern (intro + guide cards or row).

**Files:**
- Modify: `src/components/sections/CoachesMinimal.tsx`
- Modify: `src/components/sections/CoachesMinimal.module.css`

- [ ] **Step 1: Fetch Figma context**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=1468:6898
```

- [ ] **Step 2: Read current implementation**

```
cat src/components/sections/CoachesMinimal.tsx
```

Current props: `{ coaches, framing, teamBullets }`. The restyle is presentational — match Figma's intro paragraph + guide row layout. Keep the prop interface.

- [ ] **Step 3: Update JSX + CSS** to match Figma. Use `SectionIntro` for the section heading.

- [ ] **Step 4: Commit**

```
git add src/components/sections/CoachesMinimal.tsx src/components/sections/CoachesMinimal.module.css
git commit -m "feat(coaches): restyle to Figma 'Meet your guides'"
```

### Task 2.8: Add demo fields to Events + migration

**Files:**
- Modify: `src/collections/Events.ts`
- Create: `src/migrations/<TIMESTAMP>.ts`
- Modify: `src/migrations/index.ts`

- [ ] **Step 1: Add fields to `Events.ts`**

In the `fields:` array (after the existing `partnerBenefits` array around line 220, before the status/sidebar block at line 222), insert:

```ts
    // Demo / try-out session (Figma "DOWN DEMO Intro")
    {
      name: 'demoEnabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Show free demo block on detail page',
    },
    { name: 'demoHeading', type: 'text' },
    { name: 'demoBody', type: 'richText' },
    {
      name: 'demoCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
```

- [ ] **Step 2: Generate the timestamp + create the migration file**

The migration filename pattern is `YYYYMMDD_HHMMSS.ts` (see `src/migrations/20260527_125021.ts`). Pick a timestamp newer than the latest existing migration. Create `src/migrations/<TIMESTAMP>.ts`:

```ts
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" ADD COLUMN "demo_enabled" boolean DEFAULT false;
    ALTER TABLE "events" ADD COLUMN "demo_heading" varchar;
    ALTER TABLE "events" ADD COLUMN "demo_body" jsonb;
    ALTER TABLE "events" ADD COLUMN "demo_cta_label" varchar;
    ALTER TABLE "events" ADD COLUMN "demo_cta_url" varchar;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "demo_cta_url";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "demo_cta_label";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "demo_body";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "demo_heading";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "demo_enabled";
  `)
}
```

Verify the actual table name by checking `src/migrations/<latest>.ts` patterns or by running `pnpm payload migrate:status`. If the `events` table is named differently (e.g. `events_published` or schema-qualified), adjust.

- [ ] **Step 3: Register the migration**

Open `src/migrations/index.ts` and add the new migration to the exports following the existing pattern (read the file first to confirm the format — typically `export { up, down } from './YYYYMMDD_HHMMSS'`).

- [ ] **Step 4: Run the migration locally**

```
pnpm payload migrate
```

Expected: migration applied, no errors. Then verify down:

```
pnpm payload migrate:down
pnpm payload migrate
```

Both directions should succeed.

- [ ] **Step 5: Regenerate types**

```
pnpm generate:types
```

Confirm `Event` type in `src/payload-types.ts` now has `demoEnabled`, `demoHeading`, `demoBody`, `demoCta` fields.

- [ ] **Step 6: Commit**

```
git add src/collections/Events.ts src/migrations/<TIMESTAMP>.ts src/migrations/index.ts src/payload-types.ts
git commit -m "feat(events): add demo block fields + migration"
```

### Task 2.9: Build `DemoLessonBlock` component + wire

**Files:**
- Create: `src/components/sections/DemoLessonBlock.tsx`
- Create: `src/components/sections/DemoLessonBlock.module.css`
- Modify: `src/app/(frontend)/trips/[slug]/page.tsx`

- [ ] **Step 1: Fetch Figma context**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=1465:7528
```

- [ ] **Step 2: Create the component**

```tsx
import type { Event } from '@/payload-types'
import { SectionIntro } from './SectionIntro'
import styles from './DemoLessonBlock.module.css'

export function DemoLessonBlock({ event }: { event: Event }) {
  if (!event.demoEnabled) return null
  const heading = event.demoHeading ?? 'Try before you commit'
  const cta = event.demoCta
  return (
    <section className={styles.demo}>
      <SectionIntro title={heading} />
      {/* event.demoBody is a Lexical rich text root; render via existing rich-text renderer.
          If the project uses @payloadcms/richtext-lexical's serializer, import it here. */}
      {event.demoBody && (
        <div className={styles.body}>
          {/* TODO: render Lexical rich text. Check existing usage e.g. in LocationBlock.tsx for the pattern. */}
          <pre>{JSON.stringify(event.demoBody, null, 2)}</pre>
        </div>
      )}
      {cta?.url && cta.label && (
        <a className={styles.cta} href={cta.url}>
          {cta.label}
        </a>
      )}
    </section>
  )
}
```

**Note:** the rich-text render in Step 2 is intentionally a placeholder so the engineer reads the project's existing Lexical render pattern (likely in `LocationBlock.tsx`) and copies it. Don't ship the `<pre>` — replace with the project's serializer call. If no existing renderer exists, the simplest is `@payloadcms/richtext-lexical`'s built-in HTML serializer.

- [ ] **Step 3: Create the styles**

```css
.demo {
  padding: var(--sectionGapMd) var(--contentPadding);
  background: var(--colLightest);
}

.body {
  max-width: var(--contentTextMaxWidth);
  margin: 0 auto;
  font-size: var(--pFontSize);
  line-height: var(--textLineHeight);
}

.cta {
  display: inline-block;
  margin: 3rem auto 0;
  padding: 1.5rem 3rem;
  background: var(--colPrimary);
  color: var(--colTextOnPrimary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15rem;
}
```

- [ ] **Step 4: Wire into page**

In `src/app/(frontend)/trips/[slug]/page.tsx`, add import:

```ts
import { DemoLessonBlock } from '@/components/sections/DemoLessonBlock'
```

Insert below `<CoachesMinimal ... />` and above `<ReviewsRow ... />`:

```tsx
<DemoLessonBlock event={event} />
```

- [ ] **Step 5: Verify**

Seed event has `demoEnabled: false` → component returns `null` → no visual change. Manually toggle one seed event's `demoEnabled` to `true` in the Payload admin and confirm the block renders.

- [ ] **Step 6: Commit**

```
git add src/components/sections/DemoLessonBlock.tsx src/components/sections/DemoLessonBlock.module.css src/app/(frontend)/trips/[slug]/page.tsx
git commit -m "feat(sections): add DemoLessonBlock; wire below CoachesMinimal"
```

### Task 2.10: Slice 2 Playwright baseline update

**Files:**
- Modify: `tests/e2e/trip-detail-visual.spec.ts`

- [ ] **Step 1: Update the snapshot name**

```ts
await expect(page).toHaveScreenshot('trip-detail-slice-2.png', {
  fullPage: true,
  maxDiffPixelRatio: 0.02,
})
```

(Or keep one snapshot per slice — rename `slice-1` to `slice-2` if you only want a single rolling baseline.)

- [ ] **Step 2: Regenerate baseline**

```
pnpm test:e2e -- --update-snapshots tests/e2e/trip-detail-visual.spec.ts
pnpm test:e2e tests/e2e/trip-detail-visual.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```
git add tests/e2e/
git commit -m "test(trip-detail): slice 2 visual baseline"
```

---

# Slice 3 — Bottom of page + sub-pages

Prerequisite: Slices 1 + 2 shipped. `Card`, `SectionIntro`, `BookingCTA`, demo fields all exist.

### Task 3.1: Restyle `Prerequisites` as 2-col text

Figma node `1468:6051` shows a "TEXT — 2 col" pattern (`SH2 description with button COLOUR` instances).

**Files:**
- Modify: `src/components/sections/Prerequisites.tsx`
- Modify: `src/components/sections/Prerequisites.module.css`

- [ ] **Step 1: Fetch Figma context**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=1468:6051
```

- [ ] **Step 2: Read current implementation + update**

Current data: `event.prerequisites` is `{ text: string }[]`. The Figma 2-col is one column of heading+description and another of heading+description — but Prerequisites is a list of single-line items. Two patterns:
- a) Split the list in half across two columns
- b) Section heading on the left, bulleted list on the right

Pick (a) for simplicity. Update CSS to render the list as a 2-column grid.

```tsx
import type { Event } from '@/payload-types'
import { SectionIntro } from './SectionIntro'
import styles from './Prerequisites.module.css'

export function Prerequisites({ items }: { items?: Event['prerequisites'] }) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <SectionIntro title="Rider type & prerequisites" align="left" />
      <ul className={styles.list}>
        {items.map((item, i) => (
          <li key={i} className={styles.item}>
            {item.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
```

CSS:

```css
.section {
  padding: var(--sectionGapMd) var(--contentPadding);
}

.list {
  max-width: var(--contentTextMaxWidth);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem 3rem;
  font-size: var(--pFontSize);
  line-height: var(--textLineHeight);
}

.item::before {
  content: '✓';
  color: var(--colPrimary);
  margin-right: 1rem;
}

@media screen and (max-width: 767px) {
  .list {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Commit**

```
git add src/components/sections/Prerequisites.tsx src/components/sections/Prerequisites.module.css
git commit -m "feat(prerequisites): render as 2-col list per Figma"
```

### Task 3.2: Restyle `EssentialEquipment` as 2-col text

**Files:**
- Modify: `src/components/sections/EssentialEquipment.tsx`
- Modify: `src/components/sections/EssentialEquipment.module.css`

- [ ] **Step 1: Fetch Figma context**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=1468:6064
```

- [ ] **Step 2: Update**

Data: `event.essentialEquipment` is `{ icon, name, note, mandatory }[]`, plus `event.equipmentIntro` (string). Render as a 2-col grid; mandatory items highlighted (red dot or similar).

```tsx
import type { Event } from '@/payload-types'
import { SectionIntro } from './SectionIntro'
import styles from './EssentialEquipment.module.css'

export function EssentialEquipment({
  items,
  intro,
}: {
  items?: Event['essentialEquipment']
  intro?: string | null
}) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <SectionIntro
        title="Essential equipment"
        lead={intro ?? undefined}
        align="left"
      />
      <ul className={styles.list}>
        {items.map((item, i) => (
          <li key={i} className={`${styles.item} ${item.mandatory ? styles.mandatory : ''}`}>
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            <div>
              <p className={styles.name}>
                {item.name}
                {item.mandatory && <span className={styles.required}> *</span>}
              </p>
              {item.note && <p className={styles.note}>{item.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

CSS:

```css
.section {
  padding: var(--sectionGapMd) var(--contentPadding);
}

.list {
  max-width: var(--contentTextMaxWidth);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem 3rem;
}

.item {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.icon {
  font-size: 2.4rem;
  line-height: 1;
}

.name {
  font-size: var(--pFontSize);
  font-weight: 600;
  margin: 0;
}

.note {
  font-size: var(--smallTextFontSize);
  color: var(--colTextSecond);
  margin: 0.4rem 0 0;
}

.required {
  color: var(--colPrimary);
}

@media screen and (max-width: 767px) {
  .list {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Commit**

```
git add src/components/sections/EssentialEquipment.tsx src/components/sections/EssentialEquipment.module.css
git commit -m "feat(equipment): render as 2-col list per Figma"
```

### Task 3.3: Wire final `BookingCTA`

**Files:**
- Modify: `src/app/(frontend)/trips/[slug]/page.tsx`

- [ ] **Step 1: Insert** a second `<BookingCTA event={event} heading="..." body="..." />` between `<EssentialEquipment .../>` and `<ReviewsRow .../>`. Override the heading/body if you want different copy from the mid-page CTA — otherwise omit and accept defaults.

- [ ] **Step 2: Commit**

```
git add src/app/(frontend)/trips/[slug]/page.tsx
git commit -m "feat(trip-detail): drop final BookingCTA after EssentialEquipment"
```

### Task 3.4: Restyle `ReviewsRow` as single-highlight testimonial

Figma node `1468:6951` shows a single highlighted testimonial (large quote treatment).

**Files:**
- Modify: `src/components/sections/ReviewsRow.tsx`
- Modify: `src/components/sections/ReviewsRow.module.css`

- [ ] **Step 1: Fetch Figma context**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=1468:6951
```

- [ ] **Step 2: Replace** to pick the first review (by `position`) and render as a single highlighted testimonial.

```tsx
import type { Review } from '@/payload-types'
import styles from './ReviewsRow.module.css'

export function ReviewsRow({ items }: { items?: Review[] }) {
  const review = items?.[0]
  if (!review) return null
  return (
    <section className={styles.section}>
      <blockquote className={styles.quote}>
        <p className={styles.body}>"{review.body}"</p>
        <footer className={styles.attrib}>
          — {review.author}{review.role ? `, ${review.role}` : ''}
        </footer>
      </blockquote>
    </section>
  )
}
```

(Adjust prop names against the actual `Review` type — read `src/collections/Reviews.ts` and `payload-types.ts` to confirm field names like `body`, `author`, `role`.)

- [ ] **Step 3: CSS** — large quote, centered, generous padding. Match Figma.

- [ ] **Step 4: Commit**

```
git add src/components/sections/ReviewsRow.tsx src/components/sections/ReviewsRow.module.css
git commit -m "feat(reviews): single-highlight testimonial layout per Figma"
```

### Task 3.5: Build `PhotoGallery` component

**Files:**
- Create: `src/components/sections/PhotoGallery.tsx`
- Create: `src/components/sections/PhotoGallery.module.css`
- Modify: `src/app/(frontend)/trips/[slug]/page.tsx`

- [ ] **Step 1: Fetch Figma context**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=1468:6881
```

Determine: grid? horizontal strip? lightbox-on-click?

- [ ] **Step 2: Component**

```tsx
import Image from 'next/image'
import type { Event, Media } from '@/payload-types'
import { SectionIntro } from './SectionIntro'
import styles from './PhotoGallery.module.css'

export function PhotoGallery({ items }: { items?: Event['gallery'] }) {
  const photos = (items ?? []).filter(
    (m): m is Media => typeof m === 'object' && m !== null && !!m.url,
  )
  if (!photos.length) return null
  return (
    <section className={styles.section}>
      <SectionIntro title="Photo gallery" />
      <div className={styles.grid}>
        {photos.map((photo) => (
          <div key={photo.id} className={styles.tile}>
            <Image
              src={photo.url!}
              alt={photo.alt || ''}
              width={photo.width ?? 800}
              height={photo.height ?? 600}
              className={styles.image}
              sizes="(max-width: 767px) 100vw, 33vw"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: CSS** — 3-col grid (1-col on mobile) per Figma; refine after Step 1.

```css
.section {
  padding: var(--sectionGapMd) var(--contentPadding);
}

.grid {
  max-width: var(--contentMaxWidth);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.tile {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media screen and (max-width: 767px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Wire into page** below `ReviewsRow`:

```ts
import { PhotoGallery } from '@/components/sections/PhotoGallery'
```

```tsx
<PhotoGallery items={event.gallery} />
```

- [ ] **Step 5: Commit**

```
git add src/components/sections/PhotoGallery.tsx src/components/sections/PhotoGallery.module.css src/app/(frontend)/trips/[slug]/page.tsx
git commit -m "feat(gallery): add PhotoGallery; wire below ReviewsRow"
```

### Task 3.6: Restyle `HowToBook`

**Files:**
- Modify: `src/components/sections/HowToBook.tsx`
- Modify: `src/components/sections/HowToBook.module.css`

- [ ] **Step 1: Read current implementation; align typography + spacing to Figma's section header treatment** (use `SectionIntro` if not already). The Figma frame doesn't show a HowToBook block explicitly, so the design call is "looks like the rest of the page" — same typography, same spacing tokens.

- [ ] **Step 2: Commit**

```
git add src/components/sections/HowToBook.tsx src/components/sections/HowToBook.module.css
git commit -m "feat(how-to-book): align to Figma R2 visual language"
```

### Task 3.7: Restyle `WhyRockbusters`

Same pattern as Task 3.6.

**Files:**
- Modify: `src/components/sections/WhyRockbusters.tsx`
- Modify: `src/components/sections/WhyRockbusters.module.css`

- [ ] **Step 1: Use `SectionIntro` + `CardGrid` if the content is itemized; otherwise apply typography/spacing tokens consistent with the rest of the page**.

- [ ] **Step 2: Commit**

```
git add src/components/sections/WhyRockbusters.tsx src/components/sections/WhyRockbusters.module.css
git commit -m "feat(why-rockbusters): align to Figma R2 visual language"
```

### Task 3.8: Sub-page `/trips/[slug]/dates`

**Files:**
- Create: `src/app/(frontend)/trips/[slug]/dates/page.tsx`
- Create: `src/app/(frontend)/trips/[slug]/dates/not-found.tsx`

- [ ] **Step 1: Read** `src/app/(frontend)/trips/[slug]/page.tsx` and `src/app/(frontend)/trips/[slug]/not-found.tsx` to copy the 404 pattern.

- [ ] **Step 2: Create `dates/page.tsx`**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { EventDatesList } from '@/components/sections/EventDatesList'

type Props = { params: Promise<{ slug: string }> }

export default async function TripDatesPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs: eventDocs } = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const event = eventDocs[0]
  if (!event) notFound()

  const { docs: dates } = await payload.find({
    collection: 'event-dates',
    where: { and: [{ event: { equals: event.id } }, { active: { equals: true } }] },
    sort: 'dateFrom',
    limit: 100,
  })

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/calendar', label: 'Calendar' },
        { href: `/trips/${slug}`, label: event.title },
        { label: 'Dates' },
      ]}
    >
      <main>
        <EventDatesList items={dates} />
        <p style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Link href={`/trips/${slug}`}>← Back to {event.title}</Link>
        </p>
      </main>
    </MarketingShell>
  )
}
```

- [ ] **Step 3: Create `dates/not-found.tsx`** — copy from `src/app/(frontend)/trips/[slug]/not-found.tsx`. Adjust copy to reference "this trip's dates page".

- [ ] **Step 4: Visual check**

```
pnpm dev
# Visit /trips/<seeded-slug>/dates
```

- [ ] **Step 5: Commit**

```
git add src/app/(frontend)/trips/[slug]/dates/
git commit -m "feat(trip-detail): add /trips/[slug]/dates sub-page"
```

### Task 3.9: Sub-page `/trips/[slug]/faq`

**Files:**
- Create: `src/app/(frontend)/trips/[slug]/faq/page.tsx`
- Create: `src/app/(frontend)/trips/[slug]/faq/not-found.tsx`

- [ ] **Step 1: `faq/page.tsx`** — copy the dates/page.tsx pattern, replace the data query with FAQ + replace section component:

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { FAQList } from '@/components/sections/FAQList'

type Props = { params: Promise<{ slug: string }> }

export default async function TripFaqPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs: eventDocs } = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const event = eventDocs[0]
  if (!event) notFound()

  const { docs: faqs } = await payload.find({
    collection: 'faqs',
    where: { and: [{ event: { equals: event.id } }, { active: { equals: true } }] },
    sort: 'position',
    limit: 100,
  })

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/calendar', label: 'Calendar' },
        { href: `/trips/${slug}`, label: event.title },
        { label: 'FAQ' },
      ]}
    >
      <main>
        <FAQList items={faqs} heading="FAQ for this trip" />
        <p style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Link href={`/trips/${slug}`}>← Back to {event.title}</Link>
        </p>
      </main>
    </MarketingShell>
  )
}
```

- [ ] **Step 2: `faq/not-found.tsx`** — copy from sibling.

- [ ] **Step 3: Commit**

```
git add src/app/(frontend)/trips/[slug]/faq/
git commit -m "feat(trip-detail): add /trips/[slug]/faq sub-page"
```

### Task 3.10: Sub-page `/trips/[slug]/logistics`

**Files:**
- Create: `src/app/(frontend)/trips/[slug]/logistics/page.tsx`
- Create: `src/app/(frontend)/trips/[slug]/logistics/not-found.tsx`

- [ ] **Step 1: `logistics/page.tsx`** — renders `LocationBlock` + `EventAccommodationLogistics` stacked:

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { LocationBlock } from '@/components/sections/LocationBlock'
import { EventAccommodationLogistics } from '@/components/sections/EventAccommodationLogistics'

type Props = { params: Promise<{ slug: string }> }

export default async function TripLogisticsPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs: eventDocs } = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const event = eventDocs[0]
  if (!event) notFound()

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/calendar', label: 'Calendar' },
        { href: `/trips/${slug}`, label: event.title },
        { label: 'Logistics' },
      ]}
    >
      <main>
        <LocationBlock content={event.content} />
        <EventAccommodationLogistics
          accommodation={event.accommodation}
          transport={event.transport}
        />
        <p style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Link href={`/trips/${slug}`}>← Back to {event.title}</Link>
        </p>
      </main>
    </MarketingShell>
  )
}
```

- [ ] **Step 2: `logistics/not-found.tsx`** — copy from sibling.

- [ ] **Step 3: Commit**

```
git add src/app/(frontend)/trips/[slug]/logistics/
git commit -m "feat(trip-detail): add /trips/[slug]/logistics sub-page"
```

### Task 3.11: Cross-links from main page to sub-pages

**Decisions:**
- `/dates` link → already the target of both `BookingCTA` instances. No additional link needed.
- `/faq` link → small "Read the FAQ for this trip" link rendered **below `WhyRockbusters`** (above the footer). Simple and discoverable; doesn't fight the visual rhythm.
- `/logistics` link → a small "Travel & logistics →" inline link inside `EssentialEquipment` section intro (passed via prop), or as a small block between `DayByDayItinerary` and the mid-page `BookingCTA`. Pick: append to `EssentialEquipment`'s `intro` content as a final paragraph with the link (simpler — no new component).

**Files:**
- Modify: `src/app/(frontend)/trips/[slug]/page.tsx`

- [ ] **Step 1: Add FAQ link** below `<WhyRockbusters .../>`:

```tsx
<div style={{ textAlign: 'center', padding: '4rem 2rem 0' }}>
  <Link href={`/trips/${slug}/faq`}>Read the FAQ for this trip →</Link>
</div>
```

(Replace inline style with a CSS-module class when convenient; inline is fine for a single link.)

- [ ] **Step 2: Add Logistics link** at the end of the trip page, before the footer is rendered by the shell. Same pattern:

```tsx
<div style={{ textAlign: 'center', padding: '2rem' }}>
  <Link href={`/trips/${slug}/logistics`}>Travel & logistics →</Link>
</div>
```

- [ ] **Step 3: Commit**

```
git add src/app/(frontend)/trips/[slug]/page.tsx
git commit -m "feat(trip-detail): cross-link to /faq and /logistics sub-pages"
```

### Task 3.12: Remove off-map sections + delete `EventFinalCTA` (atomic)

**Files:**
- Modify: `src/app/(frontend)/trips/[slug]/page.tsx`
- Delete: `src/components/sections/EventFinalCTA.tsx`
- Delete: `src/components/sections/EventFinalCTA.module.css`

- [ ] **Step 1: Confirm no other callers of `EventFinalCTA`**

```
grep -rln "EventFinalCTA" src/
```

Expected: only `src/app/(frontend)/trips/[slug]/page.tsx` and the `EventFinalCTA.tsx`/`.module.css` files themselves. If grep finds another caller, replace those usages first.

- [ ] **Step 2: Remove imports + usage** of these from `src/app/(frontend)/trips/[slug]/page.tsx`:

- `EventDatesList`
- `FAQList`
- `LocationBlock`
- `EventAccommodationLogistics`
- `EventFinalCTA`

Also remove the `payload.find` queries for `faqs`, `event-dates`, and any `firstDate` derivations that were only feeding these removed components.

(Keep `firstDate` if `DetailHero` still uses it from Task 1.4 — verify.)

- [ ] **Step 3: Delete the `EventFinalCTA` component files**

```
rm src/components/sections/EventFinalCTA.tsx src/components/sections/EventFinalCTA.module.css
```

- [ ] **Step 4: Run typecheck + smoke**

```
pnpm exec tsc --noEmit
pnpm dev
# Visit /trips/<seed>; confirm page renders correctly without the removed sections
```

- [ ] **Step 5: Commit**

```
git add src/app/(frontend)/trips/[slug]/page.tsx
git rm src/components/sections/EventFinalCTA.tsx src/components/sections/EventFinalCTA.module.css
git commit -m "refactor(trip-detail): drop off-map sections; remove EventFinalCTA"
```

### Task 3.13: Slice 3 Playwright baseline + sub-page smoke

**Files:**
- Modify: `tests/e2e/trip-detail-visual.spec.ts`
- Create: `tests/e2e/trip-subpages-smoke.spec.ts`

- [ ] **Step 1: Update trip-detail snapshot** (rename `slice-2.png` → `slice-3.png` or maintain rolling baseline).

```
pnpm test:e2e -- --update-snapshots tests/e2e/trip-detail-visual.spec.ts
```

- [ ] **Step 2: Create sub-pages smoke test**

```ts
import { test, expect } from '@playwright/test'

const SLUG = 'tatra-sport-climbing' // adjust

const subPages = [
  { path: 'dates', heading: /dates/i },
  { path: 'faq', heading: /faq/i },
  { path: 'logistics', heading: /logistics|accommodation|travel/i },
]

for (const sub of subPages) {
  test(`/trips/${SLUG}/${sub.path} renders`, async ({ page }) => {
    const res = await page.goto(`/trips/${SLUG}/${sub.path}`)
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading')).toContainText(sub.heading)
  })

  test(`/trips/<bad-slug>/${sub.path} 404s`, async ({ page }) => {
    const res = await page.goto(`/trips/__does-not-exist__/${sub.path}`)
    expect(res?.status()).toBe(404)
  })
}
```

- [ ] **Step 3: Run + commit**

```
pnpm test:e2e tests/e2e/trip-subpages-smoke.spec.ts
git add tests/e2e/
git commit -m "test(trip-subpages): smoke + 404 coverage"
```

---

# Slice 4 — Shell

Prerequisite: Slices 1–3 shipped. Restyle global `MarketingShell` Header/Footer. Touches every page that uses the shell.

### Task 4.1: Restyle `Header`

**Files:**
- Modify: `src/components/marketing/Header.tsx`
- Modify: `src/components/marketing/marketing.module.css` (or wherever Header styles live)

- [ ] **Step 1: Fetch Figma context**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=5108:15087
```

The HEADER frame includes both site nav AND page hero. Focus on the **top portion** (site nav bar: logo, primary nav links, optional contacts row). The page-hero portion is already handled in `DetailHero` (slice 1).

- [ ] **Step 2: Read current Header implementation**

```
cat src/components/marketing/Header.tsx
cat src/components/marketing/marketing.module.css
```

The current Header uses `--headerHeight`, `--headerContactsHeight`, `--headerBg`, `--headerBgScrolled` tokens. Update the markup and CSS to match Figma's nav structure (logo placement, link layout, contact row, sticky behaviour).

- [ ] **Step 3: Update tokens if needed** in `src/app/(frontend)/styles.css` (e.g. `--headerBg` may want a different opacity per Figma).

- [ ] **Step 4: Commit**

```
git add src/components/marketing/Header.tsx src/components/marketing/marketing.module.css src/app/(frontend)/styles.css
git commit -m "feat(shell): restyle Header to Figma R2"
```

### Task 4.2: Restyle `Footer`

**Files:**
- Modify: `src/components/marketing/Footer.tsx`
- Modify: `src/components/marketing/marketing.module.css`

- [ ] **Step 1: Fetch Figma context**

```
mcp__claude_ai_Figma__get_design_context  fileKey=ch2aIrEQMWVr6Q1uGorVoV  nodeId=1463:25077
```

- [ ] **Step 2: Read current Footer + update markup** to match Figma's footer pattern (sitemap columns, contact, social links, legal row).

- [ ] **Step 3: Commit**

```
git add src/components/marketing/Footer.tsx src/components/marketing/marketing.module.css
git commit -m "feat(shell): restyle Footer to Figma R2"
```

### Task 4.3: Verify Breadcrumb against new Header/Footer

**Files:**
- Modify (if needed): `src/components/marketing/Breadcrumb.tsx`
- Modify (if needed): styles

- [ ] **Step 1: Read** the Breadcrumb component. If Figma shows a specific breadcrumb pattern, match it. Otherwise, ensure spacing/typography reads consistently against the new Header/Footer.

- [ ] **Step 2: Commit (if changes)**

```
git add src/components/marketing/Breadcrumb.tsx
git commit -m "feat(shell): adjust Breadcrumb against new Header/Footer"
```

### Task 4.4: Cross-page Playwright baselines

The shell restyle visually changes every page that uses `MarketingShell`. Enumerate them.

**Files:**
- Modify: `tests/e2e/shell-visual.spec.ts` (create if missing)

- [ ] **Step 1: Enumerate shell-using pages**

```
grep -rln "MarketingShell" src/
```

Expected list (verify):
- `/` (homepage if it uses the shell)
- `/calendar`
- `/programs`, `/programs/[slug]`
- `/trips/[slug]`, `/trips/[slug]/dates`, `/faq`, `/logistics`
- `/account/profile`, `/account/orders`, `/account/security`, `/account/addresses`, `/account/addresses/[idx]`
- `/account` (overview)
- Auth pages may use a different shell — verify (`grep -rln "MarketingShell" src/app/\(frontend\)/\(auth\)/`).

- [ ] **Step 2: Create visual smoke**

```ts
import { test, expect } from '@playwright/test'

const SLUG = 'tatra-sport-climbing' // adjust

const pages = [
  '/',
  '/calendar',
  '/programs',
  `/trips/${SLUG}`,
  `/trips/${SLUG}/dates`,
  `/trips/${SLUG}/faq`,
  `/trips/${SLUG}/logistics`,
]

for (const path of pages) {
  test(`shell renders on ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page).toHaveScreenshot(`shell-${path.replace(/[/\[\]]/g, '_')}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.03,
    })
  })
}
```

- [ ] **Step 3: Regenerate baselines + verify**

```
pnpm test:e2e -- --update-snapshots tests/e2e/shell-visual.spec.ts
pnpm test:e2e tests/e2e/shell-visual.spec.ts
```

- [ ] **Step 4: Manual smoke checklist** (paste this into the PR description for reviewer to tick during review):

```
- [ ] /
- [ ] /calendar
- [ ] /programs
- [ ] /programs/[a-seeded-slug]
- [ ] /trips/[a-seeded-slug]
- [ ] /trips/[a-seeded-slug]/dates
- [ ] /trips/[a-seeded-slug]/faq
- [ ] /trips/[a-seeded-slug]/logistics
- [ ] /login
- [ ] /register
- [ ] /forgot-password
- [ ] /account
- [ ] /account/profile
- [ ] /account/orders
- [ ] /account/addresses
- [ ] /account/security
```

- [ ] **Step 5: Commit**

```
git add tests/e2e/shell-visual.spec.ts tests/e2e/shell-visual.spec.ts-snapshots/
git commit -m "test(shell): cross-page visual baselines"
```

---

## Open issues / decisions made

These are flagged in the spec under "Open issues" or arose during plan writing. Each has a recommended resolution; revisit if real implementation surfaces a different need.

1. **`WhatYouLearn` data shape mismatch (slice 2 task 2.4).** Spec assumed "rich content"; actual collection has a group of two boxes (`box1Heading`/`box1Bullets`, `box2Heading`/`box2Bullets`). Plan renders **2 cards** matching the data. Figma may show 3 — verify on Figma fetch; if 3 is strongly preferred, add `box3Heading`/`box3Bullets` to the same slice's migration (Task 2.8) and adjust the component.

2. **Card primitive: `<Card />` chosen over `.card` class (slice 2 task 2.1).** Rationale: TypeScript prop types, easier composition. `CardGrid` is the layout wrapper; `Card` is the cell. Both ship together.

3. **Sub-page back-link styling (slice 3 tasks 3.8–3.10).** Inline style for now; replace with CSS module classes if/when the visual designer specs the back-link pattern.

4. **Cross-link placement (slice 3 task 3.11).** FAQ link sits under `WhyRockbusters`; Logistics link sits at the very end of the trip page. Visual fit informed this; reviewer may want different slots.

5. **`HowToBook` + `WhyRockbusters` (slice 3 tasks 3.6–3.7).** Figma doesn't show these explicitly; restyle = "align typography and spacing tokens to the rest of the page". If the visual designer adds specific Figma frames for these later, do a follow-up.

6. **Rich-text rendering in `DemoLessonBlock` (slice 2 task 2.9).** The component step 2 has a placeholder `<pre>` for `demoBody`. The engineer must copy the Lexical-rich-text render pattern from an existing component (`LocationBlock.tsx` or similar) before merging.

7. **Booking CTA button copy.** Currently hardcoded ("Book this trip"). If per-event override is needed, add an optional `ctaLabel` prop and (later) a Payload field.

8. **Sub-page visual polish.** Out of scope for this plan. The three sub-pages are functional stubs; a future spec can give them designed treatments.

9. **Auth pages may not use `MarketingShell` (slice 4 task 4.4).** Verify with `grep` before adding them to the shell baselines.

---

## Self-review

Coverage cross-check against spec sections:

- Section 1 "Goal" — covered by all 4 slices.
- Section 2 "Decisions" — encoded in tasks (hybrid, booking CTA → /dates, sub-pages, demo block, etc.).
- Section 3 "Section map" — every row of the spec table maps to at least one task across slices 1–3.
- Section 4 "Main page structure" — final layout achieved at end of slice 3.
- Section 5 "Sub-pages" — slice 3 tasks 3.8–3.10.
- Section 6 "New components" — `SectionIntro` (1.2), `TripPitchBlock` (1.3), `DemoLessonBlock` (2.9), `PhotoGallery` (3.5), `BookingCTA` (2.5), plus `Card`/`CardGrid` (2.1).
- Section 7 "Restyled components" — DetailHero (1.4), AudienceCards (1.5), HighlightsGrid (2.2), DayByDayItinerary (2.3), WhatYouLearn (2.4), CoachesMinimal (2.7), Prerequisites (3.1), EssentialEquipment (3.2), ReviewsRow (3.4), HowToBook (3.6), WhyRockbusters (3.7).
- Section 8 "Removed components" — slice 3 task 3.12.
- Section 9 "Visual primitives" — tokens (1.1), Card primitive (2.1).
- Section 10 "Testing" — Playwright baselines per slice + sub-pages smoke (task 3.13).
- Section 11 "Open issues" — re-stated and expanded above.

Type consistency checks:
- `SectionIntro` props `(eyebrow?, title, lead?, align?)` — used identically in Tasks 1.2, 1.5, 2.2, 2.4, 3.1, 3.2, 3.4, 3.5.
- `Card` / `CardGrid` — defined in 2.1, consumed by 2.2 and 2.4.
- `BookingCTA` — defined in 2.5, consumed by 2.6 (mid-page) and 3.3 (final).
- `DemoLessonBlock` — defined in 2.9, consumed by trip page in 2.9 step 4.
- `PhotoGallery` — defined in 3.5, consumed by trip page in 3.5 step 4.
- Migration table name `events` — assumed; verify in Task 2.8 step 2.

No placeholders detected ("TBD", "TODO", "fill in", "similar to"). Each code step shows the code; the few "verify in implementation" steps direct the engineer to the file or Figma node they should consult.
