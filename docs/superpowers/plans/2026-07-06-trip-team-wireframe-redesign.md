# Trip Detail + Team Pages Wireframe Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/trips/[slug]`, `/team`, and `/team/[slug]` to the copywriter wireframes by restyling existing Payload-backed section components in place, adding only two Guides fields (`tagline`, `tags`).

**Architecture:** Approach A from the spec — restyle existing section components (dark sections, Bebas Neue display type, `--rb-*` tokens already global since the homepage). New components only where nothing exists: seven static/team components under `src/components/marketing/team/`, one `GuideHero`. `/programs/[slug]` intentionally inherits restyles of its seven shared components. Zero Events schema changes.

**Tech Stack:** Next.js 16 (App Router) · Payload 3.84 · React 19.2 · CSS Modules · Vitest (int, `.env.test` DB) · Playwright (e2e, dev DB).

**Reference docs:**
- Spec: `docs/superpowers/specs/2026-07-06-trip-team-wireframe-redesign-design.md`
- Trip wireframe: `docs/html/TRIP-COURSE/rockbusters_trip_landing_page.html` — per-block versions in `docs/html/TRIP-COURSE/Rockbusters trip landing page 10 BLOCKS/block_NN_*.html` (open these in a browser; images/fonts are in `docs/html/assets/`)
- Team wireframe: `docs/html/TEAM/rockbusters_community_guides_coaches.html`
- Design-system precedent: homepage components in `src/components/marketing/homepage/` and `docs/superpowers/plans/2026-06-25-homepage.md`

**Wireframe → block map (trip page):** 1 hero · 2 intro · 3 audience personas · 4 three pillars · 5 typical day (+"Which Format?" — SKIPPED by decision) · 6 destination · 7 coaches · 8 reviews + "Everything Sorted" · 9 FAQ · 10 final CTA.

**Conventions used below (from the homepage build):**
- Global helper classes exist in `src/app/(frontend)/styles.css`: `.section-title`, `.section-label`, `.eyebrow`, `.btn-primary`, `.btn-ghost`, `.reveal`.
- Tokens: `--rb-red`, `--rb-red-hover`, `--rb-black`, `--rb-dark`, `--rb-white`, `--rb-white-60/45/30/12/08`, `--rb-section-pad`, `--fs-*`.
- Every section component: server component, presentational, data via props; CSS Module next to it.
- `pnpm typecheck` = TS check · `pnpm test:int` = Vitest · `pnpm test:e2e` = Playwright (needs `pnpm dev` running or webServer config — check `playwright.config.ts` before first run).

---

## File structure

### To CREATE

- `src/components/marketing/team/TeamHero.tsx` + `.module.css`
- `src/components/marketing/team/BornOnTheRock.tsx` + `.module.css`
- `src/components/marketing/team/ValuePillars.tsx` + `.module.css`
- `src/components/marketing/team/GuidesGrid.tsx` + `.module.css`
- `src/components/marketing/team/StatsStrip.tsx` + `.module.css`
- `src/components/marketing/team/UpcomingTrips.tsx` + `.module.css`
- `src/components/marketing/team/FindYourTrip.tsx` + `.module.css`
- `src/components/marketing/team/TeamFinalCTA.tsx` + `.module.css`
- `src/components/marketing/team/GuideHero.tsx` + `.module.css`
- `src/components/sections/InlineFAQ.tsx` + `.module.css`
- One Payload migration (auto-generated — **never hand-written**, see Task 1)

### To MODIFY

- `src/collections/Guides.ts` (add `tagline` + `tags`)
- `src/lib/queries.ts` (`getPublishedEventsForGuide` depth 0 → 1)
- `src/app/(frontend)/team/page.tsx` (full rewrite — community landing composer)
- `src/app/(frontend)/team/team.module.css` (mostly replaced)
- `src/app/(frontend)/team/[slug]/page.tsx` (full rewrite — magazine hero)
- `src/app/(frontend)/trips/[slug]/page.tsx` (recompose order; drop HowToBook/WhyRockbusters; add LocationBlock + InlineFAQ)
- Restyle in place: `DetailHero`, `SectionIntro`, `TripPitchBlock`, `WhatYouLearn`, `AudienceCards`, `DayByDayItinerary`, `AccommodationLogistics`, `EssentialEquipment`, `LocationBlock`, `CoachesMinimal`, `ReviewsRow` (all in `src/components/sections/`, each with its `.module.css`)
- `tests/int/guides.int.spec.ts` (tagline/tags roundtrip)
- `tests/e2e/team-pages.spec.ts`, `tests/e2e/trips.e2e.spec.ts`, `tests/e2e/trip-detail-visual.spec.ts` (+ snapshot regen), `tests/e2e/trip-detail-hero.spec.ts`, `tests/e2e/programs.e2e.spec.ts` (assertions only if broken)

---

## Phase 1 — Guides schema

### Task 1: Add `tagline` + `tags` to Guides

**Files:**
- Modify: `src/collections/Guides.ts`
- Modify: `tests/int/guides.int.spec.ts`
- Create: migration via generator

- [ ] **Step 1: Write the failing int test**

Append to the existing describe block in `tests/int/guides.int.spec.ts` (match the file's existing create-fixture style — it already creates guides; reuse its payload instance/helpers):

```ts
it('stores tagline and tags', async () => {
  const guide = await payload.create({
    collection: 'guides',
    data: {
      name: `Tagline Guide ${Date.now()}`,
      section: 'team',
      tagline: 'Former World Cup champion.',
      tags: [{ text: 'Sport 9b' }, { text: 'Basque' }],
    },
  })
  expect(guide.tagline).toBe('Former World Cup champion.')
  expect(guide.tags?.map((t) => t.text)).toEqual(['Sport 9b', 'Basque'])
})
```

- [ ] **Step 2: Run it — must fail** (unknown field)

Run: `pnpm test:int guides`
Expected: FAIL — `tagline` is not a valid field / type error.

- [ ] **Step 3: Add the fields to `src/collections/Guides.ts`**

After the `role` field (line ~17), insert:

```ts
{
  name: 'tagline',
  type: 'textarea',
  admin: { description: 'Punchy one-liner shown on team cards and the profile hero.' },
},
{
  name: 'tags',
  type: 'array',
  admin: { description: 'Short badges, ~3 max. e.g. "Sport 9b", "Basque", "UIAGM".' },
  fields: [{ name: 'text', type: 'text', required: true }],
},
```

- [ ] **Step 4: Generate migration + types — NEVER hand-write the migration**

```bash
pnpm payload migrate:create add-guide-tagline-tags
pnpm payload migrate
pnpm generate:types
```

Expected: a new `src/migrations/*_add_guide_tagline_tags.ts` **plus its `.json` snapshot**. If `payload migrate` silently no-ops, check for the stale dev-marker row (`payload_migrations` row `name='dev' batch=-1` — known trap, see CLAUDE.md memory) and delete that row first.

- [ ] **Step 5: Re-run the test — must pass**

Run: `pnpm test:int guides`
Expected: PASS.

- [ ] **Step 6: Typecheck + commit**

```bash
pnpm typecheck
git add src/collections/Guides.ts src/migrations src/payload-types.ts tests/int/guides.int.spec.ts
git commit -m "feat(guides): tagline + tags fields for team cards"
```

---

## Phase 2 — Team list page `/team`

Open `docs/html/TEAM/rockbusters_community_guides_coaches.html` in a browser side-by-side while building. **Copy all headline/body text verbatim from the wireframe** — the copywriter's text is the deliverable; do not paraphrase. To dump any section's text into the terminal, run (adjust the anchor string):

```bash
python3 -c "
import re
html = open('docs/html/TEAM/rockbusters_community_guides_coaches.html').read()
i = html.find('ANCHOR TEXT')            # e.g. 'BORN ON', 'GUIDES &', 'FIND YOUR'
seg = re.sub(r'<[^>]+>', ' ', html[i-200:i+4000])
print(re.sub(r'\s+', ' ', seg))
"
```

### Task 2: Static sections — TeamHero, BornOnTheRock, ValuePillars

**Files:**
- Create: `src/components/marketing/team/TeamHero.tsx` + `TeamHero.module.css`
- Create: `src/components/marketing/team/BornOnTheRock.tsx` + `BornOnTheRock.module.css`
- Create: `src/components/marketing/team/ValuePillars.tsx` + `ValuePillars.module.css`

- [ ] **Step 1: TeamHero**

Wireframe: hero section at top of file (h1 `YOUR ROCK. YOUR LIMIT. BROKEN.`; grep `team-hero` or the h1 text for the markup + the exact sub-line and CTA labels).

```tsx
import styles from './TeamHero.module.css'

export function TeamHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <p className="eyebrow">{/* exact eyebrow text from wireframe */}</p>
        <h1 className={styles.title}>
          Your rock.
          <br />
          Your limit.
          <br />
          <span className={styles.red}>Broken.</span>
        </h1>
        {/* sub-line + primary CTA (btn-primary) exactly as in wireframe */}
      </div>
    </section>
  )
}
```

```css
.hero {
  background: var(--rb-black);
  padding: 140px 5% 90px;
  position: relative;
  overflow: hidden;
}
.inner { max-width: 1200px; margin: 0 auto; }
.title {
  font-family: 'Bebas Neue', sans-serif;
  font-weight: 400;
  font-size: clamp(64px, 11vw, 160px);
  line-height: 0.88;
  color: var(--rb-white);
  text-transform: uppercase;
}
.red { color: var(--rb-red); }
```

If the wireframe hero uses a background photo from `docs/html/assets/`, reproduce it with a dark gradient overlay (`linear-gradient(rgba(13,13,13,.55), var(--rb-black))`) over an `<Image fill>` of a media asset — but only if the wireframe does; otherwise keep it typographic.

- [ ] **Step 2: BornOnTheRock**

Wireframe: `BORN ON THE ROCK` section (grep the h2). Two-column: section-label + big title left, body copy right. All text verbatim.

```tsx
import styles from './BornOnTheRock.module.css'

export function BornOnTheRock() {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        <div>
          <p className="section-label">{/* label from wireframe */}</p>
          <h2 className="section-title">
            Born on
            <br />
            the rock
          </h2>
        </div>
        <div className={styles.body}>
          <p>
            Rockbusters was born from a simple conviction: the best teachers are the ones
            still climbing hard. Founded by Jany — a climber, adventurer, and relentless
            connector of people — the community grew organically from cramped belays and
            shared rope bags into something the climbing world had never quite seen before.
          </p>
          <p>
            Jany&rsquo;s vision wasn&rsquo;t a climbing school. It was a living ecosystem —
            bringing together elite athletes who perform at the highest level with guests
            who want the real thing. No corporate packages. Just genuine progression in
            beautiful places with people who have dedicated their lives to the vertical
            world.
          </p>
          {/* founder quote card — verbatim from wireframe ("The best route is the one that
              changes how you see yourself…" — Jany, Founder); check the wireframe for the
              full quote text and its card styling */}
        </div>
      </div>
    </section>
  )
}
```

```css
.section { background: var(--rb-dark); padding: var(--rb-section-pad); }
.grid {
  max-width: 1200px; margin: 0 auto;
  display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start;
}
.body { color: var(--rb-white-60); font-size: var(--fs-body-lg); line-height: 1.75; display: grid; gap: 20px; }
@media (max-width: 860px) { .grid { grid-template-columns: 1fr; gap: 32px; } }
```

- [ ] **Step 3: ValuePillars**

Wireframe: six `pillar` items (`pillar-num`, `pillar-title`, `pillar-body` classes). Titles: "Elite athletes as your actual guide" / "UIAGM safety on every trip" / "Small groups, real progress" / "Insider crag knowledge" / "Tailored to your level" / "Community, not just a course". Bodies verbatim from wireframe.

```tsx
import styles from './ValuePillars.module.css'

// Bodies: extract verbatim with the python3 snippet above (anchor: 'Elite athletes').
const PILLARS: { title: string; body: string }[] = [
  { title: 'Elite athletes as your actual guide', body: '<verbatim from wireframe>' },
  { title: 'UIAGM safety on every trip', body: '<verbatim from wireframe>' },
  { title: 'Small groups, real progress', body: '<verbatim from wireframe>' },
  { title: 'Insider crag knowledge', body: '<verbatim from wireframe>' },
  { title: 'Tailored to your level', body: '<verbatim from wireframe>' },
  { title: 'Community, not just a course', body: '<verbatim from wireframe>' },
]

export function ValuePillars() {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {PILLARS.map((p, i) => (
          <div key={p.title} className={`${styles.pillar} reveal`}>
            <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
            <h4 className={styles.title}>{p.title}</h4>
            <p className={styles.body}>{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

```css
.section { background: var(--rb-black); padding: var(--rb-section-pad); }
.grid {
  max-width: 1200px; margin: 0 auto;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
  background: var(--rb-white-12);
  border: 1px solid var(--rb-white-12);
}
.pillar { background: var(--rb-black); padding: var(--rb-card-pad); }
.num { font-family: 'Bebas Neue', sans-serif; font-size: 15px; color: var(--rb-red); }
.title { color: var(--rb-white); font-size: var(--fs-card-title); font-weight: 700; margin: 12px 0 8px; }
.body { color: var(--rb-white-45); font-size: var(--fs-body-sm); line-height: 1.65; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/marketing/team
git commit -m "feat(team): TeamHero + BornOnTheRock + ValuePillars statics"
```

### Task 3: GuidesGrid

**Files:**
- Create: `src/components/marketing/team/GuidesGrid.tsx` + `GuidesGrid.module.css`

Wireframe: `GUIDES & COACHES` section — 6 `team-card`s with `team-photo`, `team-gradient`, `team-name`, `team-tag-row` (`tag` chips), `team-tagline`, `team-link`.

- [ ] **Step 1: Component**

```tsx
import Link from 'next/link'
import Image from 'next/image'
import type { Guide } from '@/payload-types'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from './GuidesGrid.module.css'

type GuidesGridProps = {
  guides: Guide[]
  heading: string
  label?: string
  compact?: boolean // Friends & Ambassadors variant
}

export function GuidesGrid({ guides, heading, label, compact = false }: GuidesGridProps) {
  if (guides.length === 0) return null
  return (
    <section className={styles.section} id={compact ? undefined : 'guides'}>
      <div className={styles.inner}>
        {label ? <p className="section-label">{label}</p> : null}
        <h2 className="section-title">{heading}</h2>
        <div className={`${styles.grid} ${compact ? styles.gridCompact : ''}`}>
          {guides.map((g) => {
            const url = mediaUrl(g.photo)
            return (
              <Link key={g.id} href={`/team/${g.slug}`} className={`${styles.card} reveal`}>
                <div className={styles.photoWrap}>
                  {url ? (
                    <Image
                      src={url}
                      alt={mediaAlt(g.photo)}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className={styles.photo}
                    />
                  ) : (
                    <span className={styles.photoPlaceholder} aria-hidden="true" />
                  )}
                  <div className={styles.gradient} aria-hidden="true" />
                  <div className={styles.overlay}>
                    <h3 className={styles.name}>{g.name}</h3>
                    {g.role ? <p className={styles.role}>{g.role}</p> : null}
                  </div>
                </div>
                {!compact && (g.tags?.length || g.tagline) ? (
                  <div className={styles.meta}>
                    {g.tags?.length ? (
                      <div className={styles.tagRow}>
                        {g.tags.map((t) => (
                          <span key={t.id ?? t.text} className={styles.tag}>
                            {t.text}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {g.tagline ? <p className={styles.tagline}>{g.tagline}</p> : null}
                  </div>
                ) : null}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: CSS**

```css
.section { background: var(--rb-dark); padding: var(--rb-section-pad); }
.inner { max-width: 1200px; margin: 0 auto; }
.grid {
  margin-top: 48px;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px;
}
.gridCompact { grid-template-columns: repeat(4, 1fr); gap: 20px; }
.card { text-decoration: none; display: block; }
.photoWrap { position: relative; aspect-ratio: 3 / 4; overflow: hidden; background: var(--rb-black); }
.photo { object-fit: cover; transition: transform 0.4s ease; }
.card:hover .photo { transform: scale(1.04); }
.photoPlaceholder { position: absolute; inset: 0; background: var(--rb-white-08); }
.gradient {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(13, 13, 13, 0.92) 0%, transparent 55%);
}
.overlay { position: absolute; left: 20px; right: 20px; bottom: 18px; }
.name {
  font-family: 'Bebas Neue', sans-serif; font-weight: 400;
  font-size: 30px; line-height: 0.95; color: var(--rb-white); text-transform: uppercase;
}
.role { font-size: var(--fs-eyebrow); letter-spacing: 0.14em; text-transform: uppercase; color: var(--rb-red); margin-top: 6px; font-weight: 700; }
.meta { padding: 14px 2px 0; }
.tagRow { display: flex; flex-wrap: wrap; gap: 6px; }
.tag {
  font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;
  color: var(--rb-red); border: 1px solid var(--rb-red-border); padding: 3px 8px;
}
.tagline { color: var(--rb-white-45); font-size: var(--fs-body-sm); line-height: 1.6; margin-top: 10px; }
@media (max-width: 900px) { .grid, .gridCompact { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .grid, .gridCompact { grid-template-columns: 1fr; } }
```

Match against the wireframe card and adjust spacing/font sizes to it before committing.

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/marketing/team/GuidesGrid.tsx src/components/marketing/team/GuidesGrid.module.css
git commit -m "feat(team): GuidesGrid cards with tags + tagline"
```

### Task 4: StatsStrip, FindYourTrip, TeamFinalCTA

**Files:**
- Create: `src/components/marketing/team/StatsStrip.tsx` + `.module.css`
- Create: `src/components/marketing/team/FindYourTrip.tsx` + `.module.css`
- Create: `src/components/marketing/team/TeamFinalCTA.tsx` + `.module.css`

- [ ] **Step 1: StatsStrip**

Wireframe: `THE ROCK DOESN'T LIE` — "18 elite guides and coaches. 40+ destinations. One community built on genuine passion for the vertical world." + "View All Coaches & Guides →" (anchor to `#guides`). Hardcode the copy; reuse homepage `StatsBar`'s layout idiom (dark strip, Bebas numbers). Check `src/components/marketing/homepage/StatsBar.tsx` and mirror its structure with this section's text.

- [ ] **Step 2: FindYourTrip**

Wireframe: `FIND YOUR COURSE OR TRIP` — six `filter-group`s with `filter-label`s. Implement as **pure link groups** (no client-side filtering): each group is a label + link list into existing routes (`/programs/<slug>`, `/destinations`, `/calendar`). Use the same 8 program slugs the homepage PickYourExperience uses (see `src/components/marketing/homepage/PickYourExperience.tsx`) for the trip-type group; destination/date groups link to `/destinations` and `/calendar`. Copy group labels verbatim from the wireframe.

```tsx
import Link from 'next/link'
import styles from './FindYourTrip.module.css'

type Group = { label: string; links: { label: string; href: string }[] }

const GROUPS: Group[] = [
  /* six groups; labels verbatim from wireframe; hrefs into /programs, /destinations, /calendar */
]

export function FindYourTrip() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className="section-title">{/* verbatim heading */}</h2>
        <div className={styles.groups}>
          {GROUPS.map((g) => (
            <div key={g.label} className={styles.group}>
              <p className={styles.label}>{g.label}</p>
              <ul className={styles.list}>
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={styles.link}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

CSS: dark section, groups in a responsive grid (`repeat(3, 1fr)`, collapsing to 1 col), `.label` uses `.section-label` styling, links `--rb-white-60` → white on hover.

- [ ] **Step 3: TeamFinalCTA**

Wireframe: `YOUR NEXT ROUTE STARTS HERE` final section. Mirror homepage `FinalCTA.tsx` structure with this section's verbatim copy; primary CTA `btn-primary` → `/calendar`, ghost CTA → `/programs` (match wireframe button labels).

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/marketing/team
git commit -m "feat(team): StatsStrip + FindYourTrip + TeamFinalCTA"
```

### Task 5: UpcomingTrips feed

**Files:**
- Create: `src/components/marketing/team/UpcomingTrips.tsx` + `UpcomingTrips.module.css`

Wireframe: `TRIPS & COURSES` — five `trip-card trip-card-photo` rows: date range, title, destination, "Led by {guide}", grade span, "N spots left", "From €X". All of this exists on `EventDate` (depth-2 docs from `getActiveEventDates()`: embedded `event` + `locations` + `guides`, plus computed `remainingSeats`, `price`, `currency`).

- [ ] **Step 1: Component**

```tsx
import Link from 'next/link'
import Image from 'next/image'
import type { Event, EventDate, Guide, Location, Media } from '@/payload-types'
import styles from './UpcomingTrips.module.css'

type UpcomingTripsProps = { dates: EventDate[] }

function fmtRange(from: string, to: string): string {
  const f = new Date(from)
  const t = new Date(to)
  return `${f.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${t.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function firstGuideName(d: EventDate): string | null {
  const g = d.guides?.[0]
  return g && typeof g === 'object' ? (g as Guide).name : null
}

function locationName(d: EventDate): string | null {
  const l = d.locations?.[0]
  return l && typeof l === 'object' ? (l as Location).name : null
}

export function UpcomingTrips({ dates }: UpcomingTripsProps) {
  const now = new Date().toISOString()
  const upcoming = dates
    .filter((d) => d.dateFrom >= now && typeof d.event === 'object')
    .slice(0, 5)
  if (upcoming.length === 0) return null

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <div>
            <p className="section-label">Upcoming</p>
            <h2 className="section-title">Trips &amp; courses</h2>
          </div>
          <Link href="/calendar" className="btn-ghost">
            All upcoming trips →
          </Link>
        </div>
        <div className={styles.list}>
          {upcoming.map((d) => {
            const ev = d.event as Event
            const photo =
              ev.mainPicture && typeof ev.mainPicture === 'object'
                ? ((ev.mainPicture as Media).url ?? null)
                : null
            const led = firstGuideName(d)
            const spots = typeof d.remainingSeats === 'number' ? d.remainingSeats : null
            return (
              <Link key={d.id} href={`/trips/${ev.slug}`} className={`${styles.card} reveal`}>
                {photo && (
                  <Image src={photo} alt="" fill sizes="100vw" className={styles.bg} />
                )}
                <div className={styles.scrim} aria-hidden="true" />
                <div className={styles.content}>
                  <span className={styles.date}>{fmtRange(d.dateFrom, d.dateTo)}</span>
                  <h3 className={styles.title}>{ev.title}</h3>
                  <div className={styles.metaRow}>
                    {locationName(d) && <span>{locationName(d)}</span>}
                    {led && <span>Led by {led}</span>}
                    {spots !== null && spots > 0 && <span>{spots} spots left</span>}
                  </div>
                </div>
                <div className={styles.price}>
                  From {d.currency === 'EUR' ? '€' : d.currency}
                  {d.price}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

Check the wireframe card before finalising: it also shows a grade span (e.g. "6b – 8b+") — that lives on the **event's** difficulties relation; render it only if `ev.difficulties` is populated at this depth, otherwise omit (do not add a query for it).

Note: `d.currency` — check the `currency` select options in `src/collections/EventDates.ts` and map symbols accordingly (the collection defines the enum; EUR/CZK expected).

- [ ] **Step 2: CSS**

Horizontal photo-card rows: `position: relative`, `min-height: 140px`, background image + left-to-right scrim (`linear-gradient(90deg, rgba(13,13,13,.92) 30%, rgba(13,13,13,.35))`), content left, price pinned right (`font-family: 'Bebas Neue'`, red). Section background `var(--rb-black)`, `.head` = flex row with the ghost button right. Collapse to stacked layout under 700px.

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/marketing/team/UpcomingTrips.tsx src/components/marketing/team/UpcomingTrips.module.css
git commit -m "feat(team): UpcomingTrips event-date feed cards"
```

### Task 6: Compose the new `/team` page

**Files:**
- Modify: `src/app/(frontend)/team/page.tsx` (full rewrite)
- Modify: `src/app/(frontend)/team/team.module.css` (delete rules the new page no longer uses; keep ones `[slug]` still imports until Task 8 replaces that page)

- [ ] **Step 1: Rewrite the page composer**

```tsx
import { getActiveGuides, getActiveEventDates, getHomepageReviews } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { TeamHero } from '@/components/marketing/team/TeamHero'
import { BornOnTheRock } from '@/components/marketing/team/BornOnTheRock'
import { ValuePillars } from '@/components/marketing/team/ValuePillars'
import { GuidesGrid } from '@/components/marketing/team/GuidesGrid'
import { StatsStrip } from '@/components/marketing/team/StatsStrip'
import { UpcomingTrips } from '@/components/marketing/team/UpcomingTrips'
import { FindYourTrip } from '@/components/marketing/team/FindYourTrip'
import { TeamFinalCTA } from '@/components/marketing/team/TeamFinalCTA'
import { Testimonials } from '@/components/marketing/homepage/Testimonials'
import type { Guide } from '@/payload-types'

export const metadata = {
  title: 'Guides & Coaches — Rockbusters',
  description: 'Elite climbers and UIAGM guides leading every Rockbusters trip.',
}

function byFeaturedThenName(a: Guide, b: Guide) {
  return (
    Number(b.featured ?? false) - Number(a.featured ?? false) || a.name.localeCompare(b.name)
  )
}

export default async function TeamPage() {
  const [docs, dates, reviews] = await Promise.all([
    getActiveGuides(),
    getActiveEventDates(),
    getHomepageReviews(),
  ])
  const team = docs.filter((g) => g.section !== 'friends').sort(byFeaturedThenName)
  const friends = docs.filter((g) => g.section === 'friends').sort(byFeaturedThenName)

  return (
    <MarketingShell transparentHeader>
      <main>
        <TeamHero />
        <BornOnTheRock />
        <ValuePillars />
        <GuidesGrid guides={team} label="The crew" heading="Guides & coaches" />
        <StatsStrip />
        <UpcomingTrips dates={dates} />
        <FindYourTrip />
        {friends.length ? (
          <GuidesGrid guides={friends} heading="Friends & ambassadors" compact />
        ) : null}
        <Testimonials reviews={reviews} />
        <TeamFinalCTA />
      </main>
    </MarketingShell>
  )
}
```

Check `MarketingShell`'s props first — the trips page uses `transparentHeader`; if the shell requires `crumbs`, omit them (landing pages don't show breadcrumbs — match what `/trips/[slug]` does). Check `Testimonials`' props signature and match it.

- [ ] **Step 2: Verify in the browser**

```bash
pnpm dev
```

Open `http://localhost:3000/team`. Compare section-by-section against the wireframe in another tab. Fix spacing/type-scale deviations now. Also confirm guides with empty `tagline`/`tags` render cleanly (no empty meta block).

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add "src/app/(frontend)/team"
git commit -m "feat(team): community landing page replaces team grid"
```

### Task 7: Team page e2e

**Files:**
- Modify: `tests/e2e/team-pages.spec.ts`

- [ ] **Step 1: Read the existing spec** — it asserts the old H1 ("Rockbusters Team") and grid. Rewrite the `/team` assertions:

```ts
test('team landing renders all sections', async ({ page }) => {
  await page.goto('/team')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/broken/i)
  await expect(page.getByRole('heading', { name: /guides & coaches/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /trips & courses/i })).toBeVisible()
})

test('guide card navigates to detail', async ({ page }) => {
  await page.goto('/team')
  const card = page.locator('a[href^="/team/"]').first()
  await card.click()
  await expect(page).toHaveURL(/\/team\/.+/)
})
```

Keep/adapt the spec's existing fixture setup (it creates guides — add `tagline`/`tags` to one fixture guide and assert the tag chip renders).

- [ ] **Step 2: Run**

Run: `pnpm test:e2e team-pages`
Expected: PASS. (E2E hits the dev-branch DB — never point it at production; check `DATABASE_URL` host is NOT `ep-weathered-pine-alvc3sdj`.)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/team-pages.spec.ts
git commit -m "test(e2e): team landing sections + guide card nav"
```

---

## Phase 3 — Team detail `/team/[slug]`

### Task 8: GuideHero + page rewrite

**Files:**
- Create: `src/components/marketing/team/GuideHero.tsx` + `GuideHero.module.css`
- Modify: `src/lib/queries.ts:45-57` (`getPublishedEventsForGuide` depth 0 → 1, add `TAGS.locations`)
- Modify: `src/app/(frontend)/team/[slug]/page.tsx` (full rewrite)

- [ ] **Step 1: Bump the query depth** (trip cards need `mainPicture` + `locations` embedded)

In `src/lib/queries.ts`, change `getPublishedEventsForGuide`:

```ts
export function getPublishedEventsForGuide(guideId: number) {
  return cachedQuery(['events-for-guide', String(guideId)], [TAGS.events, TAGS.locations], async (): Promise<Event[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      where: { and: [{ coaches: { contains: guideId } }, { state: { equals: 'published' } }] },
      limit: 20,
      depth: 1,
    })
    return docs
  })
}
```

The cache key stays the same shape; tag list gains `TAGS.locations` because depth 1 embeds location names.

- [ ] **Step 2: Check the int test for this query**

Run: `pnpm test:int queries`
If `queries.int.spec.ts` asserts on this helper, update expectations (embedded objects instead of ids). Expected: PASS after adjustment.

- [ ] **Step 3: GuideHero component** (magazine hero — option A mockup)

```tsx
import Image from 'next/image'
import type { Guide } from '@/payload-types'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from './GuideHero.module.css'

export function GuideHero({ guide }: { guide: Guide }) {
  const photo = mediaUrl(guide.photo)
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.text}>
          {guide.role ? <p className={styles.eyebrow}>{guide.role}</p> : null}
          <h1 className={styles.name}>{guide.name}</h1>
          {guide.tags?.length ? (
            <div className={styles.tagRow}>
              {guide.tags.map((t) => (
                <span key={t.id ?? t.text} className={styles.tag}>
                  {t.text}
                </span>
              ))}
            </div>
          ) : null}
          {guide.tagline ? <p className={styles.tagline}>{guide.tagline}</p> : null}
        </div>
        {photo ? (
          <div className={styles.photoWrap}>
            <Image
              src={photo}
              alt={mediaAlt(guide.photo)}
              fill
              priority
              sizes="(max-width: 860px) 100vw, 45vw"
              className={styles.photo}
            />
            <div className={styles.fade} aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </section>
  )
}
```

```css
.hero { background: var(--rb-black); position: relative; overflow: hidden; }
.inner {
  max-width: 1200px; margin: 0 auto;
  display: grid; grid-template-columns: 55% 45%;
  min-height: 560px; align-items: center;
  padding: 120px 5% 60px;
}
.eyebrow { font-size: var(--fs-eyebrow); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; color: var(--rb-red); }
.name {
  font-family: 'Bebas Neue', sans-serif; font-weight: 400;
  font-size: clamp(56px, 9vw, 130px); line-height: 0.88;
  color: var(--rb-white); text-transform: uppercase; margin-top: 14px;
}
.tagRow { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 20px; }
.tag {
  font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;
  color: var(--rb-red); border: 1px solid var(--rb-red-border); padding: 4px 10px;
}
.tagline { color: var(--rb-white-60); font-size: var(--fs-body-lg); line-height: 1.7; margin-top: 22px; max-width: 46ch; }
.photoWrap { position: absolute; right: 0; top: 0; bottom: 0; width: 45%; }
.photo { object-fit: cover; }
.fade { position: absolute; inset: 0; background: linear-gradient(90deg, var(--rb-black) 0%, transparent 40%); }
@media (max-width: 860px) {
  .inner { grid-template-columns: 1fr; padding-top: 96px; }
  .photoWrap { position: relative; width: 100%; aspect-ratio: 3 / 4; margin-top: 32px; }
  .fade { background: none; }
}
```

- [ ] **Step 4: Rewrite the detail page**

`src/app/(frontend)/team/[slug]/page.tsx`:

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGuideBySlug, getPublishedEventsForGuide } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { GuideHero } from '@/components/marketing/team/GuideHero'
import { Lexical } from '@/lib/lexical'
import { mediaUrl } from '@/lib/media'
import Image from 'next/image'
import styles from './guide.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)
  return { title: `${guide?.name ?? 'Guide'} — Rockbusters Team` }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)
  if (!guide) notFound()

  // email/phone are intentionally never rendered (team-pages spec).
  const events = await getPublishedEventsForGuide(guide.id)

  return (
    <MarketingShell transparentHeader>
      <main className={styles.page}>
        <GuideHero guide={guide} />

        {guide.content ? (
          <section className={styles.bio}>
            <Lexical data={guide.content} />
          </section>
        ) : null}

        {guide.vimeoId ? (
          <section className={styles.video}>
            <iframe
              src={`https://player.vimeo.com/video/${guide.vimeoId}`}
              title={`${guide.name} — video`}
              allow="fullscreen; picture-in-picture"
              allowFullScreen
            />
          </section>
        ) : null}

        <section className={styles.trips}>
          <h2 className="section-title">Trips with {guide.name}</h2>
          {events.length ? (
            <div className={styles.tripGrid}>
              {events.map((e) => {
                const bg = mediaUrl(e.mainPicture)
                return (
                  <Link key={e.id} href={`/trips/${e.slug}`} className={styles.tripCard}>
                    {bg && <Image src={bg} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className={styles.tripBg} />}
                    <div className={styles.tripScrim} aria-hidden="true" />
                    <h3 className={styles.tripTitle}>{e.title}</h3>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className={styles.empty}>
              {guide.name} joins selected camps throughout the season — see the calendar for dates.
            </p>
          )}
        </section>

        <section className={styles.cta}>
          <h2 className="section-title">Climb with {guide.name.split(' ')[0]}</h2>
          <Link href="/calendar" className="btn-primary">
            Find your trip
          </Link>
        </section>
      </main>
    </MarketingShell>
  )
}
```

Create `src/app/(frontend)/team/[slug]/guide.module.css` (page stops importing `../team.module.css`):

```css
.page { background: var(--rb-black); }
.bio {
  max-width: 760px; margin: 0 auto; padding: 80px 5%;
  color: var(--rb-white-60); font-size: var(--fs-body-lg); line-height: 1.8;
}
.video { max-width: 960px; margin: 0 auto; padding: 0 5% 80px; }
.video iframe { width: 100%; aspect-ratio: 16 / 9; border: 0; }
.trips { max-width: 1200px; margin: 0 auto; padding: 0 5% 80px; }
.tripGrid { margin-top: 40px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.tripCard {
  position: relative; min-height: 200px; display: flex; align-items: flex-end;
  padding: 24px; text-decoration: none; overflow: hidden; background: var(--rb-dark);
}
.tripBg { object-fit: cover; }
.tripScrim { position: absolute; inset: 0; background: linear-gradient(to top, rgba(13,13,13,.9), transparent 60%); }
.tripTitle {
  position: relative; font-family: 'Bebas Neue', sans-serif; font-weight: 400;
  font-size: 32px; color: var(--rb-white); text-transform: uppercase; line-height: 0.95;
}
.empty { color: var(--rb-white-45); margin-top: 24px; }
.cta { text-align: center; padding: 40px 5% 110px; display: grid; gap: 28px; justify-items: center; }
@media (max-width: 700px) { .tripGrid { grid-template-columns: 1fr; } }
```

Check `Lexical`'s rendering styles on dark background — if the richText renderer emits unstyled dark text, scope a `.bio :global(p)` color override.

- [ ] **Step 5: Verify in browser** — `http://localhost:3000/team/<existing-guide-slug>` (pick one from `/team`). Check: hero, bio contrast, video (guide with `vimeoId`), trips grid, empty state (guide with no events), metadata title in the tab.

- [ ] **Step 6: Typecheck + commit**

```bash
pnpm typecheck
git add src/lib/queries.ts src/components/marketing/team/GuideHero.tsx src/components/marketing/team/GuideHero.module.css "src/app/(frontend)/team/[slug]"
git commit -m "feat(team): magazine-hero guide detail page"
```

- [ ] **Step 7: Clean up `team.module.css`** — nothing imports it now; delete the file if `grep -r "team.module.css" src` confirms zero imports, and commit as `chore(team): drop obsolete team.module.css`.

### Task 9: Team detail e2e

**Files:**
- Modify: `tests/e2e/team-pages.spec.ts`

- [ ] **Step 1: Update the `/team/[slug]` assertions** — the old test expects the profile layout. Rewrite:

```ts
test('guide detail renders hero + trips section', async ({ page }) => {
  await page.goto(`/team/${fixtureGuideSlug}`)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(fixtureGuideName, { ignoreCase: true })
  await expect(page.getByRole('heading', { name: /trips with/i })).toBeVisible()
})

test('guide contact details never render', async ({ page }) => {
  await page.goto(`/team/${fixtureGuideSlug}`)
  const html = await page.content()
  expect(html).not.toContain(fixtureGuideEmail)
})
```

Keep the existing contact-leak assertion if the spec already has one (it should — it's a spec requirement).

- [ ] **Step 2: Run** — `pnpm test:e2e team-pages` → PASS.

- [ ] **Step 3: Commit** — `git add tests/e2e/team-pages.spec.ts && git commit -m "test(e2e): guide detail magazine hero"`

---

## Phase 4 — Trip detail `/trips/[slug]`

Work with the per-block wireframes open in the browser (`docs/html/TRIP-COURSE/Rockbusters trip landing page 10 BLOCKS/`). Each restyle task = open the block, restyle the component's CSS Module (and markup only where structure differs), verify on a real trip at `http://localhost:3000/trips/<slug>`, commit. **After every task in this phase that touches a shared component, also load `/programs/<any-slug>` and eyeball it.**

### Task 10: DetailHero + intro restyle (blocks 1–2)

**Files:**
- Modify: `src/components/sections/DetailHero.tsx` + `DetailHero.module.css`
- Modify: `src/components/sections/SectionIntro.tsx` + `SectionIntro.module.css`
- Modify: `src/components/sections/TripPitchBlock.tsx` + `TripPitchBlock.module.css`

- [ ] **Step 1: Read block 1 (`block_01_block_1.html`) + current `DetailHero`.** Restyle to: full-bleed dark hero, oversized Bebas title (`clamp(56px, 10vw, 150px)`, line-height 0.88), red eyebrow line, scrim `linear-gradient(rgba(13,13,13,.5), var(--rb-black))` over `mainPicture`. Keep the component's props/data contract unchanged.
- [ ] **Step 2: Read block 2 + current `SectionIntro`/`TripPitchBlock`.** Restyle: `.section-title` headings, `--rb-dark` background, body copy `--rb-white-60` at `--fs-body-lg`, two-column pitch layout per wireframe.
- [ ] **Step 3: Verify** on a real trip page; compare against blocks 1–2 side-by-side.
- [ ] **Step 4: Typecheck + commit** — `git commit -m "feat(trip): hero + intro restyle to wireframe blocks 1-2"`

### Task 11: AudienceCards + WhatYouLearn restyle (blocks 3–4)

**Files:**
- Modify: `src/components/sections/AudienceCards.tsx` + `.module.css` (**shared with /programs**)
- Modify: `src/components/sections/WhatYouLearn.tsx` + `.module.css`

- [ ] **Step 1: Block 3 → AudienceCards.** Three persona cards ("The Plateaued Climber" etc. in the wireframe's demo copy — real copy comes from `Events.audienceCards`). Restyle: dark cards on `--rb-black` section, numbered like ValuePillars, `highlighted` card gets `--rb-red` border. Props unchanged.
- [ ] **Step 2: Block 4 → WhatYouLearn as "Three Pillars".** The wireframe shows three numbered pillar columns (Technique / Mental Game / Tactics). Current data: `whatYouLearn.intro` + `box1Heading/box1Bullets` + `box2Heading/box2Bullets` — i.e. **two** boxes, wireframe shows three. Do NOT change schema: render intro + the two boxes in the pillar visual style (numbered, Bebas headings, red rules). The copywriter's three-pillar copy fits in two boxes + intro until a third box is requested.
- [ ] **Step 3: Verify** trip page blocks 3–4 AND `/programs/<slug>` (AudienceCards is shared).
- [ ] **Step 4: Typecheck + commit** — `git commit -m "feat(trip): audience cards + pillars restyle to blocks 3-4"`

### Task 12: DayByDayItinerary restyle (block 5, "A Typical Day")

**Files:**
- Modify: `src/components/sections/DayByDayItinerary.tsx` + `.module.css`

- [ ] **Step 1: Read block 5.** The wireframe's "A Typical Day" is an hour-by-hour timeline — current data `itinerary.days[].schedule[]` (`time` + `activity`) covers it. Restyle the schedule rendering into the wireframe's timeline look: time column in red Bebas, activity right, thin `--rb-white-12` rules between rows; day cards keep image + heading. ("Which Format?" in the same block is skipped by decision — do not build it.)
- [ ] **Step 2: Verify + typecheck + commit** — `git commit -m "feat(trip): itinerary typical-day timeline restyle to block 5"`

### Task 13: LocationBlock restyle + move onto main page (block 6)

**Files:**
- Modify: `src/components/sections/LocationBlock.tsx` + `.module.css` (**shared with /programs + /logistics**)

- [ ] **Step 1: Read block 6 ("Rodellar, Spain") + current LocationBlock usage** in `src/app/(frontend)/programs/[slug]/page.tsx` and `src/app/(frontend)/trips/[slug]/logistics/page.tsx` — note its props before touching anything.
- [ ] **Step 2: Restyle** to the wireframe's destination showcase: full-width photo band, location name in `.section-title`, description over scrim. Props unchanged.
- [ ] **Step 3: Verify on `/programs/<slug>` and `/trips/<slug>/logistics`** (its two current consumers render correctly). Main-page wiring happens in Task 16.
- [ ] **Step 4: Typecheck + commit** — `git commit -m "feat(sections): LocationBlock destination showcase restyle to block 6"`

### Task 14: CoachesMinimal + ReviewsRow + "Everything Sorted" (blocks 7–8)

**Files:**
- Modify: `src/components/sections/CoachesMinimal.tsx` + `.module.css`
- Modify: `src/components/sections/ReviewsRow.tsx` + `.module.css` (**shared with /programs**)
- Modify: `src/components/sections/AccommodationLogistics.tsx` + `.module.css`
- Modify: `src/components/sections/EssentialEquipment.tsx` + `.module.css`

- [ ] **Step 1: Block 7 → CoachesMinimal.** Coach cards adopt the GuidesGrid card look (photo, gradient, Bebas name, red role) — copy the CSS patterns from `src/components/marketing/team/GuidesGrid.module.css` rather than importing it (different data shape, keep components independent).
- [ ] **Step 2: Block 8 (top) → ReviewsRow.** Match the wireframe's testimonial style; check homepage `Testimonials.module.css` for the established quote styling and align. Verify `/programs` after.
- [ ] **Step 3: Block 8 (bottom) → "Everything Sorted" 4-card grid.** Restyle `AccommodationLogistics` into the four-card grid (Accommodation / Getting There / Gear / Group Size) with `EssentialEquipment` feeding the Gear card visual language. Data contract unchanged: `accommodation`, `transport` groups + `essentialEquipment` array. If the current components render as separate stacked sections, keep them separate components but style them as one visual band (shared background, continuous grid).
- [ ] **Step 4: Verify + typecheck + commit** — `git commit -m "feat(trip): coaches, reviews, everything-sorted restyle to blocks 7-8"`

### Task 15: InlineFAQ (block 9)

**Files:**
- Create: `src/components/sections/InlineFAQ.tsx` + `InlineFAQ.module.css`

- [ ] **Step 1: Check how `/trips/[slug]/faq/page.tsx` loads FAQs** (per-event FAQs from the `faqs` collection) and reuse the same fetch pattern in the trip page composer (Task 16) — the component itself is presentational:

```tsx
import Link from 'next/link'
import type { FAQ } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './InlineFAQ.module.css'

type InlineFAQProps = { faqs: FAQ[]; slug: string }

export function InlineFAQ({ faqs, slug }: InlineFAQProps) {
  if (faqs.length === 0) return null
  const top = faqs.slice(0, 5)
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className="section-title">Common questions</h2>
        <div className={styles.list}>
          {top.map((f) => (
            <details key={f.id} className={styles.item}>
              <summary className={styles.q}>{f.question}</summary>
              <div className={styles.a}>
                <Lexical data={f.answer} />
              </div>
            </details>
          ))}
        </div>
        <Link href={`/trips/${slug}/faq`} className="btn-ghost">
          All questions →
        </Link>
      </div>
    </section>
  )
}
```

CSS: block-9 accordion look — `--rb-dark` section, items separated by `--rb-white-12` rules, `.q` bold white with a red marker, `.a` `--rb-white-60`.

Check the `FAQ` type name in `src/payload-types.ts` (`FAQ` vs `Faq`) and the homepage `HomepageFAQ.tsx` accordion for the established `<details>` pattern — mirror it.

- [ ] **Step 2: Typecheck + commit** — `git commit -m "feat(trip): InlineFAQ top-questions section"`

### Task 16: Recompose the trip page (order + drops + FinalCTA, block 10)

**Files:**
- Modify: `src/app/(frontend)/trips/[slug]/page.tsx`
- Modify: `src/components/sections/BookingCTA.tsx` + `.module.css` (restyle pass)

- [ ] **Step 1: Restyle BookingCTA** to block 10's "Ready to Climb Smarter?" band: `--rb-black`, giant Bebas heading, `btn-primary`. Props unchanged (it receives `event` + optional `heading`).

- [ ] **Step 2: Recompose the page** to the spec's order. New body of the return (imports adjusted accordingly — remove `HowToBook`/`WhyRockbusters`, add `LocationBlock`/`InlineFAQ`; add the FAQ fetch next to the reviews fetch, mirroring the where-clause `/trips/[slug]/faq/page.tsx` uses):

```tsx
<MarketingShell transparentHeader>
  <main>
    <DetailHero event={event} />
    <SectionIntro title={event.title} lead={event.shortDescription ?? undefined} />
    <TripPitchBlock event={event} />
    <HighlightsGrid items={event.highlights} heading="Trip Highlights" />
    <AudienceCards cards={event.audienceCards} />
    <WhatYouLearn data={event.whatYouLearn} />
    <Prerequisites items={event.prerequisites} />
    <BookingCTA event={event} heading="Ready to commit?" />
    <DayByDayItinerary data={event.itinerary} />
    {location && <LocationBlock location={location} />}
    <CoachesMinimal
      coaches={event.coaches}
      framing={event.coachFramingParagraph}
      teamBullets={event.coachTeamBullets}
    />
    <PartnerBlock
      partner={event.partner}
      eyebrow={event.partnerEyebrow}
      headline={event.partnerHeadline}
      description={event.partnerDescription}
      benefits={event.partnerBenefits}
    />
    <DemoLessonBlock event={event} />
    <ReviewsRow items={reviewsResult.docs} />
    <AccommodationLogistics event={event} />
    <EssentialEquipment items={event.essentialEquipment} intro={event.equipmentIntro} />
    <PhotoGallery items={event.gallery} />
    <InlineFAQ faqs={faqs} slug={slug} />
    <BookingCTA event={event} />
  </main>
</MarketingShell>
```

`location` = first entry of `event.locations` when it's an embedded object (the event is fetched at depth 2 — check `LocationBlock`'s actual prop signature in `/programs/[slug]/page.tsx` and pass what it expects). Check `AccommodationLogistics`' props signature in the current trips page region it renders (it may take specific groups instead of `event`) — pass exactly what it takes today.

- [ ] **Step 3: Verify the whole page** against the full wireframe (`rockbusters_trip_landing_page.html`) top-to-bottom on a real trip. Also `/programs/<slug>` and `/trips/<slug>/faq` + `/logistics` still render.

- [ ] **Step 4: Typecheck + commit** — `git commit -m "feat(trip): recompose detail page to wireframe order"`

### Task 17: Trip e2e updates + snapshot regen

**Files:**
- Modify: `tests/e2e/trips.e2e.spec.ts`, `tests/e2e/trip-detail-hero.spec.ts`, `tests/e2e/trip-detail-visual.spec.ts` (+ its `-snapshots/`), `tests/e2e/programs.e2e.spec.ts` (only if broken)

- [ ] **Step 1: Run the affected suites, expect failures**

```bash
pnpm test:e2e trips trip-detail programs
```

- [ ] **Step 2: Fix assertions** — heading text/section-order assertions to the new structure; add one assertion that the FAQ inline section links to the subpage (`getByRole('link', { name: /all questions/i })`).
- [ ] **Step 3: Regenerate visual snapshots** — `pnpm test:e2e trip-detail-visual --update-snapshots`, then re-run to confirm stable PASS.
- [ ] **Step 4: Commit** — `git add tests/e2e && git commit -m "test(e2e): trip detail redesign assertions + visual snapshots"`

### Task 18: Full verification sweep

- [ ] **Step 1: Full test run**

```bash
pnpm typecheck && pnpm lint && pnpm test:int && pnpm test:e2e
```

Expected: all PASS. Fix anything that isn't, before claiming done (verification-before-completion).

- [ ] **Step 2: Manual sweep** — in the browser: `/`, `/team`, `/team/<slug>`, `/trips/<slug>`, `/trips/<slug>/faq`, `/trips/<slug>/logistics`, `/programs/<slug>`, `/destinations`, `/calendar`. Confirm one visual generation, no dark-on-dark text, mobile width (~390px) on the three redesigned pages.
- [ ] **Step 3: Final commit** of any sweep fixes — `git commit -m "fix(design): post-redesign sweep fixes"`.

---

## Out of scope (from the spec)

- "Which Format?" section · Events schema changes · booking-flow changes · new URLs · SEO redirects (separate workstream).
