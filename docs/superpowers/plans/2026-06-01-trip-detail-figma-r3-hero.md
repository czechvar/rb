# Trip Detail Figma R3 — Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/trips/[slug]` hero to match the Figma R3 design — text/sidebar 2-column layout, tag-chip strip overlapping the bottom edge, transparent header overlay that flips opaque past the hero. Sidebar contents and chip array are hardcoded inline this round.

**Architecture:** Two new presentational components (`PricingSidebar`, `TagChipStrip`) consumed by a rewritten `DetailHero`. The shared `Header` and `MarketingShell` gain optional `transparent` / `transparentHeader` props (default `false` → other pages unchanged). The trip detail page opts in and suppresses its breadcrumb so the hero anchors to viewport top.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS Modules, Playwright (e2e), Payload CMS (data layer — not modified this round).

**Spec:** [`docs/superpowers/specs/2026-06-01-trip-detail-figma-r3-hero-design.md`](../specs/2026-06-01-trip-detail-figma-r3-hero-design.md)

**Worktree / branch:** `.claude/worktrees/feature+trip-detail-figma-r3-hero` on `worktree-feature+trip-detail-figma-r3-hero` (already created, based on devel HEAD).

**Dev server port:** `pnpm dev --port 3001` (per `playwright.config.ts` — main repo's dev server may already be on 3000; the worktree uses 3001 to avoid collision).

---

## Task 1: Write failing Playwright smoke test

Defines the testing surface up front. This test will fail until Tasks 2–6 are done — that's expected.

**Files:**
- Create: `tests/e2e/trip-detail-hero.spec.ts`

- [ ] **Step 1: Create the failing test**

```ts
// tests/e2e/trip-detail-hero.spec.ts
import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '@payload-config'

test.describe('Trip Detail hero (Figma R3)', () => {
  test('renders new hero with sidebar, tag chips, and transparent header', async ({ page }) => {
    const payload = await getPayload({ config })
    const stamp = Date.now()
    // @ts-expect-error slug auto-filled by the slugField beforeValidate hook
    const created = await payload.create({
      collection: 'events',
      data: {
        title: `E2E Hero Trip ${stamp}`,
        state: 'published',
        shortDescription: 'Hero smoke test event.',
      },
    })

    await page.goto(`http://localhost:3001/trips/${created.slug}`)

    // Title and lead render in the hero
    await expect(page.locator('h1')).toContainText(`E2E Hero Trip ${stamp}`)
    await expect(page.getByText('Hero smoke test event.')).toBeVisible()

    // Sidebar pricing card content (hardcoded)
    await expect(page.getByText('€ 950 / 1 week')).toBeVisible()
    await expect(page.getByText('€ 1,650 for 2 weeks')).toBeVisible()
    await expect(page.getByText('per person · coaching included')).toBeVisible()
    await expect(page.getByText('Rodellar, Aragon, Spain')).toBeVisible()
    await expect(page.getByText('Outdoor lead 6b-8a')).toBeVisible()
    await expect(page.getByText(/Free demo of Evolv & Singing Rock/)).toBeVisible()
    await expect(page.getByRole('link', { name: /BOOK YOUR SPOT/i })).toBeVisible()

    // Tag chip strip
    await expect(page.getByText('RODELLAR, ARAGON, SPAIN')).toBeVisible()
    await expect(page.getByText('SPORT CLIMBING')).toBeVisible()
    await expect(page.getByText('OUTDOOR LEAD 6b-8a')).toBeVisible()
    await expect(page.getByText('MAY 2026')).toBeVisible()
    await expect(page.getByText('EVOLV & SINGING ROCK CLIMBING GEAR DEMO')).toBeVisible()

    // Breadcrumb is suppressed on this page
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0)

    // Header is transparent at top, opaque after scrolling past the hero
    const header = page.locator('header').first()
    const bgAtTop = await header.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    )
    // rgba(...,0) === fully transparent
    expect(bgAtTop).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/)

    await page.evaluate(() => window.scrollTo(0, window.innerHeight))
    // small wait for the scroll handler to flip the class
    await page.waitForTimeout(200)
    const bgAfterScroll = await header.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    )
    expect(bgAfterScroll).not.toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|^transparent$/)
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec playwright test tests/e2e/trip-detail-hero.spec.ts --reporter=list`
Expected: FAIL — most assertions miss because the new hero isn't built yet.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/e2e/trip-detail-hero.spec.ts
git commit -m "test(trip-detail): failing e2e smoke for R3 hero"
```

---

## Task 2: TagChipStrip component

New pure-presentational component. No tests of its own — covered by the smoke test in Task 1.

**Files:**
- Create: `src/components/sections/TagChipStrip.tsx`
- Create: `src/components/sections/TagChipStrip.module.css`

- [ ] **Step 1: Create `TagChipStrip.tsx`**

```tsx
// src/components/sections/TagChipStrip.tsx
import styles from './TagChipStrip.module.css'

export type ChipIcon = 'pin' | 'tag' | 'mountain' | 'calendar' | 'gift'

export type TagChip = {
  icon: ChipIcon
  label: string
}

function Icon({ name }: { name: ChipIcon }) {
  switch (name) {
    case 'pin':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
        </svg>
      )
    case 'tag':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <path fill="currentColor" d="M21.41 11.58l-9-9A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.41l9 9a2 2 0 0 0 2.83 0l7-7a2 2 0 0 0 0-2.83ZM6.5 7A1.5 1.5 0 1 1 8 5.5 1.5 1.5 0 0 1 6.5 7Z" />
        </svg>
      )
    case 'mountain':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <path fill="currentColor" d="M14 6 9 14l-3-4-6 10h24L14 6Zm0 4.6 5.4 7.4H8.6L14 10.6Z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14v10ZM5 8V6h14v2H5Z" />
        </svg>
      )
    case 'gift':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <path fill="currentColor" d="M20 7h-2.3a3 3 0 0 0-5.7-2 3 3 0 0 0-5.7 2H4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h7v9h2v-9h7a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1Zm-5-2a1 1 0 1 1 0 2h-2V6a1 1 0 0 1 1-1Zm-6 0a1 1 0 0 1 1 1v1H8a1 1 0 0 1 0-2Z" />
        </svg>
      )
  }
}

export function TagChipStrip({ chips }: { chips: TagChip[] }) {
  return (
    <ul className={styles.strip} aria-label="Trip tags">
      {chips.map((c) => (
        <li key={c.label} className={styles.chip}>
          <Icon name={c.icon} />
          <span className={styles.label}>{c.label}</span>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 2: Create `TagChipStrip.module.css`**

```css
/* src/components/sections/TagChipStrip.module.css */
.strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--colLightest);
  border-radius: 999px;
  padding: 0.8rem 1.4rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: var(--colText);
}

.icon {
  width: 1.6rem;
  height: 1.6rem;
  color: var(--colPrimary);
  flex-shrink: 0;
}

.label {
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .strip {
    flex-wrap: nowrap;
    justify-content: flex-start;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 0 var(--contentPadding);
  }
  .strip::-webkit-scrollbar {
    display: none;
  }
  .chip {
    flex-shrink: 0;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/TagChipStrip.tsx src/components/sections/TagChipStrip.module.css
git commit -m "feat(trip-detail): add TagChipStrip component"
```

---

## Task 3: PricingSidebar component

New pure-presentational component holding the white pricing card.

**Files:**
- Create: `src/components/sections/PricingSidebar.tsx`
- Create: `src/components/sections/PricingSidebar.module.css`

- [ ] **Step 1: Create `PricingSidebar.tsx`**

```tsx
// src/components/sections/PricingSidebar.tsx
import Link from 'next/link'
import styles from './PricingSidebar.module.css'

export type PricingSidebarProps = {
  primaryPrice: string
  secondaryPrice?: string
  caption: string
  rows: Array<{ label: string; value: string }>
  callout?: string
  ctaHref: string
  ctaLabel: string
}

export function PricingSidebar({
  primaryPrice,
  secondaryPrice,
  caption,
  rows,
  callout,
  ctaHref,
  ctaLabel,
}: PricingSidebarProps) {
  return (
    <aside className={styles.card} aria-label="Trip pricing">
      <div className={styles.priceBlock}>
        <p className={styles.primaryPrice}>{primaryPrice}</p>
        {secondaryPrice && <p className={styles.secondaryPrice}>{secondaryPrice}</p>}
        <p className={styles.caption}>{caption}</p>
      </div>
      <hr className={styles.divider} />
      <dl className={styles.rows}>
        {rows.map((r) => (
          <div key={r.label} className={styles.row}>
            <dt className={styles.rowLabel}>{r.label}</dt>
            <dd className={styles.rowValue}>{r.value}</dd>
          </div>
        ))}
      </dl>
      {callout && <p className={styles.callout}>{callout}</p>}
      <Link href={ctaHref} className={styles.cta}>
        {ctaLabel}
      </Link>
    </aside>
  )
}
```

- [ ] **Step 2: Create `PricingSidebar.module.css`**

```css
/* src/components/sections/PricingSidebar.module.css */
.card {
  background: var(--colLightest);
  border-radius: 6px;
  padding: 2.4rem;
  color: var(--colText);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  width: 100%;
  max-width: 34rem;
}

.priceBlock {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.primaryPrice {
  font-size: 3.2rem;
  font-weight: 700;
  line-height: 1.1;
  margin: 0;
  color: var(--colTextHeader);
}

.secondaryPrice {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--colPrimary);
  margin: 0;
}

.caption {
  font-size: 1.3rem;
  color: var(--colGreyDark);
  margin: 0;
}

.divider {
  border: none;
  border-top: 1px solid var(--colLight);
  margin: 0;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0;
}

.row {
  display: grid;
  grid-template-columns: minmax(8rem, auto) 1fr;
  gap: 1.2rem;
  align-items: baseline;
}

.rowLabel {
  font-size: 1.3rem;
  color: var(--colGreyDark);
  margin: 0;
}

.rowValue {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--colText);
  margin: 0;
  text-align: right;
}

.callout {
  border: 1px solid var(--colPrimary);
  border-radius: 4px;
  padding: 1rem 1.2rem;
  font-size: 1.3rem;
  color: var(--colPrimary);
  text-align: center;
  margin: 0;
}

.cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1.2rem 2rem;
  background: var(--colPrimary);
  color: var(--colTextOnPrimary);
  text-transform: uppercase;
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: 0.1rem;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color var(--transitionTimeBase) ease;
}

.cta:hover {
  background: var(--colPrimaryHover);
  color: var(--colTextOnPrimary);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/PricingSidebar.tsx src/components/sections/PricingSidebar.module.css
git commit -m "feat(trip-detail): add PricingSidebar component"
```

---

## Task 4: Rewrite DetailHero

Replaces the current `DetailHero` with the new layout. Subcomponents from Tasks 2–3 are wired with hardcoded props (the "hardcode all sidebar fields this round" decision).

**Files:**
- Modify: `src/components/sections/DetailHero.tsx` (full rewrite)
- Modify: `src/components/sections/DetailHero.module.css` (full rewrite)

- [ ] **Step 1: Rewrite `DetailHero.tsx`**

```tsx
// src/components/sections/DetailHero.tsx
import Image from 'next/image'
import type { Event, EventDate } from '@/payload-types'
import { PricingSidebar } from './PricingSidebar'
import { TagChipStrip, type TagChip } from './TagChipStrip'
import styles from './DetailHero.module.css'

const HARDCODED_CHIPS: TagChip[] = [
  { icon: 'pin', label: 'RODELLAR, ARAGON, SPAIN' },
  { icon: 'tag', label: 'SPORT CLIMBING' },
  { icon: 'mountain', label: 'OUTDOOR LEAD 6b-8a' },
  { icon: 'calendar', label: 'MAY 2026' },
  { icon: 'gift', label: 'EVOLV & SINGING ROCK CLIMBING GEAR DEMO' },
]

const HARDCODED_SIDEBAR = {
  primaryPrice: '€ 950 / 1 week',
  secondaryPrice: '€ 1,650 for 2 weeks',
  caption: 'per person · coaching included',
  rows: [
    { label: 'Dates', value: 'May 2026/2027 – see below' },
    { label: 'Duration', value: '1 week / 2 weeks' },
    { label: 'Location', value: 'Rodellar, Aragon, Spain' },
    { label: 'Level', value: 'Outdoor lead 6b-8a' },
    { label: 'Coaches', value: 'Klemen Bečan, Jany Novotny, Pablo Ruiz Seco' },
  ],
  callout: 'Free demo of Evolv & Singing Rock climbing equipment',
  ctaLabel: 'BOOK YOUR SPOT →',
} as const

export function DetailHero({
  event,
  firstDate: _firstDate,
}: {
  event: Event
  firstDate?: EventDate
}) {
  const mainPic =
    typeof event.mainPicture === 'object' && event.mainPicture ? event.mainPicture : null

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
      <div className={styles.content}>
        <div className={styles.text}>
          <h1 className={styles.title}>{event.title}</h1>
          {event.shortDescription && (
            <p className={styles.lead}>{event.shortDescription}</p>
          )}
        </div>
        <div className={styles.sidebar}>
          <PricingSidebar
            primaryPrice={HARDCODED_SIDEBAR.primaryPrice}
            secondaryPrice={HARDCODED_SIDEBAR.secondaryPrice}
            caption={HARDCODED_SIDEBAR.caption}
            rows={[...HARDCODED_SIDEBAR.rows]}
            callout={HARDCODED_SIDEBAR.callout}
            ctaHref="#booking"
            ctaLabel={HARDCODED_SIDEBAR.ctaLabel}
          />
        </div>
      </div>
      <div className={styles.chipStrip}>
        <TagChipStrip chips={HARDCODED_CHIPS} />
      </div>
    </section>
  )
}
```

> Note: `firstDate` is still accepted in the signature to keep `page.tsx` compatible, but it's intentionally unused this round. Removing it from the prop type is a separate cleanup.

- [ ] **Step 2: Rewrite `DetailHero.module.css`**

```css
/* src/components/sections/DetailHero.module.css */
.hero {
  position: relative;
  width: 100%;
  height: 80vh;
  min-height: 60rem;
  overflow: visible;
  color: var(--colLightest);
}

.image {
  object-fit: cover;
  object-position: center;
  z-index: 0;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.6) 100%);
  z-index: 1;
}

.content {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr minmax(28rem, 34rem);
  gap: 4rem;
  align-items: center;
  max-width: var(--contentMaxWidth);
  margin: 0 auto;
  padding: var(--headerTotalHeight) var(--contentPadding) 6rem;
  z-index: 2;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 0;
}

.title {
  font-size: clamp(3.2rem, 6vw, 8rem);
  line-height: 1.05;
  font-weight: 700;
  margin: 0;
  color: var(--colLightest);
}

.lead {
  font-size: var(--pFontSize);
  line-height: var(--textLineHeight);
  max-width: 60ch;
  opacity: 0.92;
  margin: 0;
}

.sidebar {
  justify-self: end;
  width: 100%;
  max-width: 34rem;
}

.chipStrip {
  position: absolute;
  bottom: -2rem;
  left: 0;
  width: 100%;
  z-index: 3;
}

@media (max-width: 1023px) {
  .content {
    grid-template-columns: 1fr minmax(24rem, 28rem);
    gap: 2rem;
  }
}

@media (max-width: 767px) {
  .hero {
    height: auto;
    min-height: 0;
  }
  .content {
    position: relative;
    inset: auto;
    grid-template-columns: 1fr;
    gap: 2rem;
    padding-top: calc(var(--headerTotalHeight) + 4rem);
    padding-bottom: 4rem;
  }
  .text {
    /* Title and lead need readable bg over the image on mobile */
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%);
    margin: 0 calc(-1 * var(--contentPadding));
    padding: 4rem var(--contentPadding) 4rem;
  }
  .image {
    object-position: center top;
  }
  .overlay {
    display: none;
  }
  .sidebar {
    justify-self: stretch;
    max-width: none;
  }
  .chipStrip {
    position: relative;
    bottom: auto;
    margin-top: 2rem;
  }
}
```

- [ ] **Step 3: Manually verify hero renders**

Run: `pnpm dev --port 3001` (in another shell), open `http://localhost:3001/trips/<some-published-slug>`.

Expected: hero shows new layout (title left, sidebar card right, chips at bottom). Header is still opaque white above (transparent header comes in Task 5). Lower sections unchanged.

If a published event slug isn't handy, you can use the e2e helper from `tests/e2e/trips.e2e.spec.ts` or seed one via Payload admin at `/admin`.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/DetailHero.tsx src/components/sections/DetailHero.module.css
git commit -m "feat(trip-detail): rewrite DetailHero with sidebar and tag chips"
```

---

## Task 5: Header transparent mode

Adds the `transparent` prop on the shared Header. Default `false` keeps every other page unchanged.

**Files:**
- Modify: `src/components/marketing/Header.tsx`
- Modify: `src/components/marketing/marketing.module.css`

- [ ] **Step 1: Edit `Header.tsx` to accept `transparent` prop and track `pastHero`**

This is a **surgical edit**, not a full rewrite. Only **three small regions** of the existing `src/components/marketing/Header.tsx` change. Everything else — imports, `NAV_LINKS`, `PHONE_DISPLAY`/`PHONE_TEL`, `PhoneIcon`, `MenuBurger`, `CloseIcon`, the entire `return (...)` block including the `<header>`, contacts bar, menu bar, and mobile drawer — stays **byte-for-byte identical** to what's on disk now.

**Region 1 — function signature.** Find:

```tsx
export function Header() {
```

Replace with:

```tsx
export function Header({ transparent = false }: { transparent?: boolean } = {}) {
```

**Region 2 — hooks block.** Find:

```tsx
  const [scrolled, setScrolled] = useState(false)
  const [hideContacts, setHideContacts] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    let lastY = 0
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 0)
      setHideContacts(y > 80 && y > lastY)
      lastY = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
```

Replace with:

```tsx
  const [scrolled, setScrolled] = useState(false)
  const [hideContacts, setHideContacts] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    let lastY = 0
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 0)
      setHideContacts(y > 80 && y > lastY)
      setPastHero(y > window.innerHeight * 0.8)
      lastY = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
```

(Only two lines are new: `const [pastHero, setPastHero] = useState(false)` and `setPastHero(y > window.innerHeight * 0.8)`.)

**Region 3 — `classes` computation.** Find:

```tsx
  const classes = [
    styles.header,
    scrolled ? styles.headerScrolled : '',
    hideContacts ? styles.headerScrolledHide : '',
  ]
    .filter(Boolean)
    .join(' ')
```

Replace with:

```tsx
  // In transparent mode, treat "at top of hero" as scrolled-hidden so the contacts bar is gone.
  const transparentAtTop = transparent && !pastHero

  const classes = [
    styles.header,
    scrolled ? styles.headerScrolled : '',
    hideContacts || transparentAtTop ? styles.headerScrolledHide : '',
    transparentAtTop ? styles.headerTransparent : '',
  ]
    .filter(Boolean)
    .join(' ')
```

Do not touch the `useEffect` for `drawerOpen`, the `<header>` JSX, or anything below the `classes` const.

- [ ] **Step 2: Add `.headerTransparent` to `marketing.module.css`**

Append (anywhere in the "Header" section near `.headerScrolled`):

```css
.headerTransparent {
  background-color: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
```

- [ ] **Step 3: Manually verify nothing regresses on other pages**

Run: `pnpm dev --port 3001`, visit `/`, `/calendar`, `/account/profile` (after login), and one auth page like `/login`. Expected: header looks identical to before this change — opaque white, contacts bar visible at top, scrolled behavior unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/Header.tsx src/components/marketing/marketing.module.css
git commit -m "feat(header): add transparent overlay mode (opt-in via prop)"
```

---

## Task 6: MarketingShell transparentHeader prop + page integration

Passes the flag through and suppresses the breadcrumb when the hero anchors to the viewport top.

**Files:**
- Modify: `src/components/marketing/MarketingShell.tsx`
- Modify: `src/app/(frontend)/trips/[slug]/page.tsx`

- [ ] **Step 1: Update `MarketingShell.tsx`**

```tsx
// src/components/marketing/MarketingShell.tsx
import { Header } from './Header'
import { Footer } from './Footer'
import { Breadcrumb, type Crumb } from './Breadcrumb'

export function MarketingShell({
  crumbs,
  children,
  transparentHeader = false,
}: {
  crumbs: Crumb[]
  children: React.ReactNode
  transparentHeader?: boolean
}) {
  return (
    <>
      <Header transparent={transparentHeader} />
      {!transparentHeader && <Breadcrumb items={crumbs} />}
      {children}
      <Footer />
    </>
  )
}
```

When `transparentHeader` is true, the Breadcrumb is skipped entirely — the hero anchors at viewport top under the fixed Header. When false (default), behavior is unchanged.

- [ ] **Step 2: Update `src/app/(frontend)/trips/[slug]/page.tsx`**

Replace the `<MarketingShell ...>` line and its `crumbs` array. Find this block:

```tsx
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/calendar', label: 'Calendar' },
        { label: event.title },
      ]}
    >
```

Replace with:

```tsx
    <MarketingShell crumbs={[]} transparentHeader>
```

No other changes to the page.

- [ ] **Step 3: Manually verify the trip detail hero**

Run: `pnpm dev --port 3001`. Open `http://localhost:3001/trips/<published-slug>`.

Expected:
- Header is transparent over the hero (white logo + nav text only, no contacts bar visible).
- Hero starts at viewport top, image fills the screen height.
- Title and lead on the left, sidebar card on the right, tag chips overlapping the bottom edge.
- Scroll down past the hero — header flips to opaque white background, contacts bar may slide in based on scroll direction.
- No console errors.
- Other pages still look correct.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/MarketingShell.tsx src/app/\(frontend\)/trips/\[slug\]/page.tsx
git commit -m "feat(trip-detail): wire transparent header and suppress breadcrumb on hero"
```

---

## Task 7: Make the smoke test pass

The test from Task 1 should now pass. Run it, fix any small issues that surface (likely just selector tightening), then commit.

- [ ] **Step 1: Run the smoke test**

Run: `pnpm exec playwright test tests/e2e/trip-detail-hero.spec.ts --reporter=list`
Expected: PASS.

- [ ] **Step 2: If anything fails, fix and re-run**

Most likely root causes if it fails:
- Selector text mismatch — check the exact rendered HTML with `--debug` flag.
- Header background still shows transparent after scroll — verify the scroll handler actually flips `pastHero` (try increasing the `waitForTimeout` from 200ms to 500ms).
- Breadcrumb assertion fails because the navigation role is reused — tighten the locator with a more specific aria-label match.

Do not commit changes that mask test failures (e.g. removing assertions). Fix the underlying issue.

- [ ] **Step 3: Run the broader test suite to confirm no regressions**

Run: `pnpm exec playwright test --reporter=list`
Expected: all e2e tests pass (or no NEW failures compared to before this branch).

If `tests/e2e/trips.e2e.spec.ts` (the R2 smoke) fails because it relied on a breadcrumb being present, update its assertions to match the new no-breadcrumb-on-trip-detail behavior — that's a legitimate update, not a workaround.

- [ ] **Step 4: Commit any test fixups**

```bash
git add tests/e2e/
git commit -m "test(trip-detail): tighten R3 hero smoke and update R2 assertions"
```

(Skip if no changes were needed.)

---

## Task 8: Manual cross-page verification

Per CLAUDE.md UI-changes rule: "start the dev server and use the feature in a browser before reporting the task as complete." Test the golden path, edge cases, and regressions.

- [ ] **Step 1: Desktop hero check**

Run `pnpm dev --port 3001`. Open `http://localhost:3001/trips/<published-slug>` at desktop width (≥ 1200px).

Verify:
- Header transparent at top, opaque after scrolling past hero.
- Title large and readable (white text over dark gradient).
- Sidebar card visible on the right, all rows present, BOOK YOUR SPOT button red and clickable (will jump to `#booking` anchor — no target yet, that's fine).
- Tag chips horizontally arranged, overlapping the bottom edge of the hero.
- Lower sections (Trip Highlights, etc.) render and look the same as before this branch.

- [ ] **Step 2: Mobile hero check**

Open dev tools, switch to iPhone 14 viewport (or any width < 768px).

Verify:
- Hero stacks: title/lead block at top, sidebar card below it.
- Tag chips become a horizontal scroll strip — scrolling sideways reveals all five chips.
- Header is still transparent overlay; the JOIN US button and hamburger are visible.
- No horizontal page-level overflow.

- [ ] **Step 3: Other-page regression check**

Visit `/`, `/calendar`, `/login`, `/account/profile` (after logging in). Verify each:
- Header is opaque (not transparent).
- Contacts bar shows at top.
- Breadcrumb where it used to appear.
- No visual diffs from before this branch.

- [ ] **Step 4: Run type-check and lint**

```bash
pnpm tsc --noEmit
pnpm lint
```

Expected: zero errors. Fix anything that surfaces.

- [ ] **Step 5: Commit any cleanup; final summary commit if needed**

If Steps 1–4 surfaced no changes, no commit needed.

If type-check or lint needed fixes:

```bash
git add -A
git commit -m "chore: fix type/lint after R3 hero rebuild"
```

---

## Done

When all tasks check off:

- New `DetailHero` rendered with sidebar + chip strip
- Shared `Header` and `MarketingShell` gained opt-in transparent props (default off)
- Trip detail page opts in
- Smoke test passes
- No regressions on other pages
- Type-check + lint clean

Branch ready for review / merge into `devel`.

## Spec coverage check

| Spec section | Task |
|---|---|
| `Header.tsx` gains `transparent` prop | Task 5 |
| `MarketingShell.tsx` gains `transparentHeader`, skips breadcrumb | Task 6 |
| `.headerTransparent` CSS modifier | Task 5 |
| `DetailHero` rewrite (image + grid + sidebar + chip strip) | Task 4 |
| `PricingSidebar.tsx` + `.module.css` | Task 3 |
| `TagChipStrip.tsx` + `.module.css` | Task 2 |
| Trip detail page passes `transparentHeader` + empty crumbs | Task 6 |
| Hardcoded sidebar values + chip array in `DetailHero.tsx` | Task 4 |
| Responsive breakpoints (desktop / tablet / mobile) | Task 4 (CSS) |
| Playwright smoke test | Tasks 1 + 7 |
| Manual cross-page verification | Task 8 |
