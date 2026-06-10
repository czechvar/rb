# Account Shell + Header User Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap `/account/*` and `/book/*` in the storefront marketing shell, add an auth-aware user icon to the shared header, and redirect already-authenticated visitors away from `/login`.

**Architecture:** Two route-group layouts gain `<MarketingShell>` wrappers (static crumbs double as the fixed-header content offset). Auth state for the icon comes from a client-side `useMe()` hook calling Payload's built-in `GET /api/users/me` — never from `headers()`/`cookies()` in shared shell components, which would force every marketing page dynamic. Spec: `docs/superpowers/specs/2026-06-10-account-shell-user-icon-design.md`.

**Tech Stack:** Next.js 16 App Router, Payload 3 (REST `/api/users/me` + local API in test setup), CSS Modules, Playwright e2e.

**Branch:** `feat/account-shell-user-icon` (already created; spec committed).

---

## Context for a cold engineer

- The dev server for e2e runs on **port 3001** (`playwright.config.ts` `webServer` starts `pnpm dev --port 3001`, `reuseExistingServer: true`). Specs use an explicit `BASE` constant because `baseURL` is not configured.
- Run a single spec: `pnpm test:e2e tests/e2e/<file>.spec.ts`. The `test:e2e` script already injects `--import=tsx/esm`, which the Payload-importing test setup needs.
- `src/components/marketing/Header.tsx` is a client component (`'use client'`) shared by every shell page. It already has a `transparent` prop (trip-detail hero) — the icon must use `currentColor` so it needs no special casing there.
- `MarketingShell` (`src/components/marketing/MarketingShell.tsx`) renders `Header` + optional `Breadcrumb` + children + `Footer`. The Breadcrumb's `margin-top: var(--headerTotalHeight)` is what pushes content below the `position: fixed` header — that's why both new layouts pass crumbs.
- Test users are created via the Payload **local API** in `beforeAll` and must be flagged `_verified: true` via a follow-up `payload.update` (see `tests/e2e/booking.e2e.spec.ts` for the proven pattern this plan copies).

## File structure

| File | Responsibility |
|---|---|
| `src/components/marketing/useMe.ts` (new) | Client hook: am I logged in? `'out' \| 'in'`, defaults `'out'`. |
| `src/components/marketing/Header.tsx` (modify) | Render the user icon (desktop nav) and "Log in"/"My account" drawer entry from `useMe()`. |
| `src/components/marketing/marketing.module.css` (modify) | Icon-link styles. |
| `src/app/(frontend)/(auth)/login/page.tsx` (modify) | Redirect authenticated visitors to `/account`. |
| `src/app/(frontend)/account/layout.tsx` (modify) | Wrap existing auth-guard + sidebar grid in `MarketingShell`. |
| `src/app/(frontend)/book/layout.tsx` (new) | Purely visual `MarketingShell` wrapper. |
| `tests/e2e/account-shell.spec.ts` (new) | All e2e coverage for this feature, grown task by task. |
| `tests/e2e/shell-visual.spec.ts` (modify) | Update stale comment claiming `/account/*` doesn't use the shell. |

---

### Task 1: `useMe()` hook + user icon in Header

**Files:**
- Create: `tests/e2e/account-shell.spec.ts`
- Create: `src/components/marketing/useMe.ts`
- Modify: `src/components/marketing/Header.tsx`
- Modify: `src/components/marketing/marketing.module.css`

- [ ] **Step 1: Write the failing tests**

Create `tests/e2e/account-shell.spec.ts`:

```ts
import { test, expect, type Page } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const BASE = 'http://localhost:3001'
const runId = Date.now().toString(36)
const customer = {
  email: `shell-e2e-${runId}@example.com`,
  password: 'shell-e2e-pwd-1',
  name: 'Shell Tester',
  phone: '+420 600 000 998',
}
const eventTitle = `E2E Shell Trip ${runId}`

let eventDateId: number

test.beforeAll(async () => {
  const payload = await getPayload({ config })

  const event = await payload.create({
    collection: 'events',
    data: { title: eventTitle } as never,
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-10-01T00:00:00.000Z',
      dateTo: '2027-10-05T00:00:00.000Z',
      price: 250, vat: 21, currency: 'EUR', capacity: 5, active: true,
    },
  })
  eventDateId = ed.id

  const u = await payload.create({
    collection: 'users',
    data: {
      ...customer, role: 'customer',
      addresses: [{
        label: 'Home', isDefault: true,
        firstName: 'Shell', lastName: 'Tester',
        street: 'Main 1', city: 'Prague', postalCode: '11000', country: 'CZ',
      }],
    } as never,
  })
  await payload.update({
    collection: 'users', id: u.id, data: { _verified: true } as never, overrideAccess: true,
  })
})

async function login(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[name="email"]', customer.email)
  await page.fill('input[name="password"]', customer.password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
}

test.describe('header user icon', () => {
  test('logged out: icon links to /login', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const icon = page.locator('header').getByRole('link', { name: 'Log in' })
    await expect(icon).toBeVisible()
    await expect(icon).toHaveAttribute('href', '/login')
  })

  test('logged out: mobile drawer has a Log in entry', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASE}/`)
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(
      page.getByRole('dialog', { name: 'Site menu' }).getByRole('link', { name: 'Log in' }),
    ).toBeVisible()
  })

  test('logged in: icon links to /account', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/`)
    const icon = page.locator('header').getByRole('link', { name: 'My account' })
    // useMe() resolves after hydration — toHaveAttribute auto-retries.
    await expect(icon).toHaveAttribute('href', '/account')
  })
})
```

- [ ] **Step 2: Run the new spec to verify it fails**

Run: `pnpm test:e2e tests/e2e/account-shell.spec.ts`
Expected: all 3 tests FAIL — no link named "Log in"/"My account" exists in the header.

- [ ] **Step 3: Implement `useMe()`**

Create `src/components/marketing/useMe.ts`:

```ts
'use client'

import { useEffect, useState } from 'react'

export type MeState = 'out' | 'in'

/**
 * Client-side "am I logged in?" for shell chrome. Deliberately NOT a server
 * cookie read: shared shell components must not call headers()/cookies(),
 * or every marketing page goes dynamic. Until the fetch resolves (and on
 * any error) callers see 'out'.
 */
export function useMe(): MeState {
  const [state, setState] = useState<MeState>('out')

  useEffect(() => {
    let cancelled = false
    fetch('/api/users/me', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.user) setState('in')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
```

- [ ] **Step 4: Add the icon to `Header.tsx`**

In `src/components/marketing/Header.tsx`:

Add the import:

```ts
import { useMe } from './useMe'
```

Add a `UserIcon` component next to the existing `PhoneIcon`/`MenuBurger` helpers:

```tsx
function UserIcon() {
  return (
    <svg className={styles.iconLarge} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"
      />
    </svg>
  )
}
```

Inside `Header()`, after the `useState` declarations:

```ts
const me = useMe()
const userHref = me === 'in' ? '/account' : '/login'
const userLabel = me === 'in' ? 'My account' : 'Log in'
```

In the desktop nav, after the Join Us link (inside `<nav className={styles.nav}>`):

```tsx
<Link href={userHref} className={styles.userLink} aria-label={userLabel} title={userLabel}>
  <UserIcon />
</Link>
```

In the mobile drawer, after the Contact link:

```tsx
<Link href={userHref} onClick={() => setDrawerOpen(false)}>
  {userLabel}
</Link>
```

- [ ] **Step 5: Style the icon link**

In `src/components/marketing/marketing.module.css`, after the `.nav a.joinUs:hover::after` rule (line ~168):

```css
.nav a.userLink {
  display: inline-flex;
  align-items: center;
}

.nav a.userLink:hover::after {
  content: none;
}
```

(`currentColor` + the existing `.nav a` color rules mean the transparent header mode needs nothing extra.)

- [ ] **Step 6: Run the spec to verify it passes**

Run: `pnpm test:e2e tests/e2e/account-shell.spec.ts`
Expected: 3 PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/account-shell.spec.ts src/components/marketing/useMe.ts src/components/marketing/Header.tsx src/components/marketing/marketing.module.css
git commit -m "feat(header): auth-aware user icon via client-side useMe hook"
```

---

### Task 2: `/login` redirects authenticated visitors

**Files:**
- Modify: `tests/e2e/account-shell.spec.ts`
- Modify: `src/app/(frontend)/(auth)/login/page.tsx`

- [ ] **Step 1: Write the failing test**

Append to `tests/e2e/account-shell.spec.ts`:

```ts
test.describe('login redirect', () => {
  test('authenticated visit to /login lands on /account', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/login`)
    await expect(page).toHaveURL(/\/account$/)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:e2e tests/e2e/account-shell.spec.ts`
Expected: the new test FAILS (URL stays `/login`); Task 1 tests still PASS.

- [ ] **Step 3: Implement the redirect**

In `src/app/(frontend)/(auth)/login/page.tsx`, add imports:

```ts
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
```

At the top of `LoginPage`, before reading `searchParams`:

```ts
const user = await getCurrentUser()
if (user) redirect('/account')
```

- [ ] **Step 4: Run the spec to verify it passes**

Run: `pnpm test:e2e tests/e2e/account-shell.spec.ts`
Expected: 4 PASS. (The `login()` helper is unaffected — the redirect only fires for already-authenticated visitors.)

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/account-shell.spec.ts "src/app/(frontend)/(auth)/login/page.tsx"
git commit -m "feat(auth): redirect authenticated visitors from /login to /account"
```

---

### Task 3: Marketing shell on `/account/*`

**Files:**
- Modify: `tests/e2e/account-shell.spec.ts`
- Modify: `src/app/(frontend)/account/layout.tsx`

- [ ] **Step 1: Write the failing test**

Append to `tests/e2e/account-shell.spec.ts`:

```ts
test.describe('account shell', () => {
  test('/account renders header, breadcrumb, and footer', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/account`)
    await expect(page.locator('header').first()).toBeVisible()
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByText('My account'),
    ).toBeVisible()
    await expect(page.locator('footer').first()).toBeVisible()
  })

  test('/account/orders renders header and footer', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/account/orders`)
    await expect(page.locator('header').first()).toBeVisible()
    await expect(page.locator('footer').first()).toBeVisible()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:e2e tests/e2e/account-shell.spec.ts`
Expected: the 2 new tests FAIL (no `header`/`footer` elements on account pages); earlier tests PASS.

- [ ] **Step 3: Wrap the account layout**

Replace the body of `src/app/(frontend)/account/layout.tsx` with:

```tsx
import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { AccountSidebar } from './AccountSidebar'
import styles from './account.module.css'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'My account' }]}>
      <div className={styles.shell}>
        <AccountSidebar email={user.email} />
        <div className={styles.content}>{children}</div>
      </div>
    </MarketingShell>
  )
}
```

(Only the `MarketingShell` import and wrapper are new — auth guard and sidebar are unchanged.)

- [ ] **Step 4: Run the spec to verify it passes**

Run: `pnpm test:e2e tests/e2e/account-shell.spec.ts`
Expected: 6 PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/account-shell.spec.ts "src/app/(frontend)/account/layout.tsx"
git commit -m "feat(account): wrap /account/* in the marketing shell"
```

---

### Task 4: Marketing shell on `/book/*`

**Files:**
- Modify: `tests/e2e/account-shell.spec.ts`
- Create: `src/app/(frontend)/book/layout.tsx`

- [ ] **Step 1: Write the failing test**

Append to `tests/e2e/account-shell.spec.ts`:

```ts
test.describe('booking shell', () => {
  test('/book/[eventDateId] renders header and footer', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/book/${eventDateId}`)
    await expect(page.getByText(eventTitle)).toBeVisible()
    await expect(page.locator('header').first()).toBeVisible()
    await expect(page.locator('footer').first()).toBeVisible()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:e2e tests/e2e/account-shell.spec.ts`
Expected: the new test FAILS (no `header`/`footer` on the booking page); earlier tests PASS.

- [ ] **Step 3: Create the book layout**

Create `src/app/(frontend)/book/layout.tsx`:

```tsx
import React from 'react'
import { MarketingShell } from '@/components/marketing/MarketingShell'

// Purely visual — booking pages keep their own auth redirects because they
// carry ?from= context this layout can't know.
export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Booking' }]}>
      {children}
    </MarketingShell>
  )
}
```

- [ ] **Step 4: Run the spec to verify it passes**

Run: `pnpm test:e2e tests/e2e/account-shell.spec.ts`
Expected: 7 PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/account-shell.spec.ts "src/app/(frontend)/book/layout.tsx"
git commit -m "feat(booking): wrap /book/* in the marketing shell"
```

---

### Task 5: Stale-comment fix + full verification

**Files:**
- Modify: `tests/e2e/shell-visual.spec.ts:6-9`

- [ ] **Step 1: Update the stale comment**

In `tests/e2e/shell-visual.spec.ts`, replace the comment block above `const pages`:

```ts
// Public, shell-using pages. The homepage uses <Header /> + <Footer /> directly
// rather than <MarketingShell />, but the rendered shell is the same. Auth pages
// (/login, /register, /verify-email, …) intentionally keep their bare card layout.
// /account/* and /book/* DO use the shell but require authentication — they're
// covered by tests/e2e/account-shell.spec.ts instead.
```

- [ ] **Step 2: Run lint and the full e2e suite**

Run: `pnpm lint`
Expected: no errors.

Run: `pnpm test:e2e`
Expected: all specs PASS — including the pre-existing `auth.e2e.spec.ts` and `booking.e2e.spec.ts` (the shell adds chrome but no competing `button[type="submit"]`, and `/account redirects to /login when not signed in` still holds).

If `booking.e2e.spec.ts` or `auth.e2e.spec.ts` fail, the regression is in this feature — fix before committing; do not modify those specs to pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/shell-visual.spec.ts
git commit -m "test: point stale shell-visual comment at account-shell coverage"
```

---

## Deviations from the spec (intentional)

- Task 2's "failing test" passed immediately: `src/middleware.ts` (missed during planning) already redirects `payload-token` cookie-holders away from `/login`/`/register`. The page-level `getCurrentUser()` redirect was kept anyway — it validates the token rather than trusting cookie presence, mirroring the existing middleware + `account/layout.tsx` belt-and-braces pattern, and the new e2e test pins the behavior regardless of which layer provides it.

- The spec says "`shell-visual.spec.ts` baseline regenerated". Inspection shows that spec has **no screenshot baselines** (deliberately omitted per its trailing comment) — only DOM assertions. The equivalent work is Task 5's comment fix; no baselines exist to regenerate.
- The rescued `trip-detail-visual.spec.ts-snapshots/` baseline is already committed on this branch (`f96efbb`) — no further action.

## Formerly out-of-scope bug (fixed on this branch after all)

`/book/[eventDateId]/page.tsx` used to redirect unauthenticated users to `/login?next=...`, but the login flow only reads a `from` param — the post-login return to the booking page silently didn't happen. Originally deferred to a separate task, but that task's work was adopted onto this branch as commit `8081a78`: everything standardizes on a sanitized `?from=` (via `sanitizeRedirect`), covered by `tests/e2e/login-redirect.e2e.spec.ts`.
