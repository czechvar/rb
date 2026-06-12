# Destination Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/destinations` index (grouped by country) + `/destinations/[slug]` detail pages from the existing `locations` collection, with old-slug alignment and `/location/*` 301s — the approved "thin v1".

**Architecture:** Mirrors the team pages: server components in `src/app/(frontend)/destinations/`, `MarketingShell` wrapper, Payload local API queries, CSS modules. Schema gains image fields via `payload migrate:create` (never hand-written). Maps are a zero-dependency OpenStreetMap iframe embed built from the stored `[lng, lat]` point. Spec: `docs/superpowers/specs/2026-06-11-destination-pages-design.md`.

**Tech Stack:** Payload 3 (postgres, dev schema-push), Next 16 App Router, Playwright e2e.

**Working directory:** `/Users/janantl/Work/rockbusters/v3/.claude/worktrees/dtb` (branch `draft/destinations-team-blog-prep`). All test runs on `:3001` via Playwright's webServer; the user's own dev server owns `:3000` in the main checkout.

---

### Task 1: Schema — `mainPicture`, `gallery`, `featured` on locations

**Files:**
- Modify: `src/collections/Locations.ts`
- Generated: `src/payload-types.ts`, `src/migrations/<timestamp>_location_destination_fields.{ts,json}`, `src/migrations/index.ts`

- [ ] **Step 1: Add the fields**

In `src/collections/Locations.ts`, after the `coordinates` field line, insert:

```ts
    { name: 'mainPicture', type: 'upload', relationTo: 'media' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
    { name: 'featured', type: 'checkbox', defaultValue: false },
```

- [ ] **Step 2: Regenerate types**

Run: `pnpm generate:types`
Expected: exit 0; `Location` interface gains `mainPicture?: number | Media | null`, `gallery?: (number | Media)[] | null`, `featured?: boolean | null`.

- [ ] **Step 3: Create the migration (never hand-write)**

Run: `pnpm payload migrate:create location_destination_fields`
Expected: `.ts` + `.json` + `index.ts` update. Verify the `.json` exists. The `up()` should add `main_picture_id` (FK to media), a `locations_rels`-style or `gallery` rels handling (Payload models upload-hasMany via a rels table — whatever the CLI generates is correct), and `featured` boolean default false. If it looks empty, STOP and report.

- [ ] **Step 4: Commit**

```bash
git add src/collections/Locations.ts src/payload-types.ts src/migrations/
git commit -m "feat(locations): mainPicture/gallery/featured fields with migration"
```

---

### Task 2: Seed slug realignment (old short slugs)

**Files:**
- Modify: `scripts/seed.ts`

- [ ] **Step 1: Realign the five location slugs**

In `scripts/seed.ts`:

(a) Extend the existing drop list (the `locationsToDrop` array near the top) to also drop the suffixed slugs being retired:

```ts
  const locationsToDrop = [
    'arco-italy',
    'kalymnos-greece',
    'frankenjura-germany',
    'mallorca-spain',
    'labske-udoli-czechia',
    'dolomites-italy',
    'cavallers-spain',
  ]
```

(b) For each of the five location `ensure(...)` blocks, change the slug to the old-site short form in all three places (`where.slug.equals`, `data.slug`, `label`). Names stay as they are:

| old seed slug | new slug |
|---|---|
| `frankenjura-germany` | `frankenjura` |
| `mallorca-spain` | `mallorca` |
| `labske-udoli-czechia` | `labske-udoli` |
| `dolomites-italy` | `dolomites` |
| `cavallers-spain` | `cavallers` |

- [ ] **Step 2: Run the seed**

Run: `pnpm seed`
Expected: exits 0; log shows the suffixed locations dropped and short-slug ones created. (Precedent: the drop list already retired `arco-italy`/`kalymnos-greece` in an earlier rename — same mechanism.) Note: seed-created events re-`ensure` by slug and keep their `locations` relations pointing at the recreated rows because the drop runs before the location/event ensures.

- [ ] **Step 3: Verify relations survived**

Write a throwaway script `scripts/check-dolomites.ts` (delete it after this step):

```ts
import { getPayload } from 'payload'
import config from '../src/payload.config.js'

const p = await getPayload({ config })
const { docs } = await p.find({ collection: 'locations', where: { slug: { equals: 'dolomites' } } })
console.log('dolomites id:', docs[0]?.id)
const ev = await p.find({ collection: 'events', where: { locations: { contains: docs[0]?.id } }, limit: 3 })
console.log('events linked:', ev.totalDocs)
process.exit(0)
```

Run: `pnpm tsx scripts/check-dolomites.ts` then `rm scripts/check-dolomites.ts`
Expected: `dolomites id: <number>` and `events linked:` ≥ 1. If 0, re-run `pnpm seed` once (the event ensures relink on a second pass) and re-check; still 0 → report. (Task 3's e2e independently proves the relation query path with its own fixtures, so this step is about seeded demo data, not feature correctness.)

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts
git commit -m "chore(seed): realign location slugs to old-site short form"
```

---

### Task 3: `/destinations` index + detail pages (TDD)

**Files:**
- Create: `tests/e2e/destination-pages.spec.ts`
- Create: `src/app/(frontend)/destinations/destinations.module.css`
- Create: `src/app/(frontend)/destinations/page.tsx`
- Create: `src/app/(frontend)/destinations/[slug]/page.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/e2e/destination-pages.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const BASE = 'http://localhost:3001'
const runId = Date.now().toString(36)
const dest = {
  name: `E2E Crag ${runId}`,
  slug: `e2e-crag-${runId}`,
  country: 'Testland',
  introLine: `Intro line for e2e crag ${runId} — pockets for days.`,
}
const eventTitle = `E2E Dest Trip ${runId}`

function richText(...paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [{ type: 'text', text, version: 1 }],
      })),
    },
  }
}

test.beforeAll(async () => {
  const payload = await getPayload({ config })
  const loc = await payload.create({
    collection: 'locations',
    data: {
      name: dest.name,
      slug: dest.slug,
      country: dest.country,
      coordinates: [11.41, 49.77],
      content: richText(dest.introLine),
      active: true,
    } as never,
  })
  await payload.create({
    collection: 'events',
    data: {
      title: eventTitle,
      state: 'published',
      locations: [loc.id],
    } as never,
  })
})

test.describe('destination pages', () => {
  test('/destinations groups by country and links cards', async ({ page }) => {
    await page.goto(`${BASE}/destinations`)
    await expect(page.getByRole('heading', { level: 1, name: 'Destinations' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: dest.country })).toBeVisible()
    const card = page.getByRole('link', { name: new RegExp(dest.name) })
    await expect(card).toBeVisible()
    await expect(card).toHaveAttribute('href', `/destinations/${dest.slug}`)
  })

  test('/destinations/[slug] renders content, map, and trips', async ({ page }) => {
    await page.goto(`${BASE}/destinations/${dest.slug}`)
    await expect(page.getByRole('heading', { level: 1, name: dest.name })).toBeVisible()
    await expect(page.getByText(dest.introLine)).toBeVisible()
    await expect(page.locator('iframe[src*="openstreetmap.org"]')).toBeVisible()
    await expect(page.getByRole('link', { name: eventTitle })).toBeVisible()
  })

  test('unknown destination slug 404s', async ({ page }) => {
    const res = await page.goto(`${BASE}/destinations/__does-not-exist__`)
    expect(res?.status()).toBe(404)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm test:e2e tests/e2e/destination-pages.spec.ts`
Expected: all 3 FAIL (routes don't exist → 404s).

- [ ] **Step 3: Create the CSS module**

Create `src/app/(frontend)/destinations/destinations.module.css`:

```css
.wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 16px 64px;
}

.countryHeading {
  margin-top: 48px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  margin-top: 16px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.card:hover .name {
  color: #c8102e;
}

.photo,
.photoPlaceholder {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  border-radius: 8px;
  background: #f1efed;
}

.name {
  font-weight: 600;
  font-size: 17px;
}

.detailHeader {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.countryLine {
  color: #666;
  font-weight: 500;
}

.heroPhoto {
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 24px;
}

.map {
  margin-top: 40px;
  aspect-ratio: 16 / 9;
}

.map iframe {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 8px;
}

.tripList {
  margin: 12px 0 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

- [ ] **Step 4: Create the index page**

Create `src/app/(frontend)/destinations/page.tsx`:

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { mediaUrl, mediaAlt } from '@/lib/media'
import type { Location } from '@/payload-types'
import styles from './destinations.module.css'

export const metadata = { title: 'Destinations — Rockbusters' }

function countryAnchor(country: string) {
  return country.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export default async function DestinationsPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'locations',
    where: { active: { equals: true } },
    limit: 200,
    depth: 1,
  })
  const byCountry = new Map<string, Location[]>()
  for (const loc of docs) {
    const key = loc.country ?? 'Elsewhere'
    byCountry.set(key, [...(byCountry.get(key) ?? []), loc])
  }
  const countries = [...byCountry.keys()].sort((a, b) => a.localeCompare(b))
  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Destinations' }]}>
      <main className={styles.wrap}>
        <h1>Destinations</h1>
        {countries.map((country) => (
          <section key={country}>
            <h2 className={styles.countryHeading} id={countryAnchor(country)}>
              {country}
            </h2>
            <div className={styles.grid}>
              {(byCountry.get(country) ?? [])
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((loc) => {
                  const url = mediaUrl(loc.mainPicture)
                  return (
                    <Link key={loc.id} href={`/destinations/${loc.slug}`} className={styles.card}>
                      {url ? (
                        <Image
                          src={url}
                          alt={mediaAlt(loc.mainPicture)}
                          width={360}
                          height={240}
                          className={styles.photo}
                        />
                      ) : (
                        <span className={styles.photoPlaceholder} aria-hidden="true" />
                      )}
                      <span className={styles.name}>{loc.name}</span>
                    </Link>
                  )
                })}
            </div>
          </section>
        ))}
      </main>
    </MarketingShell>
  )
}
```

- [ ] **Step 5: Create the detail page**

Create `src/app/(frontend)/destinations/[slug]/page.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Lexical } from '@/lib/lexical'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from '../destinations.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return { title: `${slug.replace(/-/g, ' ')} — Rockbusters Destinations` }
}

function osmEmbedSrc(lng: number, lat: number) {
  const bbox = [lng - 0.05, lat - 0.03, lng + 0.05, lat + 0.03].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

export default async function DestinationPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'locations',
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    limit: 1,
    depth: 1,
  })
  const loc = docs[0]
  if (!loc) notFound()

  const { docs: events } = await payload.find({
    collection: 'events',
    where: { and: [{ locations: { contains: loc.id } }, { state: { equals: 'published' } }] },
    limit: 20,
    depth: 0,
  })

  const hero = mediaUrl(loc.mainPicture)
  const [lng, lat] = loc.coordinates ?? [null, null]
  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/destinations', label: 'Destinations' },
        { label: loc.name },
      ]}
    >
      <main className={styles.wrap}>
        <div className={styles.detailHeader}>
          <h1>{loc.name}</h1>
          {loc.country ? <p className={styles.countryLine}>{loc.country}</p> : null}
        </div>
        {hero ? (
          <Image
            src={hero}
            alt={mediaAlt(loc.mainPicture)}
            width={1080}
            height={540}
            className={styles.heroPhoto}
          />
        ) : null}
        <Lexical data={loc.content} />

        {typeof lng === 'number' && typeof lat === 'number' ? (
          <div className={styles.map}>
            <iframe
              src={osmEmbedSrc(lng, lat)}
              title={`Map of ${loc.name}`}
              loading="lazy"
            />
          </div>
        ) : null}

        <section>
          <h2>Trips in {loc.name}</h2>
          {events.length ? (
            <ul className={styles.tripList}>
              {events.map((e) => (
                <li key={e.id}>
                  <Link href={`/trips/${e.slug}`}>{e.title}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No trips scheduled here right now — see the calendar for what&apos;s next.</p>
          )}
        </section>
      </main>
    </MarketingShell>
  )
}
```

- [ ] **Step 6: Run to verify they pass**

Run: `pnpm test:e2e tests/e2e/destination-pages.spec.ts`
Expected: 3 PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/destination-pages.spec.ts "src/app/(frontend)/destinations"
git commit -m "feat(destinations): index grouped by country + detail with OSM map and trips"
```

---

### Task 4: `/location/*` redirects + footer links

**Files:**
- Modify: `tests/e2e/destination-pages.spec.ts`
- Modify: `next.config.ts`
- Modify: `src/components/marketing/Footer.tsx`

- [ ] **Step 1: Write the failing tests**

Append to `tests/e2e/destination-pages.spec.ts` (top level):

```ts
test.describe('old-site redirects + footer', () => {
  test('/location/:slug 308s to /destinations/:slug', async ({ request }) => {
    const res = await request.get(`${BASE}/location/${dest.slug}`, { maxRedirects: 0 })
    expect(res.status()).toBe(308)
    expect(res.headers()['location']).toBe(`/destinations/${dest.slug}`)
  })

  test('footer destination links point at the index country anchors', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const spain = page.locator('footer').getByRole('link', { name: 'Spain' })
    await expect(spain).toHaveAttribute('href', '/destinations#spain')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm test:e2e tests/e2e/destination-pages.spec.ts`
Expected: the 2 new tests FAIL; the 3 earlier PASS.

- [ ] **Step 3: Add the redirect rules**

In `next.config.ts`, inside the existing `redirects()` return array, after the `/team-member` rules, add:

```ts
      { source: '/location/:slug', destination: '/destinations/:slug', permanent: true },
      { source: '/location', destination: '/destinations', permanent: true },
```

- [ ] **Step 4: Point the footer at the index anchors**

In `src/components/marketing/Footer.tsx`, replace the `DESTINATIONS` array with:

```ts
const DESTINATIONS = [
  { href: '/destinations#spain', label: 'Spain' },
  { href: '/destinations#italy', label: 'Italy' },
  { href: '/destinations#france', label: 'France' },
  { href: '/destinations#czech-republic', label: 'Czechia' },
]
```

(The anchors match `countryAnchor()` output for the countries used in seed data — `Czech Republic` → `czech-republic`.)

- [ ] **Step 5: Run to verify all pass**

Run: `pnpm test:e2e tests/e2e/destination-pages.spec.ts`
Expected: 5 PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/destination-pages.spec.ts next.config.ts src/components/marketing/Footer.tsx
git commit -m "feat(redirects): 301 /location/* to /destinations/*; footer links to country anchors"
```

---

### Task 5: Full verification

- [ ] **Step 1: Lint** — Run `pnpm lint`. Expected: 0 errors.

- [ ] **Step 2: Full e2e** — Run `pnpm test:e2e`. Expected: ALL pass (52 = 47 + 5 new destination tests). Any non-destination failure = regression; investigate, don't paper over.

- [ ] **Step 3: Report results.** No commit unless fixes were needed.
