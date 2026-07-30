# Team Pages Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the team pages per the approved spec decisions — `role` + `section` fields on guides, two-section `/team` index, role display, and `/team-member/*` 301s.

**Architecture:** Extends the existing scaffold (`src/app/(frontend)/team/`). Schema changes go through Payload's migration workflow (`payload migrate:create` — NEVER hand-write migration files; the Drizzle `.json` snapshot must be generated). Redirects are plain `next.config.ts` `redirects()` — an explicit map for old suffixed slugs, then a generic pattern rule.

**Tech Stack:** Payload 3 (postgres adapter, dev uses schema-push so local DB syncs automatically), Next.js 16 App Router, Playwright e2e.

**Working directory:** `/Users/janantl/Work/rockbusters/v3/.claude/worktrees/dtb` (branch `draft/destinations-team-blog-prep` checked out there). The user's dev server occupies `:3000` in the main checkout — all dev/test runs happen from this worktree on `:3001` (Playwright's webServer handles it). Spec: `docs/superpowers/specs/2026-06-11-team-pages-design.md`.

---

### Task 1: Schema — `role` and `section` on guides

**Files:**
- Modify: `src/collections/Guides.ts`
- Generated: `src/payload-types.ts`, `src/migrations/<timestamp>_guide_role_section.{ts,json}`, `src/migrations/index.ts`

- [ ] **Step 1: Add the fields**

In `src/collections/Guides.ts`, after the `slugField('name')` line, insert:

```ts
    { name: 'role', type: 'text', admin: { description: 'e.g. Head coach, Pro climber, Physiotherapist' } },
    {
      name: 'section',
      type: 'select',
      options: [
        { label: 'Rockbusters Team', value: 'team' },
        { label: 'Friends & Ambassadors', value: 'friends' },
      ],
      defaultValue: 'team',
      required: true,
    },
```

- [ ] **Step 2: Regenerate types**

Run: `pnpm generate:types`
Expected: exits 0; `src/payload-types.ts` `Guide` interface gains `role?: string | null` and `section: 'team' | 'friends'`.

- [ ] **Step 3: Create the migration (never hand-write)**

Run: `pnpm payload migrate:create guide_role_section`
Expected: creates `src/migrations/<timestamp>_guide_role_section.ts` AND `.json`, and updates `src/migrations/index.ts`. If the CLI asks questions, accept the defaults. Verify the `.json` snapshot exists — a `.ts` without its `.json` is a broken migration in this repo.

- [ ] **Step 4: Commit**

```bash
git add src/collections/Guides.ts src/payload-types.ts src/migrations/
git commit -m "feat(guides): role + section fields with migration"
```

---

### Task 2: Two-section index + role display

**Files:**
- Modify: `tests/e2e/team-pages.spec.ts`
- Modify: `src/app/(frontend)/team/page.tsx`
- Modify: `src/app/(frontend)/team/[slug]/page.tsx`
- Modify: `src/app/(frontend)/team/team.module.css`

- [ ] **Step 1: Write the failing tests**

In `tests/e2e/team-pages.spec.ts`:

(a) Extend the `guide` fixture and add a second one — replace the existing `const guide = {...}` block with:

```ts
const guide = {
  name: `E2E Guide ${runId}`,
  slug: `e2e-guide-${runId}`,
  email: `e2e-guide-${runId}@example.com`,
  bioLine: `Bio line for e2e guide ${runId} — coaching since forever.`,
  role: 'Head coach',
}
const friend = {
  name: `E2E Friend ${runId}`,
  slug: `e2e-friend-${runId}`,
  role: 'Pro climber',
}
```

(b) In `beforeAll`, add `role: guide.role, section: 'team',` to the existing create's `data`, and after it create the friend:

```ts
  await payload.create({
    collection: 'guides',
    data: {
      name: friend.name,
      slug: friend.slug,
      role: friend.role,
      section: 'friends',
      content: richText(`Friend bio ${runId}.`),
      active: true,
      featured: false,
    } as never,
  })
```

(c) Append new tests inside the `team pages` describe block:

```ts
  test('/team renders two sections with roles on cards', async ({ page }) => {
    await page.goto(`${BASE}/team`)
    await expect(page.getByRole('heading', { level: 1, name: 'Rockbusters Team' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Friends & Ambassadors' })).toBeVisible()
    const friendCard = page.getByRole('link', { name: new RegExp(friend.name) })
    await expect(friendCard).toBeVisible()
    await expect(friendCard).toContainText(friend.role)
  })

  test('/team/[slug] shows the role line', async ({ page }) => {
    await page.goto(`${BASE}/team/${guide.slug}`)
    await expect(page.getByText(guide.role)).toBeVisible()
  })
```

- [ ] **Step 2: Run to verify the new tests fail**

Run: `pnpm test:e2e tests/e2e/team-pages.spec.ts`
Expected: the 2 new tests FAIL (no "Friends & Ambassadors" heading, no role text); the 3 existing tests PASS. If anything else fails, stop and report.

- [ ] **Step 3: Implement the index sections**

Replace the body of `src/app/(frontend)/team/page.tsx` with:

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { mediaUrl, mediaAlt } from '@/lib/media'
import type { Guide } from '@/payload-types'
import styles from './team.module.css'

export const metadata = { title: 'Rockbusters Team — Rockbusters' }

function byFeaturedThenName(a: Guide, b: Guide) {
  return (
    Number(b.featured ?? false) - Number(a.featured ?? false) ||
    a.name.localeCompare(b.name)
  )
}

function GuideGrid({ guides }: { guides: Guide[] }) {
  return (
    <div className={styles.grid}>
      {guides.map((g) => {
        const url = mediaUrl(g.photo)
        return (
          <Link key={g.id} href={`/team/${g.slug}`} className={styles.card}>
            {url ? (
              <Image
                src={url}
                alt={mediaAlt(g.photo)}
                width={280}
                height={280}
                className={styles.photo}
              />
            ) : (
              <span className={styles.photoPlaceholder} aria-hidden="true" />
            )}
            <span className={styles.name}>{g.name}</span>
            {g.role ? <span className={styles.role}>{g.role}</span> : null}
          </Link>
        )
      })}
    </div>
  )
}

export default async function TeamPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'guides',
    where: { active: { equals: true } },
    limit: 100,
    depth: 1,
  })
  const team = docs.filter((g) => g.section !== 'friends').sort(byFeaturedThenName)
  const friends = docs.filter((g) => g.section === 'friends').sort(byFeaturedThenName)
  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Team' }]}>
      <main className={styles.wrap}>
        <h1>Rockbusters Team</h1>
        <GuideGrid guides={team} />
        {friends.length ? (
          <>
            <h2 className={styles.sectionHeading}>Friends &amp; Ambassadors</h2>
            <GuideGrid guides={friends} />
          </>
        ) : null}
      </main>
    </MarketingShell>
  )
}
```

- [ ] **Step 4: Add the role line to the profile**

In `src/app/(frontend)/team/[slug]/page.tsx`, directly after the `<h1>{guide.name}</h1>` line, add:

```tsx
            {guide.role ? <p className={styles.roleLine}>{guide.role}</p> : null}
```

- [ ] **Step 5: Add styles**

Append to `src/app/(frontend)/team/team.module.css`:

```css
.role {
  font-size: 14px;
  color: #666;
}

.roleLine {
  margin: -8px 0 16px;
  font-weight: 600;
  color: #c8102e;
}

.sectionHeading {
  margin-top: 48px;
}
```

- [ ] **Step 6: Run to verify all pass**

Run: `pnpm test:e2e tests/e2e/team-pages.spec.ts`
Expected: 5 PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/team-pages.spec.ts "src/app/(frontend)/team"
git commit -m "feat(team): two-section index + role display"
```

---

### Task 3: `/team-member/*` 301 redirects

**Files:**
- Modify: `tests/e2e/team-pages.spec.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Write the failing tests**

Append a new describe block to `tests/e2e/team-pages.spec.ts`:

```ts
test.describe('old-site redirects', () => {
  test('pattern: /team-member/:slug 308s to /team/:slug', async ({ request }) => {
    const res = await request.get(`${BASE}/team-member/${guide.slug}`, {
      maxRedirects: 0,
    })
    expect(res.status()).toBe(308)
    expect(res.headers()['location']).toBe(`/team/${guide.slug}`)
  })

  test('explicit map: suffixed old slug lands on clean slug', async ({ request }) => {
    const res = await request.get(`${BASE}/team-member/adam-ondra-pro-climber`, {
      maxRedirects: 0,
    })
    expect(res.status()).toBe(308)
    expect(res.headers()['location']).toBe('/team/adam-ondra')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm test:e2e tests/e2e/team-pages.spec.ts`
Expected: the 2 new tests FAIL (404, no redirect); the 5 earlier PASS.

- [ ] **Step 3: Add redirects to next.config.ts**

In `next.config.ts`, inside the `nextConfig` object (after the `images` block), add:

```ts
  async redirects() {
    // Old-site /team-member/* slugs that don't map 1:1 to the new clean slugs.
    // Source of truth: the live-site inventory in
    // docs/superpowers/specs/2026-06-11-team-pages-design.md.
    const teamMemberMap: Record<string, string> = {
      'daila-ojeda-pro-climber': 'daila-ojeda',
      'adam-ondra-pro-climber': 'adam-ondra',
      'patxi-usobiaga-pro-climber': 'patxi-usobiaga',
      'pablo-scorza-fyziotherapist-biomechanica-funcional': 'pablo-scorza',
    }
    return [
      ...Object.entries(teamMemberMap).map(([from, to]) => ({
        source: `/team-member/${from}`,
        destination: `/team/${to}`,
        permanent: true,
      })),
      // Generic rule MUST come after the explicit map.
      { source: '/team-member/:slug', destination: '/team/:slug', permanent: true },
      { source: '/team-member', destination: '/team', permanent: true },
    ]
  },
```

Note: old URLs carry trailing slashes (`/team-member/x/`); Next strips those with its own 308 before these rules apply — a two-hop chain is acceptable.

- [ ] **Step 4: Run to verify all pass**

Run: `pnpm test:e2e tests/e2e/team-pages.spec.ts`
Expected: 7 PASS. (`next.config.ts` changes need a server restart — Playwright's webServer starts fresh each run, so nothing special to do; just don't reuse a stale manually-started :3001 server.)

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/team-pages.spec.ts next.config.ts
git commit -m "feat(redirects): 301 /team-member/* to /team/* (pattern + explicit map)"
```

---

### Task 4: Full verification

- [ ] **Step 1: Lint**

Run: `pnpm lint`
Expected: 0 errors (warnings are pre-existing; 30 at last count).

- [ ] **Step 2: Full e2e suite**

Run: `pnpm test:e2e`
Expected: ALL pass (47 = 43 from the last full run + 4 new team tests). Any failure in non-team specs = regression from this work — investigate, do not paper over.

- [ ] **Step 3: No commit needed** unless fixes were required; report results.
