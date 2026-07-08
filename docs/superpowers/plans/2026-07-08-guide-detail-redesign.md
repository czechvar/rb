# Guide Detail Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/team/[slug]` to the copywriter wireframe (`docs/html/TEAM/jany-founder-head-coach.html`) with new optional Guides fields, sharing the global design vocabulary already used by the trip detail pages.

**Architecture:** New optional content fields on the `Guides` collection (migration via `payload migrate:create`); the page is recomposed from small server components under `src/components/marketing/team/`, each rendering nothing when its data is empty. Global classes (`.section-label`, `.section-title`, `.btn-*`) carry the shared font styling; per-component module CSS mirrors the wireframe values.

**Tech Stack:** Next.js App Router (RSC), Payload CMS 3 (Postgres/Drizzle), CSS modules, Vitest (int), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-07-08-guide-detail-redesign-design.md`

**Reference wireframe sections (verbatim source):** `docs/html/TEAM/jany-founder-head-coach.html` lines ~335–505. Global CSS vars (`--rb-red`, `--rb-white-45`, `--rb-white-08`, `--fs-eyebrow`, `--fs-body-lg`, …) already exist in `src/app/(frontend)/styles.css`.

**Hard rules:**
- Never hand-write a Payload migration — always `pnpm payload migrate:create <name>` (Drizzle snapshot required).
- `payload migrate` against the local `.env` (Neon **dev** branch). If it says "no migrations to run" unexpectedly, check for the stale `payload_migrations` row `name='dev'` (dev-marker trap).
- Public guide pages must never render `email`/`phone`.

---

### Task 1: Guides schema fields + migration + types

**Files:**
- Modify: `src/collections/Guides.ts`
- Test: `tests/int/guides.int.spec.ts`
- Create (generated): `src/migrations/<timestamp>_add_guide_detail_fields.ts` + `.json`
- Modify (generated): `src/payload-types.ts`, `src/migrations/index.ts`

- [ ] **Step 1: Write the failing int test** — append to `tests/int/guides.int.spec.ts` inside `describe('guides collection', …)`:

```ts
  it('stores detail-page fields (stats, about, coaching, achievements, testimonial)', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug is auto-filled by the slugField beforeValidate hook
    const guide = await payload.create({
      collection: 'guides',
      data: {
        name: `Detail Guide ${Date.now()}`,
        section: 'team',
        heroSub: 'One relentless mission.',
        heroCaption: 'Jany · Pince Sans Rire 7b+',
        stats: [{ value: '25+', label: 'Years Climbing & Coaching' }],
        about: {
          headline: 'CLIMB\nBETTER,\n*MORE.*',
          facts: [{ label: 'Residence', value: 'Ústí nad Labem, CZ' }],
          quote: 'My goal is to find your boundaries.',
          quoteAttribution: '— Jany, on how he coaches',
        },
        coaching: {
          intro: 'From first footwork to fear management.',
          pillars: [{ title: 'Mental Coaching', body: 'Fear management.' }],
        },
        achievements: {
          intro: 'Recent redpoints.',
          items: [{ route: 'Botanic', location: 'Rodellar, Spain', grade: '8b+' }],
        },
        testimonial: {
          quote: 'Jany pushed me far beyond my limits.',
          name: 'Carmen Macgee',
          tripLine: 'Rockbusters Road Trip Client',
        },
      },
    })
    expect(guide.stats?.[0]?.value).toBe('25+')
    expect(guide.about?.headline).toContain('*MORE.*')
    expect(guide.about?.facts?.[0]?.label).toBe('Residence')
    expect(guide.coaching?.pillars?.[0]?.title).toBe('Mental Coaching')
    expect(guide.achievements?.items?.[0]?.grade).toBe('8b+')
    expect(guide.testimonial?.name).toBe('Carmen Macgee')
  })
```

- [ ] **Step 2: Run it, expect failure** — `pnpm test:int guides.int` → FAIL (unknown field / type error).

- [ ] **Step 3: Add the fields** to `src/collections/Guides.ts`, after the `{ name: 'vimeoId', … }` line:

```ts
    { name: 'heroSub', type: 'textarea', admin: { description: 'Hero subtitle paragraph under the name. Falls back to tagline when empty.' } },
    { name: 'heroCaption', type: 'text', admin: { description: 'Photo credit, e.g. "Jany · Pince Sans Rire 7b+".' } },
    {
      name: 'stats',
      type: 'array',
      admin: { description: 'Stats bar under the hero, ~4 items (value "25+", label "Years Climbing & Coaching").' },
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ],
    },
    {
      name: 'about',
      type: 'group',
      admin: { description: 'About section. Bio paragraphs come from the content richtext field.' },
      fields: [
        { name: 'headline', type: 'textarea', admin: { description: 'One display line per row; wrap a line in *asterisks* to render it red.' } },
        {
          name: 'facts',
          type: 'array',
          admin: { description: 'Facts card rows. Never put email/phone here — public pages must not leak contacts.' },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'value', type: 'text', required: true },
          ],
        },
        { name: 'quote', type: 'textarea' },
        { name: 'quoteAttribution', type: 'text', admin: { description: 'e.g. "— Jany, on how he coaches"' } },
      ],
    },
    {
      name: 'coaching',
      type: 'group',
      admin: { description: '"What X coaches" numbered pillars.' },
      fields: [
        { name: 'intro', type: 'textarea' },
        {
          name: 'pillars',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'body', type: 'textarea', required: true },
          ],
        },
      ],
    },
    {
      name: 'achievements',
      type: 'group',
      admin: { description: '"On the rock" route list.' },
      fields: [
        { name: 'intro', type: 'textarea' },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'route', type: 'text', required: true },
            { name: 'location', type: 'text' },
            { name: 'grade', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'testimonial',
      type: 'group',
      admin: { description: 'Single client testimonial (always rendered with five stars).' },
      fields: [
        { name: 'quote', type: 'textarea' },
        { name: 'name', type: 'text' },
        { name: 'tripLine', type: 'text', admin: { description: 'e.g. "Rockbusters Road Trip Client"' } },
      ],
    },
```

- [ ] **Step 4: Create migration + regenerate types**

```bash
pnpm payload migrate:create add_guide_detail_fields
pnpm generate:types
```

Expected: a new `src/migrations/<ts>_add_guide_detail_fields.ts` **and** matching `.json` snapshot; `src/payload-types.ts` gains the new optional properties on `Guide`.

- [ ] **Step 5: Run the migration locally** (dev branch DB from `.env`):

```bash
pnpm payload migrate
```

Expected output includes `Migrating: <ts>_add_guide_detail_fields` … `Done`. If it no-ops, check the dev-marker trap (memory: stale `payload_migrations` row `name='dev' batch=-1`).

- [ ] **Step 6: Run the int test, expect pass** — `pnpm test:int guides.int` → PASS (the test DB migrates via the vitest harness).

- [ ] **Step 7: Typecheck + commit**

```bash
pnpm exec tsc --noEmit
git add src/collections/Guides.ts src/migrations src/payload-types.ts tests/int/guides.int.spec.ts
git commit -m "feat(guides): detail-page content fields + migration"
```

---

### Task 2: GuideHero restyle (full-bleed wireframe hero)

**Files:**
- Modify: `src/components/marketing/team/GuideHero.tsx`
- Modify: `src/components/marketing/team/GuideHero.module.css`

- [ ] **Step 1: Rewrite `GuideHero.tsx`:**

```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Guide } from '@/payload-types'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from './GuideHero.module.css'

export function GuideHero({ guide }: { guide: Guide }) {
  const photo = mediaUrl(guide.photo)
  const spaceIdx = guide.name.indexOf(' ')
  const first = spaceIdx === -1 ? guide.name : guide.name.slice(0, spaceIdx)
  const rest = spaceIdx === -1 ? null : guide.name.slice(spaceIdx + 1)
  const sub = guide.heroSub ?? guide.tagline

  return (
    <section className={styles.hero}>
      {photo ? (
        <Image
          src={photo}
          alt={mediaAlt(guide.photo)}
          fill
          priority
          sizes="100vw"
          className={styles.bg}
        />
      ) : null}
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.content}>
        {guide.role ? <p className={`section-label ${styles.eyebrow}`}>{guide.role}</p> : null}
        <h1 className={styles.name}>
          {first}
          {rest ? (
            <>
              <br />
              <em>{rest}</em>
            </>
          ) : null}
        </h1>
        {guide.tags?.length ? (
          <div className={styles.tagRow}>
            {guide.tags.map((t) => (
              <span key={t.id ?? t.text} className={styles.tag}>
                {t.text}
              </span>
            ))}
          </div>
        ) : null}
        {sub ? <p className={styles.sub}>{sub}</p> : null}
        <div className={styles.btnRow}>
          <Link href="#trips" className="btn-primary">
            Book a course with {first} →
          </Link>
          <Link href="/team" className="btn-ghost">
            Meet the full crew
          </Link>
        </div>
      </div>
      {guide.heroCaption ? <p className={styles.caption}>{guide.heroCaption}</p> : null}
    </section>
  )
}
```

- [ ] **Step 2: Rewrite `GuideHero.module.css`** (values from wireframe HERO block):

```css
.hero {
  position: relative; min-height: 100vh; overflow: hidden;
  display: flex; flex-direction: column; justify-content: flex-end;
  padding: 0 5% 7%; background: var(--rb-black);
}
.bg { object-fit: cover; object-position: center 30%; }
.overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(13,13,13,0.2) 0%, rgba(13,13,13,0.15) 30%, rgba(13,13,13,0.62) 68%, rgba(13,13,13,0.93) 100%);
}
.content { position: relative; z-index: 2; max-width: 1400px; width: 100%; margin: 0 auto; }
.eyebrow { color: var(--rb-red); display: flex; align-items: center; gap: 10px; }
.eyebrow::before { content: ''; display: inline-block; width: 32px; height: 1px; background: var(--rb-red); flex-shrink: 0; }
.name {
  font-family: 'Bebas Neue', sans-serif; font-weight: 400;
  font-size: clamp(58px, 9vw, 118px); line-height: 0.9; letter-spacing: 0.03em;
  color: var(--rb-white); text-transform: uppercase; margin: 20px 0 24px;
}
.name em { color: var(--rb-red); font-style: normal; }
.tagRow { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.tag {
  font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;
  color: var(--rb-red); border: 1px solid var(--rb-red-border); padding: 4px 10px;
}
.sub {
  font-size: clamp(16px, 2vw, 19px); line-height: 1.65; max-width: 580px;
  color: rgba(240, 237, 230, 0.8); margin-bottom: 40px;
}
.btnRow { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
.caption {
  position: absolute; bottom: 28px; right: 5%; z-index: 2;
  font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(240, 237, 230, 0.28);
}
@media (max-width: 600px) {
  .hero { padding-bottom: 14%; }
  .btnRow { flex-direction: column; align-items: stretch; }
}
```

- [ ] **Step 3: Verify** — `pnpm exec tsc --noEmit` passes; with `pnpm dev` running, `/team/<any-active-slug>` shows the full-bleed hero (name split over two lines, second line red).

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/team/GuideHero.tsx src/components/marketing/team/GuideHero.module.css
git commit -m "feat(team): full-bleed wireframe guide hero"
```

---

### Task 3: GuideStatsBar

**Files:**
- Create: `src/components/marketing/team/GuideStatsBar.tsx`
- Create: `src/components/marketing/team/GuideStatsBar.module.css`

- [ ] **Step 1: Create `GuideStatsBar.tsx`:**

```tsx
import type { Guide } from '@/payload-types'
import styles from './GuideStatsBar.module.css'

export function GuideStatsBar({ stats }: { stats: Guide['stats'] }) {
  if (!stats?.length) return null
  return (
    <div className={styles.bar}>
      {stats.map((s) => (
        <div key={s.id ?? s.label} className={styles.item}>
          <span className={styles.num}>{s.value}</span>
          <span className={styles.label}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `GuideStatsBar.module.css`** (wireframe STATS BAR block):

```css
.bar {
  background: var(--rb-red); display: flex; justify-content: space-around;
  padding: 30px 5%; gap: 16px; flex-wrap: wrap;
}
.item { text-align: center; }
.num {
  font-family: 'Bebas Neue', sans-serif; font-size: 52px; color: var(--rb-black);
  line-height: 1; display: block; letter-spacing: 0.03em;
}
.label {
  font-size: 11px; letter-spacing: 0.13em; text-transform: uppercase;
  color: rgba(13, 13, 13, 0.6); font-weight: 600; display: block; margin-top: 2px;
}
@media (max-width: 600px) {
  .bar { padding: 24px 5%; gap: 24px; }
  .num { font-size: 38px; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/team/GuideStatsBar.tsx src/components/marketing/team/GuideStatsBar.module.css
git commit -m "feat(team): guide stats bar"
```

---

### Task 4: GuideAbout (headline + bio + facts card + coach quote)

**Files:**
- Create: `src/components/marketing/team/GuideAbout.tsx`
- Create: `src/components/marketing/team/GuideAbout.module.css`

- [ ] **Step 1: Create `GuideAbout.tsx`:**

```tsx
import type { Guide } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './GuideAbout.module.css'

function Headline({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((raw, i) => {
        const line = raw.trim()
        if (!line) return null
        const accent = line.length > 2 && line.startsWith('*') && line.endsWith('*')
        return (
          <span key={i} className={accent ? styles.accent : undefined}>
            {accent ? line.slice(1, -1) : line}
            <br />
          </span>
        )
      })}
    </>
  )
}

export function GuideAbout({ guide }: { guide: Guide }) {
  const about = guide.about
  const hasLeft = Boolean(about?.headline || guide.content)
  const hasRight = Boolean(about?.facts?.length || about?.quote)
  if (!hasLeft && !hasRight) return null
  const first = guide.name.split(' ')[0]

  return (
    <section className={styles.section} id="about">
      <div className={styles.grid}>
        {hasLeft ? (
          <div className="reveal">
            <p className={`section-label ${styles.label}`}>The Coach</p>
            {about?.headline ? (
              <h2 className={`section-title ${styles.heading}`}>
                <Headline text={about.headline} />
              </h2>
            ) : null}
            {guide.content ? (
              <div className={styles.bio}>
                <Lexical data={guide.content} />
              </div>
            ) : null}
          </div>
        ) : null}
        {hasRight ? (
          <div className="reveal">
            {about?.facts?.length ? (
              <div className={styles.factsCard}>
                {about.facts.map((f) => (
                  <div key={f.id ?? f.label} className={styles.factsRow}>
                    <span className={styles.factsLabel}>{f.label}</span>
                    <span className={styles.factsValue}>{f.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {about?.quote ? (
              <div className={styles.quoteBlock}>
                <span className={styles.quoteName}>{first}</span>
                {guide.role ? <span className={styles.quoteRole}>{guide.role}</span> : null}
                <blockquote className={styles.quote}>{about.quote}</blockquote>
                {about.quoteAttribution ? (
                  <span className={styles.quoteAttr}>{about.quoteAttribution}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `GuideAbout.module.css`** (wireframe ABOUT/BIO block):

```css
.section { padding: 90px 5%; background: var(--rb-black); }
.grid {
  max-width: 1400px; margin: 0 auto;
  display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 80px; align-items: start;
}
.label { color: var(--rb-red); display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.label::before { content: ''; display: inline-block; width: 24px; height: 1px; background: var(--rb-red); flex-shrink: 0; }
.heading { font-size: clamp(42px, 6vw, 80px); margin-bottom: 24px; text-transform: uppercase; }
.accent { color: var(--rb-red); }
.bio { font-size: 16px; line-height: 1.78; color: var(--rb-white-62, rgba(240, 237, 230, 0.62)); max-width: 580px; }
.bio :global(p + p) { margin-top: 18px; }
.bio :global(h1), .bio :global(h2), .bio :global(h3), .bio :global(h4) { color: var(--rb-white); }
.bio :global(a) { color: var(--rb-red); }
.factsCard { background: #111; padding: 32px 28px; border: 1px solid var(--rb-white-08); }
.factsRow {
  display: flex; justify-content: space-between; gap: 16px;
  padding: 14px 0; border-bottom: 1px solid var(--rb-white-08); font-size: 13px;
}
.factsRow:last-child { border-bottom: none; }
.factsLabel {
  color: var(--rb-white-45); letter-spacing: 0.08em; text-transform: uppercase;
  font-weight: 600; font-size: 11px;
}
.factsValue { color: var(--rb-white); font-weight: 500; text-align: right; }
.quoteBlock { background: #111; border-left: 3px solid var(--rb-red); padding: 32px 28px; margin-top: 40px; }
.quoteName {
  font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: var(--rb-white);
  letter-spacing: 0.04em; display: block; text-transform: uppercase;
}
.quoteRole {
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--rb-red); font-weight: 700; margin-bottom: 20px; display: block;
}
.quote { font-size: 16px; font-style: italic; line-height: 1.72; color: rgba(240, 237, 230, 0.82); margin: 0; }
.quoteAttr {
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  color: rgba(240, 237, 230, 0.38); margin-top: 16px; display: block;
}
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; gap: 40px; } }
@media (max-width: 600px) { .section { padding: 60px 5%; } }
```

Note: `--rb-white-62` may not exist in `styles.css` — the fallback in `.bio` covers it. Do not add new globals.

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/team/GuideAbout.tsx src/components/marketing/team/GuideAbout.module.css
git commit -m "feat(team): guide about section (headline, bio, facts, quote)"
```

---

### Task 5: GuidePillars ("What X coaches")

**Files:**
- Create: `src/components/marketing/team/GuidePillars.tsx`
- Create: `src/components/marketing/team/GuidePillars.module.css`

- [ ] **Step 1: Create `GuidePillars.tsx`:**

```tsx
import type { Guide } from '@/payload-types'
import styles from './GuidePillars.module.css'

export function GuidePillars({ guide }: { guide: Guide }) {
  const pillars = guide.coaching?.pillars
  if (!pillars?.length) return null
  const first = guide.name.split(' ')[0]

  return (
    <section className={styles.section} id="specialization">
      <div className={styles.inner}>
        <p className={`section-label ${styles.label}`}>Specialization</p>
        <h2 className={`section-title ${styles.heading}`}>
          What {first}
          <br />
          coaches
        </h2>
        {guide.coaching?.intro ? <p className={styles.intro}>{guide.coaching.intro}</p> : null}
        <div className={styles.grid}>
          {pillars.map((p, i) => (
            <div key={p.id ?? p.title} className={`${styles.pillar} reveal`}>
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className={styles.title}>{p.title}</h3>
              <p className={styles.body}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `GuidePillars.module.css`** (wireframe SPECIALIZATION block; section-mid = `--rb-dark`):

```css
.section { background: var(--rb-dark); padding: 90px 5%; }
.inner { max-width: 1400px; margin: 0 auto; }
.label { color: var(--rb-red); display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.label::before { content: ''; display: inline-block; width: 24px; height: 1px; background: var(--rb-red); flex-shrink: 0; }
.heading { font-size: clamp(42px, 6vw, 80px); margin-bottom: 24px; text-transform: uppercase; }
.intro { font-size: 16px; line-height: 1.78; color: rgba(240, 237, 230, 0.62); max-width: 580px; }
.grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin-top: 56px;
  background: var(--rb-white-08); border: 1px solid var(--rb-white-08);
}
.pillar { background: var(--rb-black); padding: 36px 28px; transition: background 0.2s; }
.pillar:hover { background: #131313; }
.num {
  font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: var(--rb-red);
  line-height: 1; display: block; margin-bottom: 14px;
}
.title { font-size: 14px; font-weight: 700; color: var(--rb-white); margin: 0 0 10px; line-height: 1.3; }
.body { font-size: 13px; color: rgba(240, 237, 230, 0.52); line-height: 1.7; margin: 0; }
@media (max-width: 900px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .section { padding: 60px 5%; } .grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/team/GuidePillars.tsx src/components/marketing/team/GuidePillars.module.css
git commit -m "feat(team): guide specialization pillars"
```

---

### Task 6: GuideTrips ("Train with X" — dynamic events grid, wireframe card look)

**Files:**
- Create: `src/components/marketing/team/GuideTrips.tsx`
- Create: `src/components/marketing/team/GuideTrips.module.css`

- [ ] **Step 1: Create `GuideTrips.tsx`** (events come from `getPublishedEventsForGuide`, depth 1 → `types` entries are objects):

```tsx
import Link from 'next/link'
import type { Event, Guide } from '@/payload-types'
import styles from './GuideTrips.module.css'

export function GuideTrips({ guide, events }: { guide: Guide; events: Event[] }) {
  const first = guide.name.split(' ')[0]
  return (
    <section className={styles.section} id="trips">
      <div className={styles.inner}>
        <p className={`section-label ${styles.label}`}>Courses &amp; Coaching</p>
        <h2 className={`section-title ${styles.heading}`}>
          Train with
          <br />
          {first}
        </h2>
        {events.length ? (
          <div className={styles.grid}>
            {events.map((e) => {
              const t = e.types?.[0]
              const typeName = t && typeof t === 'object' ? t.name : null
              return (
                <Link key={e.id} href={`/trips/${e.slug}`} className={`${styles.card} reveal`}>
                  {typeName ? <span className={styles.kicker}>{typeName}</span> : null}
                  <span className={styles.name}>{e.title}</span>
                  {e.shortDescription ? <p className={styles.hook}>{e.shortDescription}</p> : null}
                  <span className={styles.link}>See trip →</span>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className={styles.empty}>
            {guide.name} joins selected camps throughout the season — see the calendar for dates.
          </p>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `GuideTrips.module.css`** (wireframe COURSES/COACHING block; section-dark = `--rb-darker`):

```css
.section { background: var(--rb-darker, #0a0a0a); padding: 90px 5%; }
.inner { max-width: 1400px; margin: 0 auto; }
.label { color: var(--rb-red); display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.label::before { content: ''; display: inline-block; width: 24px; height: 1px; background: var(--rb-red); flex-shrink: 0; }
.heading { font-size: clamp(42px, 6vw, 80px); margin-bottom: 24px; text-transform: uppercase; }
.grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 56px;
  background: rgba(240, 237, 230, 0.07);
}
.card {
  display: flex; flex-direction: column; min-height: 200px;
  background: var(--rb-dark); padding: 28px 24px; text-decoration: none;
  border-left: 2px solid transparent; transition: border-color 0.2s, background 0.2s;
}
.card:hover { border-color: var(--rb-red); background: #161616; }
.kicker {
  font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--rb-red); font-weight: 700; margin-bottom: 10px;
  display: flex; align-items: center; gap: 8px;
}
.kicker::before { content: ''; display: inline-block; width: 16px; height: 1px; background: var(--rb-red); }
.name {
  font-family: 'Bebas Neue', sans-serif; font-size: 25px; letter-spacing: 0.03em;
  color: var(--rb-white); margin-bottom: 10px; line-height: 1; text-transform: uppercase;
}
.hook { font-size: 13px; color: rgba(240, 237, 230, 0.52); line-height: 1.65; margin: 0 0 16px; }
.link {
  margin-top: auto; font-size: 11px; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--rb-red);
}
.empty { color: var(--rb-white-45); margin-top: 24px; }
@media (max-width: 900px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .section { padding: 60px 5%; } .grid { grid-template-columns: 1fr; } }
```

Note: if `--rb-darker` is not defined in `styles.css`, the `#0a0a0a` fallback applies — check with `grep -n "rb-darker" "src/app/(frontend)/styles.css"` and drop the fallback if the var exists.

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/team/GuideTrips.tsx src/components/marketing/team/GuideTrips.module.css
git commit -m "feat(team): train-with-guide trips grid in wireframe card style"
```

---

### Task 7: GuideAchievements + GuideTestimonial

**Files:**
- Create: `src/components/marketing/team/GuideAchievements.tsx` + `.module.css`
- Create: `src/components/marketing/team/GuideTestimonial.tsx` + `.module.css`

- [ ] **Step 1: Create `GuideAchievements.tsx`:**

```tsx
import type { Guide } from '@/payload-types'
import styles from './GuideAchievements.module.css'

export function GuideAchievements({ data }: { data: Guide['achievements'] }) {
  if (!data?.items?.length) return null
  return (
    <section className={styles.section} id="achievements">
      <div className={styles.inner}>
        <p className={`section-label ${styles.label}`}>Sports Achievements</p>
        <h2 className={`section-title ${styles.heading}`}>
          On the
          <br />
          rock
        </h2>
        {data.intro ? <p className={styles.intro}>{data.intro}</p> : null}
        <div className={styles.list}>
          {data.items.map((a) => (
            <div key={a.id ?? a.route} className={styles.row}>
              <div>
                <div className={styles.route}>{a.route}</div>
                {a.location ? <div className={styles.loc}>{a.location}</div> : null}
              </div>
              {a.grade ? <span className={styles.grade}>{a.grade}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `GuideAchievements.module.css`:**

```css
.section { background: var(--rb-black); padding: 90px 5%; }
.inner { max-width: 1400px; margin: 0 auto; }
.label { color: var(--rb-red); display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.label::before { content: ''; display: inline-block; width: 24px; height: 1px; background: var(--rb-red); flex-shrink: 0; }
.heading { font-size: clamp(42px, 6vw, 80px); margin-bottom: 24px; text-transform: uppercase; }
.intro { font-size: 16px; line-height: 1.78; color: rgba(240, 237, 230, 0.62); max-width: 580px; }
.list {
  margin-top: 48px; display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 2px; background: rgba(240, 237, 230, 0.06);
}
.row {
  background: var(--rb-black); padding: 20px 26px;
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
}
.route { font-size: 14px; font-weight: 600; color: var(--rb-white); }
.loc { font-size: 12px; color: var(--rb-white-45); margin-top: 2px; }
.grade {
  font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: var(--rb-red);
  letter-spacing: 0.04em; flex-shrink: 0;
}
@media (max-width: 900px) { .list { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .section { padding: 60px 5%; } }
```

- [ ] **Step 3: Create `GuideTestimonial.tsx`:**

```tsx
import type { Guide } from '@/payload-types'
import styles from './GuideTestimonial.module.css'

export function GuideTestimonial({ guide }: { guide: Guide }) {
  const t = guide.testimonial
  if (!t?.quote) return null
  const first = guide.name.split(' ')[0]
  return (
    <section className={styles.section}>
      <p className={`section-label ${styles.label}`}>Client Testimonial</p>
      <h2 className={`section-title ${styles.heading}`}>
        Coached by
        <br />
        {first}
      </h2>
      <div className={`${styles.card} reveal`}>
        <div className={styles.stars} aria-label="5 out of 5 stars">
          ★★★★★
        </div>
        <p className={styles.quote}>&ldquo;{t.quote}&rdquo;</p>
        {t.name ? <span className={styles.who}>{t.name}</span> : null}
        {t.tripLine ? <span className={styles.trip}>{t.tripLine}</span> : null}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create `GuideTestimonial.module.css`:**

```css
.section { background: var(--rb-darker, #0a0a0a); padding: 90px 5%; text-align: center; }
.label { color: var(--rb-red); display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 14px; }
.label::before { content: ''; display: inline-block; width: 24px; height: 1px; background: var(--rb-red); flex-shrink: 0; }
.heading { font-size: clamp(42px, 6vw, 80px); margin-bottom: 24px; text-transform: uppercase; }
.card {
  background: var(--rb-black); border: 1px solid var(--rb-white-08);
  padding: 44px 40px; max-width: 760px; margin: 48px auto 0;
}
.stars { color: var(--rb-red); font-size: 14px; letter-spacing: 5px; margin-bottom: 18px; }
.quote { font-size: 18px; font-weight: 700; color: var(--rb-white); line-height: 1.5; margin: 0 0 18px; font-style: italic; }
.who { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--rb-red); font-weight: 700; display: block; }
.trip { font-size: 11px; color: rgba(240, 237, 230, 0.3); margin-top: 3px; letter-spacing: 0.06em; display: block; }
@media (max-width: 600px) { .section { padding: 60px 5%; } .card { padding: 32px 22px; } }
```

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/team/GuideAchievements.tsx src/components/marketing/team/GuideAchievements.module.css src/components/marketing/team/GuideTestimonial.tsx src/components/marketing/team/GuideTestimonial.module.css
git commit -m "feat(team): guide achievements list + testimonial card"
```

---

### Task 8: GuideFinalCTA (red band)

**Files:**
- Create: `src/components/marketing/team/GuideFinalCTA.tsx`
- Create: `src/components/marketing/team/GuideFinalCTA.module.css`

- [ ] **Step 1: Create `GuideFinalCTA.tsx`:**

```tsx
import Link from 'next/link'
import styles from './GuideFinalCTA.module.css'

export function GuideFinalCTA({ firstName }: { firstName: string }) {
  return (
    <section className={styles.section} id="contact">
      <p className={`section-label ${styles.label}`}>Ready When You Are</p>
      <h2 className={styles.heading}>
        LET&apos;S GET
        <br />
        ON THE ROCK
      </h2>
      <p className={styles.body}>
        Find the right course, trip, or coaching format with {firstName} for where you&apos;re at.
      </p>
      <div className={styles.ctas}>
        <Link href="/calendar" className="btn-dark">
          Find your trip →
        </Link>
        <Link href="/team" className="btn-outline-dark">
          View all guides &amp; coaches
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `GuideFinalCTA.module.css`** (wireframe FINAL CTA block):

```css
.section { background: var(--rb-red); padding: 100px 5%; text-align: center; }
.label { color: rgba(13, 13, 13, 0.5); display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 14px; }
.label::before { content: ''; display: inline-block; width: 24px; height: 1px; background: rgba(13, 13, 13, 0.5); flex-shrink: 0; }
.heading {
  font-family: 'Bebas Neue', sans-serif; font-weight: 400;
  font-size: clamp(52px, 8vw, 100px); color: var(--rb-black);
  line-height: 0.88; margin-bottom: 22px; letter-spacing: 0.03em;
}
.body { font-size: 17px; color: rgba(13, 13, 13, 0.65); max-width: 480px; margin: 0 auto 44px; line-height: 1.65; }
.ctas { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
@media (max-width: 600px) { .section { padding: 70px 5%; } .heading { font-size: clamp(44px, 13vw, 72px); } }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/team/GuideFinalCTA.tsx src/components/marketing/team/GuideFinalCTA.module.css
git commit -m "feat(team): guide final CTA band"
```

---

### Task 9: Recompose `/team/[slug]` page

**Files:**
- Modify: `src/app/(frontend)/team/[slug]/page.tsx`
- Modify: `src/app/(frontend)/team/[slug]/guide.module.css`

- [ ] **Step 1: Rewrite `page.tsx`:**

```tsx
import { notFound } from 'next/navigation'
import { getGuideBySlug, getPublishedEventsForGuide } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { GuideHero } from '@/components/marketing/team/GuideHero'
import { GuideStatsBar } from '@/components/marketing/team/GuideStatsBar'
import { GuideAbout } from '@/components/marketing/team/GuideAbout'
import { GuidePillars } from '@/components/marketing/team/GuidePillars'
import { GuideTrips } from '@/components/marketing/team/GuideTrips'
import { GuideAchievements } from '@/components/marketing/team/GuideAchievements'
import { GuideTestimonial } from '@/components/marketing/team/GuideTestimonial'
import { GuideFinalCTA } from '@/components/marketing/team/GuideFinalCTA'
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

  // Email/phone exist on the collection but are intentionally not rendered —
  // public team pages must not leak contacts (see team-pages spec).
  const events = await getPublishedEventsForGuide(guide.id)

  return (
    <MarketingShell transparentHeader>
      <main className={styles.page}>
        <GuideHero guide={guide} />
        <GuideStatsBar stats={guide.stats} />
        <GuideAbout guide={guide} />
        {guide.vimeoId ? (
          <section className={styles.video}>
            <iframe
              src={`https://player.vimeo.com/video/${guide.vimeoId}`}
              title={`${guide.name} — video`}
              allow="fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </section>
        ) : null}
        <GuidePillars guide={guide} />
        <GuideTrips guide={guide} events={events} />
        <GuideAchievements data={guide.achievements} />
        <GuideTestimonial guide={guide} />
        <GuideFinalCTA firstName={guide.name.split(' ')[0]} />
      </main>
    </MarketingShell>
  )
}
```

- [ ] **Step 2: Trim `guide.module.css`** to what the page still owns (the bio/trips/cta styles move into components):

```css
.page { background: var(--rb-black); }
.video { max-width: 960px; margin: 0 auto; padding: 80px 5% 0; }
.video iframe { width: 100%; aspect-ratio: 16 / 9; border: 0; }
```

- [ ] **Step 3: Verify** — `pnpm exec tsc --noEmit` passes. With `pnpm dev`: `/team/<seeded-slug>` renders hero → (stats/about/pillars only if filled) → Train with X → final CTA. A guide with no new content shows hero, bio-less about skipped, trips, CTA — no empty sections.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(frontend)/team/[slug]/page.tsx" "src/app/(frontend)/team/[slug]/guide.module.css"
git commit -m "feat(team): recompose guide detail page to wireframe order"
```

---

### Task 10: Seed Jany's wireframe content

**Files:**
- Modify: `scripts/seed.ts` (after the `guideMarek` block, ~line 495)

- [ ] **Step 1: Check whether a Jany guide already exists in the dev DB** (slug may differ). With `pnpm dev` running, open `/admin/collections/guides` and search "Jany". If a record exists, use its slug in the `where` clause and `slug` field below instead of `jany` (updating the existing record beats creating a duplicate founder).

- [ ] **Step 2: Add the seed block** after `guideMarek` (uses the same `upsert` helper as events so re-seeding updates content; copy is verbatim from the wireframe):

```ts
  const guideJany = await upsert(payload, {
    collection: 'guides',
    where: { slug: { equals: 'jany' } },
    data: {
      name: 'Jany Novotný',
      slug: 'jany',
      role: 'Founder & Head Coach',
      section: 'team',
      active: true,
      featured: true,
      isFounder: true,
      heroSub:
        '25 years on rock, one relentless mission: help you climb better, harder, and more. Jany founded Rockbusters and still coaches every discipline himself — from first lead to your hardest redpoint.',
      heroCaption: 'Jany · Pince Sans Rire 7b+',
      stats: [
        { value: '25+', label: 'Years Climbing & Coaching' },
        { value: '8b+', label: 'Personal Redpoint Grade' },
        { value: '5', label: 'Disciplines Coached' },
        { value: '1', label: 'Founder & Head Coach' },
      ],
      content: richText(
        'Jany trained in Social Politics and Social Work, but the mountains kept calling louder than any career path could. So he built one out of climbing instead — founding Rockbusters (and its sister project, Snowbusters) to turn two decades of guiding and coaching into a full-time mission.',
        "He's been coaching climbers and skiers since he was twenty, and the throughline across every course he's run is simple: find your real limit, then help you push past it. His style is direct — not everyone's cup of tea, by his own admission — but it's built countless strong climbers and just as many genuine friendships along the way.",
        "Whether you're learning to lead for the first time or chasing your next redpoint grade, Jany brings the same technical precision and mental coaching to every session, on rock all across Europe.",
      ),
      about: {
        headline: 'CLIMB\nBETTER,\nHARDER,\n*MORE.*',
        facts: [
          { label: 'Residence', value: 'Ústí nad Labem, CZ' },
          { label: 'Years Climbing', value: '25' },
          { label: 'Role', value: 'Founder & Head Coach' },
          { label: 'Best Redpoint', value: '8b+' },
          { label: 'Coaches', value: 'Sport, Boulder, Multi-Pitch, DWS' },
        ],
        quote:
          'My goal is to find your boundaries and help you smash right through them. It might get tough at times — but with the right technical know-how and mental coaching, no goal is out of reach.',
        quoteAttribution: '— Jany, on how he coaches',
      },
      coaching: {
        intro:
          "From first footwork to fear management, Jany's coaching covers the full technical and mental range a climber needs to progress safely and quickly.",
        pillars: [
          {
            title: 'Technique, Basic to Advanced',
            body: 'Footwork, balance, and handhold use through to sidesteps, drop-knees, flagging, heel/toe hooks, and no-hand rests.',
          },
          {
            title: 'Mental Coaching',
            body: 'Reaching and overcoming individual limits, plus dedicated fear management for climbers stuck below their real potential.',
          },
          {
            title: 'Climbing Safety',
            body: 'Belaying and lead belaying, anchor set-up, lead climbing technique, spotting, and reading outdoor climbing risk.',
          },
          {
            title: 'Send Tactics',
            body: 'Onsight, flash, and redpoint strategy — plus the deep water solo–specific safety, technique, and tricks few coaches teach.',
          },
        ],
      },
      achievements: {
        intro: 'A working coach who still climbs at the sharp end — recent redpoints across Spain and France.',
        items: [
          { route: 'Botanic', location: 'Rodellar, Spain', grade: '8b+' },
          { route: 'Spirit Rebel', location: 'Rodellar, Spain', grade: '8b' },
          { route: 'Mal de Amores', location: 'Rodellar, Spain', grade: '8a+' },
          { route: 'Montserrat', location: 'Rodellar, Spain', grade: '8a+' },
          { route: 'Tirali Valent', location: 'Sella, Spain', grade: '8a+' },
          { route: 'La Forqueta del Diablo', location: 'Sella, Spain', grade: '8a+' },
          { route: 'Les Ailes du Désir, L1–L2', location: 'Gorges du Tarn, France', grade: '8a' },
          { route: 'Teuchipa', location: 'Céüse, France', grade: '7c' },
        ],
      },
      testimonial: {
        quote:
          "Jany pushed me far beyond what I thought were my limits and made me fall even more in love with climbing. I went from 6C to 7C on that trip — and made friends I'll keep for life along the way.",
        name: 'Carmen Macgee',
        tripLine: 'Rockbusters Road Trip Client',
      },
    },
    label: 'jany',
  })
  void guideJany
```

Match the `upsert` helper's actual signature to how the events blocks call it (same file, ~line 499). If only `ensure` exists for guides, still use `upsert` — content updates on re-seed are the point.

- [ ] **Step 3: Run the seed against the dev DB** (verify `.env` host is NOT `ep-weathered-pine-alvc3sdj` first):

```bash
grep -o "ep-[a-z0-9-]*" .env | head -1   # must NOT be ep-weathered-pine-alvc3sdj
pnpm seed
```

Expected: log line for `jany` under `— guides —`.

- [ ] **Step 4: Verify in browser** — `/team/jany` renders every wireframe section with the copy above.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat(seed): Jany founder guide with full detail-page content"
```

---

### Task 11: E2e updates + guide visual baseline

**Files:**
- Modify: `tests/e2e/team-pages.spec.ts`
- Create: `tests/e2e/guide-detail-visual.spec.ts` (+ committed `-snapshots/` folder)

- [ ] **Step 1: Extend the e2e fixture guide** in `team-pages.spec.ts` `beforeAll` — add to the first `payload.create` data object (after `tags: [{ text: guide.tagText }],`):

```ts
      stats: [{ value: '25+', label: 'Years Climbing' }],
      about: {
        headline: 'CLIMB\n*MORE.*',
        facts: [{ label: 'Residence', value: 'Testville' }],
        quote: 'Find your boundaries.',
        quoteAttribution: '— E2E',
      },
      coaching: { intro: 'Full range.', pillars: [{ title: 'Mental Coaching', body: 'Fear management.' }] },
      achievements: { intro: 'Recent sends.', items: [{ route: 'Botanic', location: 'Rodellar', grade: '8b+' }] },
      testimonial: { quote: 'Pushed me beyond my limits.', name: 'Carmen', tripLine: 'Road Trip Client' },
```

- [ ] **Step 2: Update / add assertions** in the `team pages` describe block:

Replace the `guide detail renders hero + trips section` test with:

```ts
  test('guide detail renders wireframe sections in order', async ({ page }) => {
    await page.goto(`${BASE}/team/${guide.slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(guide.name, { ignoreCase: true })
    await expect(page.getByText('25+')).toBeVisible() // stats bar
    await expect(page.getByRole('heading', { name: /what .* coaches/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /train with/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /on the rock/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /coached by/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /let's get/i })).toBeVisible()
    await expect(page.getByText(guide.bioLine)).toBeVisible()
  })
```

Keep `guide contact details never render` unchanged (it must keep passing — facts card has no email).

- [ ] **Step 3: Create `tests/e2e/guide-detail-visual.spec.ts`:**

```ts
import { test, expect } from '@playwright/test'

// Visual baseline for /team/[slug] after the guide wireframe rebuild.
// Run `pnpm test:e2e guide-detail-visual --update-snapshots` once locally
// to generate the baseline, then commit the snapshot folder.

const SLUG = 'jany' // seeded guide with full detail content (scripts/seed.ts)

test('guide detail page renders (baseline)', async ({ page }) => {
  await page.goto(`http://localhost:3001/team/${SLUG}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page).toHaveScreenshot('guide-detail.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
```

- [ ] **Step 4: Run the affected suites**

```bash
pnpm test:e2e team-pages
pnpm test:e2e guide-detail-visual --update-snapshots
pnpm test:e2e guide-detail-visual
```

Expected: team-pages all PASS; visual spec generates the baseline then PASSES stably.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/team-pages.spec.ts tests/e2e/guide-detail-visual.spec.ts tests/e2e/guide-detail-visual.spec.ts-snapshots
git commit -m "test(e2e): guide detail redesign assertions + visual baseline"
```

---

### Task 12: Full verification sweep

- [ ] **Step 1: Full test run**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test:int && pnpm test:e2e
```

Expected: all PASS (lint: 0 errors; pre-existing warnings OK). Fix anything that isn't before claiming done (verification-before-completion).

- [ ] **Step 2: Manual sweep** — in the browser: `/team/jany` (desktop + ~390px), `/team`, one other guide without new content (no empty sections), `/trips/<slug>` (fonts/buttons visually consistent with the guide page), and confirm no email address appears anywhere in the `/team/jany` DOM.

- [ ] **Step 3: Final commit** of any sweep fixes:

```bash
git commit -am "fix(team): guide detail sweep fixes"
```

---

## Out of scope (from the spec)

- Curated "Train with X" category cards · inquiry/contact form · team listing page changes.
