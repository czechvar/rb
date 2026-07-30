# Trip Category Page Render — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public Next.js route + components that render a `Type` record as the Trip Category / Program landing page (the climbing-camp wireframe layout). Page lists the Events of this type as linked entries (per Martin's three-tier model: Type → Event → EventDate).

**Architecture:** Server components only (no client-side state). One server component per wireframe section. Page is assembled in `src/app/(frontend)/programs/[slug]/page.tsx` which fetches a published Type by slug, fetches related events/faqs/reviews/guides, and composes the section list in fixed order (per Martin: "YES ORDER IS FIXED"). Rich-text fields rendered via `@payloadcms/richtext-lexical/react`.

**Tech Stack:** Next.js 16 App Router, React 19 server components, Payload Local API (`getPayload({ config })`), Lexical rich-text renderer, plain CSS Modules per section.

**URL pattern (tentative):** `/programs/[type-slug]` — this is a v1 choice. Final URL needs to map to the old rockbusters.net URLs per the SEO redirect requirement; revisit before launch.

**Plan 1 prerequisite:** schema extensions on `feat/trip-pages-schema` (now landed: extended Types, FAQs, Reviews, etc.). This plan branches off that.

**Out of scope for this plan:**
- Pixel-perfect Figma design implementation (basic semantic styling here; real design comes later)
- Trip Detail page (Plan 3)
- Booking flow (Plan 4)
- Image optimization beyond what `next/image` gives by default
- Old-URL → new-URL 301 redirect mapping

---

## File Structure

**New files:**
- `src/lib/payload.ts` — cached server-side Payload client
- `src/lib/lexical.tsx` — Lexical JSON → JSX renderer wrapper
- `src/lib/media.ts` — Media URL extractor helper
- `src/components/marketing/Header.tsx` — top nav (sticky brand row)
- `src/components/marketing/Footer.tsx` — bottom footer
- `src/components/marketing/Breadcrumb.tsx`
- `src/components/marketing/MarketingShell.tsx` — wraps a marketing page with Header + Breadcrumb + Footer
- `src/components/marketing/marketing.module.css` — shared marketing styles
- `src/components/sections/Hero.tsx` + `Hero.module.css`
- `src/components/sections/HighlightsGrid.tsx` + module css
- `src/components/sections/AudienceCards.tsx` + module css
- `src/components/sections/CurriculumPillars.tsx` + module css
- `src/components/sections/ProgramFlow.tsx` + module css
- `src/components/sections/WeekVariants.tsx` + module css
- `src/components/sections/LocationBlock.tsx` + module css
- `src/components/sections/AccommodationLogistics.tsx` + module css
- `src/components/sections/CoachesRich.tsx` + module css
- `src/components/sections/ResultsOutcomes.tsx` + module css
- `src/components/sections/FAQList.tsx` + module css
- `src/components/sections/ReviewsRow.tsx` + module css
- `src/components/sections/HowToBook.tsx` + module css
- `src/components/sections/WhyRockbusters.tsx` + module css
- `src/components/sections/LinkedEvents.tsx` + module css
- `src/components/sections/FinalCTA.tsx` + module css
- `src/app/(frontend)/programs/[slug]/page.tsx` — route
- `src/app/(frontend)/programs/[slug]/not-found.tsx` — 404
- `tests/e2e/programs.e2e.spec.ts` — Playwright smoke test

**Modified files:**
- `src/app/(frontend)/styles.css` — add CSS variables for marketing palette
- `src/app/(frontend)/layout.tsx` — currently OK, may need a metadata pass

---

## Task 1 — Foundation: Payload server client + rich-text + media helpers

**Files:**
- Create: `src/lib/payload.ts`, `src/lib/lexical.tsx`, `src/lib/media.ts`

- [ ] **Step 1: `src/lib/payload.ts`** — cached Payload instance

```ts
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

let cached: Payload | undefined

export async function getPayloadClient(): Promise<Payload> {
  if (!cached) cached = await getPayload({ config })
  return cached
}
```

- [ ] **Step 2: `src/lib/lexical.tsx`** — Lexical → JSX

```tsx
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export function Lexical({ data }: { data: SerializedEditorState | null | undefined }) {
  if (!data) return null
  return <RichText data={data} />
}
```

- [ ] **Step 3: `src/lib/media.ts`** — get URL from Payload Media relation

```ts
import type { Media } from '@/payload-types'

type Reffed = number | Media | null | undefined

export function mediaUrl(media: Reffed): string | undefined {
  if (!media || typeof media === 'number') return undefined
  return media.url ?? undefined
}

export function mediaAlt(media: Reffed): string {
  if (!media || typeof media === 'number') return ''
  return media.alt ?? ''
}
```

- [ ] **Step 4: Commit** — `feat: add server payload client and lexical/media helpers`

---

## Task 2 — Marketing shell (Header, Footer, Breadcrumb, MarketingShell)

**Files:**
- Create: `src/components/marketing/Header.tsx`, `Footer.tsx`, `Breadcrumb.tsx`, `MarketingShell.tsx`, `marketing.module.css`

`Header`: brand mark left, primary nav right (Calendar / Destinations / Team / Blog / Contact) — matches wireframe nav.

`Footer`: brand + contact line + copyright.

`Breadcrumb`: takes an array of `{ href, label }` and renders the `Home / X / Y` strip.

`MarketingShell` wraps `children` with header/breadcrumb/footer.

```tsx
// Header.tsx
import Link from 'next/link'
import styles from './marketing.module.css'

export function Header() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.brand}>ROCKBUSTERS</Link>
      <div className={styles.navLinks}>
        <Link href="/calendar">Calendar</Link>
        <Link href="/destinations">Destinations</Link>
        <Link href="/team">Team</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/contact">Contact</Link>
      </div>
    </nav>
  )
}
```

```tsx
// Breadcrumb.tsx
import Link from 'next/link'
import styles from './marketing.module.css'

export type Crumb = { href?: string; label: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className={styles.breadcrumb}>
      {items.map((c, i) => (
        <span key={i}>
          {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
          {i < items.length - 1 ? ' / ' : ''}
        </span>
      ))}
    </div>
  )
}
```

```tsx
// Footer.tsx
import styles from './marketing.module.css'
export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>ROCKBUSTERS.NET</span>
      <span>© {new Date().getFullYear()}</span>
    </footer>
  )
}
```

```tsx
// MarketingShell.tsx
import { Header } from './Header'
import { Footer } from './Footer'
import { Breadcrumb, type Crumb } from './Breadcrumb'

export function MarketingShell({ crumbs, children }: { crumbs: Crumb[]; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <Breadcrumb items={crumbs} />
      {children}
      <Footer />
    </>
  )
}
```

`marketing.module.css` — basic dark nav, monospace nav text, breadcrumb bar, dark footer. (See Hero CSS for matching palette.)

- [ ] Implement → commit — `feat: add marketing shell components`

---

## Task 3 — Route skeleton + 404

**Files:**
- Create: `src/app/(frontend)/programs/[slug]/page.tsx`, `not-found.tsx`

Route is async server component. Fetches a `published` Type by slug. If not found, calls `notFound()`.

```tsx
// page.tsx
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'

type Props = { params: Promise<{ slug: string }> }

export default async function ProgramPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'types',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const type = docs[0]
  if (!type) notFound()

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/programs', label: 'Programs' },
        { label: type.name },
      ]}
    >
      <main>
        {/* sections wired up in Tasks 4-7 */}
        <h1>{type.name}</h1>
      </main>
    </MarketingShell>
  )
}
```

```tsx
// not-found.tsx
import { MarketingShell } from '@/components/marketing/MarketingShell'

export default function NotFound() {
  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Not found' }]}>
      <main style={{ padding: '60px', textAlign: 'center' }}>
        <h1>Program not found</h1>
        <p>This program may not exist yet or is currently unpublished.</p>
      </main>
    </MarketingShell>
  )
}
```

- [ ] Implement → smoke-check via `pnpm dev` → commit — `feat: add /programs/[slug] route skeleton`

---

## Task 4 — Above-the-fold sections: Hero + Highlights + Audience

**Files:**
- Create: `src/components/sections/Hero.tsx`, `HighlightsGrid.tsx`, `AudienceCards.tsx` + their `.module.css` files

`Hero` — title + shortDescription + badge row + booking box on the right. Booking box for **Category page** shows price ranges (computed from linked EventDates, fallback "see dates below"), and a "BOOK YOUR SPOT" CTA that scrolls to the LinkedEvents section (Plan 4 wires it to a real booking flow).

```tsx
// Hero.tsx
import type { Type } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './Hero.module.css'

export function Hero({ type, priceFrom, currency }: { type: Type; priceFrom?: number; currency?: string }) {
  return (
    <section className={styles.hero}>
      <div className={styles.text}>
        <h1>{type.name}</h1>
        {type.shortDescription && <p className={styles.subline}>{type.shortDescription}</p>}
      </div>
      <aside className={styles.booking}>
        {priceFrom != null && (
          <div className={styles.price}>
            from {currency ?? 'EUR'} {priceFrom}
          </div>
        )}
        <a href="#dates" className={styles.cta}>BOOK YOUR SPOT →</a>
      </aside>
    </section>
  )
}
```

`HighlightsGrid` — renders `type.highlights` as a card grid.

```tsx
import type { Type } from '@/payload-types'
import styles from './HighlightsGrid.module.css'

export function HighlightsGrid({ items, heading = 'Highlights' }: { items: Type['highlights']; heading?: string }) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <h2>{heading}</h2>
      <ul className={styles.grid}>
        {items.map((h, i) => (
          <li key={i} className={styles.card}>✓ {h.text}</li>
        ))}
      </ul>
    </section>
  )
}
```

`AudienceCards` — renders `audienceCards` (heading + body + highlighted) + optional `soloNote` + `redirectCallout`.

```tsx
import type { Type } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './AudienceCards.module.css'

export function AudienceCards({ cards, soloNote, redirectCallout }: {
  cards: Type['audienceCards']
  soloNote?: string | null
  redirectCallout?: Type['redirectCallout']
}) {
  if (!cards?.length) return null
  return (
    <section className={styles.section}>
      <h2>Who This Camp Is For</h2>
      <div className={styles.grid}>
        {cards.map((c, i) => (
          <div key={i} className={`${styles.card} ${c.highlighted ? styles.highlighted : ''}`}>
            <h3>{c.heading}</h3>
            <p>{c.body}</p>
          </div>
        ))}
      </div>
      {soloNote && <p className={styles.soloNote}>{soloNote}</p>}
      {redirectCallout && <div className={styles.callout}><Lexical data={redirectCallout} /></div>}
    </section>
  )
}
```

CSS modules: dark hero with grid 1fr/320px on desktop, stacking on mobile; cards as bordered tiles; highlighted card with accent border.

- [ ] Implement components, wire into page.tsx, commit — `feat: add Hero, HighlightsGrid, AudienceCards sections`

---

## Task 5 — Curriculum + ProgramFlow + WeekVariants

**Files:**
- Create: `src/components/sections/CurriculumPillars.tsx`, `ProgramFlow.tsx`, `WeekVariants.tsx` + module CSS

`CurriculumPillars` — 3-pillar grid; each pillar has icon, title, bullets.

```tsx
import type { Type } from '@/payload-types'
import styles from './CurriculumPillars.module.css'

export function CurriculumPillars({ pillars }: { pillars: Type['curriculumPillars'] }) {
  if (!pillars?.length) return null
  return (
    <section className={styles.section}>
      <h2>What You'll Work On</h2>
      <div className={styles.grid}>
        {pillars.map((p, i) => (
          <div key={i} className={styles.pillar}>
            <div className={styles.icon}>{p.icon}</div>
            <h3>{p.title}</h3>
            <ul>
              {(p.bullets ?? []).map((b, j) => <li key={j}>{b.text}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
```

`ProgramFlow` — renders framingParagraph + mixAndMatchBlocks (numbered list) + tailoredToYou bullets + focusTracks (color-tagged cards).

```tsx
import type { Type } from '@/payload-types'
import styles from './ProgramFlow.module.css'

export function ProgramFlow({ flow }: { flow: Type['programFlow'] }) {
  if (!flow) return null
  const { framingParagraph, mixAndMatchBlocks, tailoredToYou, focusTracks } = flow
  return (
    <section className={styles.section}>
      <h2>Program & Daily Flow</h2>
      {framingParagraph && <p>{framingParagraph}</p>}
      {mixAndMatchBlocks?.length ? (
        <ol className={styles.blocks}>
          {mixAndMatchBlocks.map((b, i) => (
            <li key={i}>
              <h3>{b.title}</h3>
              {b.tagline && <p className={styles.tagline}>{b.tagline}</p>}
              <ul>{(b.bullets ?? []).map((x, j) => <li key={j}>{x.text}</li>)}</ul>
            </li>
          ))}
        </ol>
      ) : null}
      {tailoredToYou?.length ? (
        <>
          <h3>Tailored to you</h3>
          <ul>{tailoredToYou.map((b, i) => <li key={i}>{b.text}</li>)}</ul>
        </>
      ) : null}
      {focusTracks?.length ? (
        <>
          <h3>Example focus tracks</h3>
          <div className={styles.tracks}>
            {focusTracks.map((t, i) => (
              <div key={i} className={`${styles.track} ${styles[`color-${t.colorTag ?? 'blue'}`]}`}>
                <h4>{t.title}</h4>
                <ul>{(t.bullets ?? []).map((x, j) => <li key={j}>{x.text}</li>)}</ul>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
```

`WeekVariants` — 2-card comparison + italic recommendation.

```tsx
import type { Type } from '@/payload-types'
import styles from './WeekVariants.module.css'

export function WeekVariants({ variants, recommendation }: {
  variants: Type['weekVariants']
  recommendation?: string | null
}) {
  if (!variants?.length) return null
  return (
    <section className={styles.section}>
      <h2>One week or two?</h2>
      <div className={styles.grid}>
        {variants.map((v, i) => (
          <div key={i} className={styles.card}>
            <h3>{v.title}</h3>
            <ul>{(v.bullets ?? []).map((b, j) => <li key={j}>{b.text}</li>)}</ul>
          </div>
        ))}
      </div>
      {recommendation && <p className={styles.recommendation}>{recommendation}</p>}
    </section>
  )
}
```

- [ ] Implement → wire into page → commit — `feat: add curriculum, program flow, week variants sections`

---

## Task 6 — Location + AccommodationLogistics + CoachesRich + Results

**Files:**
- Create: `LocationBlock.tsx`, `AccommodationLogistics.tsx`, `CoachesRich.tsx`, `ResultsOutcomes.tsx` + module CSS

`LocationBlock` — paragraph from `content` + a placeholder map area + a fact bullet list. (Real map integration later.)

`AccommodationLogistics` — 2-col layout with Accommodation/Transport on left, Included/Food/NotIncluded boxes on right. Each box renders bulleted arrays.

`CoachesRich` — fetches `type.coaches` as `Guide[]` (depth=2 already pulls them), renders cards with photo + name + role label (from `Guide.name`) + bio paragraph (from `Guide.content` rich text) + credentials. **Note**: Guide collection has `content` (richText) but no separate `credentials` field — for now the credentials bullet list is rendered from the same `content` or skipped. (Future: add `credentials` array field to Guides — out of scope here.)

```tsx
import Image from 'next/image'
import { Lexical } from '@/lib/lexical'
import { mediaUrl, mediaAlt } from '@/lib/media'
import type { Type, Guide } from '@/payload-types'
import styles from './CoachesRich.module.css'

function isGuide(x: number | Guide): x is Guide {
  return typeof x !== 'number'
}

export function CoachesRich({ coaches, framing }: { coaches: Type['coaches']; framing?: string | null }) {
  const resolved = (coaches ?? []).filter(isGuide)
  if (!resolved.length) return null
  return (
    <section className={styles.section}>
      <h2>Your Coaches</h2>
      {framing && <p className={styles.framing}>{framing}</p>}
      <div className={styles.row}>
        {resolved.map(g => {
          const url = mediaUrl(g.photo)
          return (
            <div key={g.id} className={styles.card}>
              {url && <Image src={url} alt={mediaAlt(g.photo)} width={144} height={144} className={styles.photo} />}
              <h3>{g.name}</h3>
              {g.content && <div className={styles.bio}><Lexical data={g.content} /></div>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

`ResultsOutcomes` — grid of outcome cards.

```tsx
import type { Type } from '@/payload-types'
import styles from './ResultsOutcomes.module.css'

export function ResultsOutcomes({ items }: { items: Type['results'] }) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <h2>Results You Can Expect</h2>
      <ul className={styles.grid}>
        {items.map((r, i) => <li key={i} className={styles.card}>{r.text}</li>)}
      </ul>
    </section>
  )
}
```

- [ ] Implement → wire in → commit — `feat: add location, logistics, coaches, results sections`

---

## Task 7 — FAQ + Reviews + LinkedEvents + HowToBook + WhyRockbusters + FinalCTA

**Files:**
- Create: `FAQList.tsx`, `ReviewsRow.tsx`, `LinkedEvents.tsx`, `HowToBook.tsx`, `WhyRockbusters.tsx`, `FinalCTA.tsx` + module CSS

`FAQList` — fetches its own data inside the component (server component) filtered by `type` relation. Or accepts data as prop and parent fetches. **Convention for this plan:** parent route does ONE Payload `find` per related collection (faqs, reviews, linked events) and passes results as props — keeps data fetching centralized.

```tsx
import type { Faq } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './FAQList.module.css'

export function FAQList({ items }: { items: Faq[] }) {
  if (!items.length) return null
  return (
    <section className={styles.section}>
      <h2>FAQ</h2>
      <dl className={styles.list}>
        {items.map(faq => (
          <div key={faq.id} className={styles.item}>
            <dt>{faq.question}</dt>
            <dd><Lexical data={faq.answer} /></dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
```

`ReviewsRow` — 3-up grid of quote cards (or however many exist).

```tsx
import type { Review } from '@/payload-types'
import styles from './ReviewsRow.module.css'

export function ReviewsRow({ items }: { items: Review[] }) {
  if (!items.length) return null
  return (
    <section className={styles.section}>
      <h2>What Past Climbers Say</h2>
      <div className={styles.row}>
        {items.map(r => (
          <blockquote key={r.id} className={styles.card}>
            <p>{r.quote}</p>
            <footer>
              {r.reviewerName}
              {r.reviewerLocation ? `, ${r.reviewerLocation}` : ''}
              {r.resultLine ? ` · ${r.resultLine}` : ''}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}
```

`LinkedEvents` — list of Events under this Type. Each row links to `/trips/[event-slug]` (Plan 3 will build that route). For Plan 2, the link target is just a placeholder href = `#` for events whose detail page doesn't exist yet.

```tsx
import Link from 'next/link'
import type { Event } from '@/payload-types'
import styles from './LinkedEvents.module.css'

export function LinkedEvents({ events }: { events: Event[] }) {
  return (
    <section id="dates" className={styles.section}>
      <h2>Upcoming dates</h2>
      {events.length === 0 ? (
        <p className={styles.empty}>No upcoming dates published yet — check back soon.</p>
      ) : (
        <ul className={styles.list}>
          {events.map(e => (
            <li key={e.id}>
              <Link href={`/trips/${e.slug}`}>{e.title}</Link>
              {e.shortDescription && <p>{e.shortDescription}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

`HowToBook` — 4-step grid (currently static content; placeholder until we model these as content fields). Since the worksheet marked this Structured and reusable, this could be either a global block on the site (best) or hardcoded for v1.

```tsx
import styles from './HowToBook.module.css'

const STEPS = [
  { n: '①', text: 'Choose your preferred date' },
  { n: '②', text: 'Send an inquiry or book online' },
  { n: '③', text: 'Personal consultation with our team' },
  { n: '④', text: 'Pay deposit to secure your spot' },
]

export function HowToBook() {
  return (
    <section className={styles.section}>
      <h2>How to Book</h2>
      <ol className={styles.grid}>
        {STEPS.map((s, i) => (
          <li key={i} className={styles.step}>
            <span className={styles.num}>{s.n}</span>
            <span>{s.text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
```

`WhyRockbusters` — band with positioning paragraph + 5 differentiator bullets. Also static for v1 (same pattern as HowToBook).

```tsx
import styles from './WhyRockbusters.module.css'

const DIFFERENTIATORS = [
  'Small groups for individual coaching attention',
  'Elite coaches with high-grade ascent backgrounds',
  'Focus on measurable skill development',
  'Video analysis and personalised plans',
  'Hand-picked destinations',
]

export function WhyRockbusters() {
  return (
    <section className={styles.band}>
      <h2>Why Rockbusters</h2>
      <div className={styles.grid}>
        <p>
          Rockbusters is Europe's leading climbing performance community —
          built by climbers who believe the best way to help others improve
          is to have done it themselves at the highest level.
        </p>
        <ul>
          {DIFFERENTIATORS.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </div>
    </section>
  )
}
```

`FinalCTA` — dark band with headline + summary line + primary BOOK CTA + secondary ASK CTA.

```tsx
import type { Type } from '@/payload-types'
import styles from './FinalCTA.module.css'

export function FinalCTA({ type }: { type: Type }) {
  return (
    <section className={styles.band}>
      <h2>Ready to commit?</h2>
      {type.shortDescription && <p>{type.shortDescription}</p>}
      <div className={styles.buttons}>
        <a href="#dates" className={styles.primary}>BOOK YOUR SPOT →</a>
        <a href="/contact" className={styles.secondary}>ASK A QUESTION</a>
      </div>
    </section>
  )
}
```

- [ ] Implement → wire into page → commit — `feat: add FAQ, Reviews, LinkedEvents, HowToBook, WhyRockbusters, FinalCTA`

---

## Task 8 — Wire the page together

Route fetches Type by slug AND in parallel fetches: Events with `types contains` this type, FAQs with `type` = this type, Reviews with `type` = this type, EventDates for price-from calc.

Composes sections in this order (per Martin's fixed-ordering answer):

1. Hero
2. HighlightsGrid (`type.highlights`)
3. AudienceCards
4. CurriculumPillars
5. ProgramFlow
6. WeekVariants
7. LocationBlock
8. AccommodationLogistics
9. CoachesRich
10. ResultsOutcomes
11. FAQList (filtered)
12. ReviewsRow (filtered)
13. LinkedEvents (`#dates` anchor for hero CTA)
14. HowToBook
15. WhyRockbusters
16. FinalCTA

```tsx
// page.tsx — full version
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Hero } from '@/components/sections/Hero'
import { HighlightsGrid } from '@/components/sections/HighlightsGrid'
import { AudienceCards } from '@/components/sections/AudienceCards'
import { CurriculumPillars } from '@/components/sections/CurriculumPillars'
import { ProgramFlow } from '@/components/sections/ProgramFlow'
import { WeekVariants } from '@/components/sections/WeekVariants'
import { LocationBlock } from '@/components/sections/LocationBlock'
import { AccommodationLogistics } from '@/components/sections/AccommodationLogistics'
import { CoachesRich } from '@/components/sections/CoachesRich'
import { ResultsOutcomes } from '@/components/sections/ResultsOutcomes'
import { FAQList } from '@/components/sections/FAQList'
import { ReviewsRow } from '@/components/sections/ReviewsRow'
import { LinkedEvents } from '@/components/sections/LinkedEvents'
import { HowToBook } from '@/components/sections/HowToBook'
import { WhyRockbusters } from '@/components/sections/WhyRockbusters'
import { FinalCTA } from '@/components/sections/FinalCTA'

type Props = { params: Promise<{ slug: string }> }

export default async function ProgramPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs: typeDocs } = await payload.find({
    collection: 'types',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const type = typeDocs[0]
  if (!type) notFound()

  const [eventsResult, faqsResult, reviewsResult] = await Promise.all([
    payload.find({
      collection: 'events',
      where: {
        and: [
          { types: { contains: type.id } },
          { state: { equals: 'published' } },
        ],
      },
      depth: 1,
      sort: 'title',
      limit: 50,
    }),
    payload.find({
      collection: 'faqs',
      where: { and: [{ type: { equals: type.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
    payload.find({
      collection: 'reviews',
      where: { and: [{ type: { equals: type.id } }, { active: { equals: true } }] },
      sort: 'position',
      limit: 50,
    }),
  ])

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/programs', label: 'Programs' },
        { label: type.name },
      ]}
    >
      <main>
        <Hero type={type} />
        <HighlightsGrid items={type.highlights} heading="Program Highlights" />
        <AudienceCards
          cards={type.audienceCards}
          soloNote={type.soloNote}
          redirectCallout={type.redirectCallout}
        />
        <CurriculumPillars pillars={type.curriculumPillars} />
        <ProgramFlow flow={type.programFlow} />
        <WeekVariants variants={type.weekVariants} recommendation={type.weekRecommendation} />
        <LocationBlock content={type.content} />
        <AccommodationLogistics accommodation={type.accommodation} transport={type.transport} />
        <CoachesRich coaches={type.coaches} framing={type.coachFramingParagraph} />
        <ResultsOutcomes items={type.results} />
        <FAQList items={faqsResult.docs} />
        <ReviewsRow items={reviewsResult.docs} />
        <LinkedEvents events={eventsResult.docs} />
        <HowToBook />
        <WhyRockbusters />
        <FinalCTA type={type} />
      </main>
    </MarketingShell>
  )
}
```

- [ ] Wire → run dev → commit — `feat: assemble Trip Category page with all 16 sections`

---

## Task 9 — Playwright smoke test

**Files:**
- Create: `tests/e2e/programs.e2e.spec.ts`

Test starts the dev server (or assumes one is running per playwright config), seeds a published Type via Payload Local API, visits `/programs/[slug]`, asserts the H1 + a few key section headings appear.

```ts
import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '@payload-config'

test.describe('Program page', () => {
  test('renders sections for a published Type', async ({ page }) => {
    const payload = await getPayload({ config })
    const slug = `e2e-program-${Date.now()}`
    await payload.create({
      collection: 'types',
      data: {
        // @ts-expect-error slug auto-filled by hook from name
        name: `E2E Program ${Date.now()}`,
        slug,
        state: 'published',
        active: true,
        shortDescription: 'E2E smoke.',
        highlights: [{ text: 'A' }, { text: 'B' }],
      },
    })

    await page.goto(`http://localhost:3000/programs/${slug}`)
    await expect(page.locator('h1')).toContainText('E2E Program')
    await expect(page.getByText('Program Highlights')).toBeVisible()
  })

  test('404s for a draft Type', async ({ page }) => {
    const payload = await getPayload({ config })
    const slug = `e2e-draft-${Date.now()}`
    await payload.create({
      collection: 'types',
      data: {
        // @ts-expect-error
        name: `E2E Draft ${Date.now()}`,
        slug,
        state: 'draft',
      },
    })
    const res = await page.goto(`http://localhost:3000/programs/${slug}`)
    expect(res?.status()).toBe(404)
  })
})
```

- [ ] Test → run `pnpm test:e2e` → commit — `test: add Trip Category page smoke tests`

---

## Self-review

- **Spec coverage**: 14 worksheet sections + Linked Events block = 15 sections rendered, all in fixed order per Martin's "YES ORDER IS FIXED" answer. Per-trip CTAs (Hero + FinalCTA) anchor to the `#dates` LinkedEvents block; full booking flow is Plan 4.
- **Open items deferred to Plan 4**: real booking trigger from BOOK CTAs.
- **Deferred**: pixel-perfect design (carbon-paper of the wireframe CSS would be Plan-2.5 once Figma is integrated).
- **Reusability across detail page (Plan 3)**: `HighlightsGrid`, `FAQList`, `ReviewsRow`, `LocationBlock`, `AccommodationLogistics`, `ResultsOutcomes`, `HowToBook`, `WhyRockbusters`, `FinalCTA` should be reusable as-is (they take generic prop shapes). `CoachesRich` is category-specific; detail page builds `CoachesMinimal` in Plan 3.
