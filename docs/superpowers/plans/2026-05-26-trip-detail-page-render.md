# Trip Detail Page Render — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public Next.js route + components that render an `Event` record as the Trip Detail page (the salzburg-safari wireframe layout). Page shows the trip's specific dates, day-by-day itinerary, equipment list, partner block, and minimal coach cards.

**Architecture:** Server components only. Mirrors the Plan 2 (`/programs/[slug]`) pattern: route fetches the published Event by slug + parallel-fetches its FAQs, Reviews (filtered by `event` relation), and EventDates. Composes section list in fixed order.

**URL pattern:** `/trips/[event-slug]` (matches the `<Link href={`/trips/${e.slug}`}>` already wired in Plan 2's `LinkedEvents` component).

**Worktree isolation:** This plan executes in a separate git worktree (`/Users/janantl/Work/rockbusters/v3-trip-detail`) off `feat/trip-category-page`, so a parallel Claude session can keep iterating on the design-system in the main checkout without file-write collisions. Components in `src/components/marketing/*` and globals (`src/app/(frontend)/styles.css`) are **off-limits** here — design-system Claude owns them.

**Plan 1 + Plan 2 prerequisites:** schema extensions, marketing shell, 16 Plan-2 section components all landed.

---

## Section ordering on the Trip Detail page (fixed, per Martin)

1. **DetailHero** *(new)* — single fixed price, JOIN US + ASK A QUESTION CTAs
2. **HighlightsGrid** *(reuse)* — `event.highlights`
3. **AudienceCards** *(reuse)* — `event.audienceCards`
4. **Prerequisites** *(new, small)* — bullet list rider-type prerequisites
5. **EssentialEquipment** *(new)* — equipment grid with mandatory flag
6. **WhatYouLearn** *(new)* — 2-col themed boxes
7. **DayByDayItinerary** *(new, heaviest)* — N days (max 14) with per-day image card, eyebrow, heading, description, highlight tags, time schedule
8. **LocationBlock** *(reuse)* — `event.content` for venue description
9. **EventAccommodationLogistics** *(new)* — Event.accommodation has `cuisineHighlights` extra vs. Type
10. **PartnerBlock** *(new)* — gear-demo / partnership panel
11. **CoachesMinimal** *(new)* — simpler coach cards (photo · name · role) + team-wide bullets
12. **ReviewsRow** *(reuse)* — filtered by `event`
13. **FAQList** *(reuse)* — filtered by `event`
14. **HowToBook** *(reuse)*
15. **WhyRockbusters** *(reuse)*
16. **EventFinalCTA** *(new)* — summary line derived from Event

---

## File Structure

**New files:**
- `src/components/sections/DetailHero.tsx` + `.module.css`
- `src/components/sections/Prerequisites.tsx` + `.module.css`
- `src/components/sections/EssentialEquipment.tsx` + `.module.css`
- `src/components/sections/WhatYouLearn.tsx` + `.module.css`
- `src/components/sections/DayByDayItinerary.tsx` + `.module.css`
- `src/components/sections/EventAccommodationLogistics.tsx` + `.module.css`
- `src/components/sections/PartnerBlock.tsx` + `.module.css`
- `src/components/sections/CoachesMinimal.tsx` + `.module.css`
- `src/components/sections/EventFinalCTA.tsx` + `.module.css`
- `src/app/(frontend)/trips/[slug]/page.tsx`
- `src/app/(frontend)/trips/[slug]/not-found.tsx`
- `tests/e2e/trips.e2e.spec.ts`

**Unchanged (off-limits to this branch):**
- `src/components/marketing/*` — design-system Claude owns these
- `src/app/(frontend)/styles.css`, `layout.tsx` — globals
- `src/components/sections/*` from Plan 2 — reused as-is; no edits

---

## Task 1 — Route skeleton at `/trips/[slug]`

**Files:**
- Create: `src/app/(frontend)/trips/[slug]/page.tsx`, `not-found.tsx`

Mirror the `/programs/[slug]` route. Fetch a published Event by slug, depth=2 so `coaches` and `partner` relations resolve. Parallel-fetch FAQs (filtered by `event` + `active`), Reviews (filtered by `event` + `active`), EventDates (for hero price/date).

```tsx
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'

type Props = { params: Promise<{ slug: string }> }

export default async function TripPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const event = docs[0]
  if (!event) notFound()

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/calendar', label: 'Calendar' },
        { label: event.title },
      ]}
    >
      <main>
        <h1>{event.title}</h1>
      </main>
    </MarketingShell>
  )
}
```

- [ ] Implement → commit `feat: add /trips/[slug] route skeleton`

---

## Task 2 — DetailHero

Single fixed price from the earliest published EventDate (if available); JOIN US + ASK A QUESTION CTAs. Title + overview + badges.

```tsx
import type { Event, EventDate } from '@/payload-types'
import styles from './DetailHero.module.css'

export function DetailHero({ event, firstDate }: { event: Event; firstDate?: EventDate }) {
  return (
    <section className={styles.hero}>
      <div className={styles.text}>
        <h1>{event.title}</h1>
        {event.shortDescription && <p className={styles.overview}>{event.shortDescription}</p>}
      </div>
      <aside className={styles.booking}>
        {firstDate ? (
          <>
            <div className={styles.price}>
              {firstDate.currency} {firstDate.price.toLocaleString()}
            </div>
            <div className={styles.priceNote}>per person</div>
          </>
        ) : (
          <div className={styles.price}>See dates</div>
        )}
        <a href="#dates" className={styles.primaryCta}>JOIN US →</a>
        <a href="/contact" className={styles.secondaryCta}>ASK A QUESTION</a>
      </aside>
    </section>
  )
}
```

- [ ] Implement + module CSS (similar to Plan 2 Hero) → commit `feat: add DetailHero section`

---

## Task 3 — Prerequisites + EssentialEquipment

Two thin components for Section 3 (Who This Trip Is For) sub-blocks.

```tsx
// Prerequisites.tsx
import type { Event } from '@/payload-types'
import styles from './Prerequisites.module.css'

export function Prerequisites({ items }: { items?: Event['prerequisites'] }) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <h2>Climber Type &amp; Prerequisites</h2>
      <ul className={styles.bullets}>
        {items.map((b, i) => <li key={i}>{b.text}</li>)}
      </ul>
    </section>
  )
}
```

```tsx
// EssentialEquipment.tsx
import type { Event } from '@/payload-types'
import styles from './EssentialEquipment.module.css'

export function EssentialEquipment({
  items,
  intro,
}: {
  items?: Event['essentialEquipment']
  intro?: Event['equipmentIntro']
}) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <h2>Essential Equipment</h2>
      {intro && <p className={styles.intro}>{intro}</p>}
      <ul className={styles.grid}>
        {items.map((eq, i) => (
          <li key={i} className={`${styles.item} ${eq.mandatory ? styles.mandatory : ''}`}>
            {eq.icon && <span className={styles.icon}>{eq.icon}</span>}
            <strong>{eq.name}</strong>
            {eq.note && <span className={styles.note}>{eq.note}</span>}
            {eq.mandatory && <span className={styles.mandatoryBadge}>Mandatory</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] Implement + module CSS → commit `feat: add Prerequisites and EssentialEquipment sections`

---

## Task 4 — WhatYouLearn (2-col)

```tsx
import type { Event } from '@/payload-types'
import styles from './WhatYouLearn.module.css'

export function WhatYouLearn({ data }: { data?: Event['whatYouLearn'] }) {
  if (!data) return null
  const { intro, box1Heading, box1Bullets, box2Heading, box2Bullets } = data
  const hasAnything = intro || box1Heading || box1Bullets?.length || box2Heading || box2Bullets?.length
  if (!hasAnything) return null
  return (
    <section className={styles.section}>
      <h2>What You Will Learn &amp; Achieve</h2>
      {intro && <p className={styles.intro}>{intro}</p>}
      <div className={styles.grid}>
        {(box1Heading || box1Bullets?.length) && (
          <div className={styles.box}>
            {box1Heading && <h3>{box1Heading}</h3>}
            {box1Bullets?.length ? (
              <ul>{box1Bullets.map((b, i) => <li key={i}>{b.text}</li>)}</ul>
            ) : null}
          </div>
        )}
        {(box2Heading || box2Bullets?.length) && (
          <div className={styles.box}>
            {box2Heading && <h3>{box2Heading}</h3>}
            {box2Bullets?.length ? (
              <ul>{box2Bullets.map((b, i) => <li key={i}>{b.text}</li>)}</ul>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] Implement + module CSS → commit `feat: add WhatYouLearn section`

---

## Task 5 — DayByDayItinerary (heaviest)

Renders the days array as a stacked list of day panels. Each panel: image card on left (badge + icon + destination + meta), body on right (eyebrow + heading + description + highlight tags + time schedule). For v1 we render sequentially (no tabbed JS), letting CSS make it scannable. Plan 3.5 could swap to a tabbed client-component if needed.

```tsx
import Image from 'next/image'
import type { Event } from '@/payload-types'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from './DayByDayItinerary.module.css'

export function DayByDayItinerary({ data }: { data?: Event['itinerary'] }) {
  if (!data?.days?.length) return null
  return (
    <section className={styles.section}>
      <h2>Day-by-Day Itinerary</h2>
      {data.intro && <p className={styles.intro}>{data.intro}</p>}
      <ol className={styles.days}>
        {data.days.map((day, i) => {
          const url = mediaUrl(day.image)
          return (
            <li key={i} className={styles.day}>
              <div className={styles.imgCol}>
                {url ? (
                  <Image src={url} alt={mediaAlt(day.image)} width={320} height={220} className={styles.img} />
                ) : (
                  <div className={styles.imgPlaceholder}>[ PHOTO ]</div>
                )}
                {day.dayBadge && <div className={styles.dayBadge}>{day.dayBadge}</div>}
                {day.destinationIcon && <div className={styles.destinationIcon}>{day.destinationIcon}</div>}
                <div className={styles.destinationName}>{day.destinationName}</div>
                {day.metaLine && <div className={styles.metaLine}>{day.metaLine}</div>}
              </div>
              <div className={styles.body}>
                {day.eyebrow && <div className={styles.eyebrow}>{day.eyebrow}</div>}
                {day.heading && <h3>{day.heading}</h3>}
                {day.description && <p className={styles.description}>{day.description}</p>}
                {day.highlightTags?.length ? (
                  <div className={styles.tags}>
                    {day.highlightTags.map((t, j) => (
                      <span key={j} className={styles.tag}>{t.text}</span>
                    ))}
                  </div>
                ) : null}
                {day.schedule?.length ? (
                  <table className={styles.schedule}>
                    <tbody>
                      {day.schedule.map((row, j) => (
                        <tr key={j}>
                          <th>{row.time}</th>
                          <td>{row.activity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
```

- [ ] Implement + module CSS → commit `feat: add DayByDayItinerary section`

---

## Task 6 — EventAccommodationLogistics + PartnerBlock + CoachesMinimal + EventFinalCTA

Four related Event-specific components.

**EventAccommodationLogistics** — like Plan 2's AccommodationLogistics but Event-shape (`cuisineHighlights` extra, no `foodBeverages` separate field — Event has only `included` / `notIncluded` / `cuisineHighlights`).

**PartnerBlock** — gear-demo / partner panel. Pulls partner relation + per-event copy (eyebrow, headline, description, benefits).

**CoachesMinimal** — guides photos + name + (Guides has no separate role field; render relation type label or just name); + team-wide bullets + framing paragraph.

**EventFinalCTA** — final CTA band with one-line summary derived from event title + earliest date if available.

```tsx
// EventFinalCTA.tsx
import type { Event, EventDate } from '@/payload-types'
import styles from './EventFinalCTA.module.css'

export function EventFinalCTA({ event, firstDate }: { event: Event; firstDate?: EventDate }) {
  const summary = firstDate
    ? `${event.title} · ${firstDate.currency} ${firstDate.price.toLocaleString()}`
    : event.title
  return (
    <section className={styles.band}>
      <h2>Ready to ride?</h2>
      <p>{summary}</p>
      <div className={styles.buttons}>
        <a href="#dates" className={styles.primary}>JOIN US →</a>
        <a href="/contact" className={styles.secondary}>ASK A QUESTION</a>
      </div>
    </section>
  )
}
```

(Full component code for the other three is inline in the implementation step — same shape as the salzburg-safari wireframe blocks.)

- [ ] Implement all four → commit `feat: add Event accommodation, partner, coaches, final CTA sections`

---

## Task 7 — Wire the page together

Fetch parallel: event by slug, faqs, reviews, eventDates. Compose 16 sections in order.

- [ ] Wire → tsc check → `pnpm build` → commit `feat: assemble Trip Detail page with all 16 sections`

---

## Task 8 — Playwright smoke

Two scenarios: published Event renders + draft Event 404s. Same shape as `programs.e2e.spec.ts`.

- [ ] Test → commit `test: add Trip Detail page smoke tests`

---

## Self-review

- **Spec coverage**: 14 wireframe sections + the implicit Prerequisites/Equipment split + EventFinalCTA = 16 rendered sections on detail page.
- **Reuse vs new**: 7 components reused without changes from Plan 2, 9 new components specific to Events.
- **Why duplicate AccommodationLogistics, CoachesRich/Minimal, FinalCTA**: Event-shape differs in small ways (cuisineHighlights, minimal coach card, summary line). Tiny duplication preferred over refactoring Plan 2 components and risking conflict with parallel design-system work.
- **Worktree isolation**: this branch's working tree is in `v3-trip-detail/`. The parallel design-system Claude works in `v3/`. After both land, merge via standard git workflow.
- **Deferred**: tabbed Day-by-Day variant (currently rendered sequentially), `coachCardShape` enum on schema (currently implicit via which component the route uses).
