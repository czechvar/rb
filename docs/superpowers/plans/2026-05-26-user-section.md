# User Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build self-registration with email verification, login, forgot/reset password, account profile/addresses/security editing, and a stub for orders — backed by Resend transactional email and Server Actions calling Payload's local API.

**Architecture:** Shape A from `docs/superpowers/specs/2026-05-26-user-section-design.md`. Forms submit to Next.js Server Actions that call `payload.login` / `payload.create` / `payload.forgotPassword` / `payload.resetPassword` / `payload.verifyEmail` / `payload.update` directly via the local API. Auth cookie is set with Next.js `cookies()`. Public auth pages live under route group `(auth)`; account pages under route group `(account)` with a shared sidebar layout. Email goes through `@payloadcms/email-resend` with an env-aware fallback identical to the R2 fallback already in `payload.config.ts`.

**Tech Stack:** Payload 3.84.1, Next.js 16.2.6, React 19.2.6 (`useActionState`, `useFormStatus`), TypeScript 5.7.3, Vitest 4.0.18, Playwright 1.58.2, Zod (new dep), `@payloadcms/email-resend` (new dep).

**Spec:** `docs/superpowers/specs/2026-05-26-user-section-design.md`.

**Conventions in this codebase you must follow:**
- Collections live in `src/collections/*.ts`, exported as a named const.
- Integration tests live in `tests/int/*.int.spec.ts`, use the shared `getTestPayload()` helper from `tests/helpers/payload.ts`, and call the local API (which bypasses access control — that's how it's used here).
- E2E tests live in `tests/e2e/*.e2e.spec.ts` (Playwright).
- `tests/helpers/seedUser.ts` already seeds `dev@payloadcms.com` for admin e2e.
- `.env.test` overrides `.env` via `vitest.setup.ts`.
- Existing tests already use the **real Postgres test database** (Neon, in `.env.test`) — no in-memory mock. Follow that.
- Field-level `access.update` is the right way to lock a field down to admins (see Section 1 of the spec — we use it on `role`).

**Commit cadence:** Each task ends with a commit. If a task has multiple sub-deliverables (e.g., schema + tests + types regen), commit at each natural breakpoint inside the task — frequent commits over one giant commit.

---

## Task 1: Dependencies + env scaffolding

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `.env.test`
- Modify: `.env` (local only — do not commit)

- [ ] **Step 1: Add dependencies**

Run:
```bash
pnpm add zod @payloadcms/email-resend@3.84.1
```

Verify versions in `package.json` — `@payloadcms/email-resend` must match the existing `payload` version (`3.84.1`).

- [ ] **Step 2: Update `.env.example`**

Append to `.env.example`:
```
# Public site URL — used in email templates and OAuth-style return URLs.
# Local dev: http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Resend transactional email. If RESEND_API_KEY is unset, Payload falls back
# to its console adapter (logs emails to stdout) — same defensive pattern as
# the R2 fallback above. Forgot-password and email verification will appear
# in the dev console instead of being sent.
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=onboarding@resend.dev
EMAIL_FROM_NAME=Rockbusters
EMAIL_REPLY_TO=
```

- [ ] **Step 3: Update `.env.test`**

Append to `.env.test` (overrides for vitest):
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Force the console/test email adapter (no Resend in tests).
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=test@example.com
EMAIL_FROM_NAME=Rockbusters Test
```

- [ ] **Step 4: Update local `.env`**

In your local `.env`, add the same five vars. Leave `RESEND_API_KEY` blank initially so emails go to the console.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example .env.test
git commit -m "chore(user-section): add zod + resend deps; env scaffolding"
```

---

## Task 2: `siteUrl()` helper

**Files:**
- Create: `src/lib/url.ts`
- Create: `tests/int/url.int.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/int/url.int.spec.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { siteUrl } from '../../src/lib/url'

describe('siteUrl', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = original
  })

  it('returns NEXT_PUBLIC_SITE_URL with no trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net/'
    expect(siteUrl()).toBe('https://rockbusters.net')
  })

  it('joins a relative path', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net'
    expect(siteUrl('/login')).toBe('https://rockbusters.net/login')
    expect(siteUrl('login')).toBe('https://rockbusters.net/login')
  })

  it('throws when NEXT_PUBLIC_SITE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(() => siteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/)
  })
})
```

- [ ] **Step 2: Run the test (expect fail)**

```bash
pnpm test:int -- url
```
Expected: fails — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/url.ts
export function siteUrl(pathname = ''): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL
  if (!base) throw new Error('NEXT_PUBLIC_SITE_URL is not set')
  const trimmed = base.replace(/\/+$/, '')
  if (!pathname) return trimmed
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${trimmed}${path}`
}
```

- [ ] **Step 4: Test passes**

```bash
pnpm test:int -- url
```
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/url.ts tests/int/url.int.spec.ts
git commit -m "feat(user-section): siteUrl() helper with NEXT_PUBLIC_SITE_URL"
```

---

## Task 3: `sanitizeRedirect()` helper

**Files:**
- Create: `src/lib/redirect.ts`
- Create: `tests/int/redirect.int.spec.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/int/redirect.int.spec.ts
import { describe, expect, it } from 'vitest'
import { sanitizeRedirect } from '../../src/lib/redirect'

describe('sanitizeRedirect', () => {
  it('returns clean internal paths unchanged', () => {
    expect(sanitizeRedirect('/account')).toBe('/account')
    expect(sanitizeRedirect('/account/profile?email-changed=1')).toBe(
      '/account/profile?email-changed=1',
    )
  })

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeRedirect('//evil.example')).toBeNull()
  })

  it('rejects absolute URLs', () => {
    expect(sanitizeRedirect('https://evil.example/x')).toBeNull()
    expect(sanitizeRedirect('http://evil.example')).toBeNull()
    expect(sanitizeRedirect('javascript:alert(1)')).toBeNull()
  })

  it('rejects backslashes and missing leading slash', () => {
    expect(sanitizeRedirect('account')).toBeNull()
    expect(sanitizeRedirect('/account\\..\\evil')).toBeNull()
  })

  it('rejects empty / nullish input', () => {
    expect(sanitizeRedirect('')).toBeNull()
    expect(sanitizeRedirect(null)).toBeNull()
    expect(sanitizeRedirect(undefined)).toBeNull()
  })
})
```

- [ ] **Step 2: Run (fails)**

```bash
pnpm test:int -- redirect
```

- [ ] **Step 3: Implement**

```ts
// src/lib/redirect.ts
/**
 * Returns the path if it is a safe, same-origin path (starts with a single
 * `/`, no protocol, no protocol-relative `//`, no backslashes). Else null.
 * Use in any flow that takes a post-action redirect from a query param.
 */
export function sanitizeRedirect(from: string | null | undefined): string | null {
  if (!from) return null
  if (typeof from !== 'string') return null
  if (!from.startsWith('/')) return null
  if (from.startsWith('//')) return null
  if (from.includes('\\')) return null
  if (from.includes(':')) return null
  return from
}
```

- [ ] **Step 4: Test passes**

```bash
pnpm test:int -- redirect
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/redirect.ts tests/int/redirect.int.spec.ts
git commit -m "feat(user-section): sanitizeRedirect() helper"
```

---

## Task 4: In-memory rate-limit helper

**Files:**
- Create: `src/lib/rate-limit.ts`
- Create: `tests/int/rate-limit.int.spec.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/int/rate-limit.int.spec.ts
import { describe, expect, it, beforeEach } from 'vitest'
import { rateLimit, __resetRateLimitForTests } from '../../src/lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    __resetRateLimitForTests()
  })

  it('allows up to limit requests, then blocks until window passes', () => {
    const opts = { key: 'forgot:1.2.3.4', limit: 3, windowMs: 1000 }
    expect(rateLimit(opts)).toEqual({ ok: true, remaining: 2 })
    expect(rateLimit(opts)).toEqual({ ok: true, remaining: 1 })
    expect(rateLimit(opts)).toEqual({ ok: true, remaining: 0 })
    expect(rateLimit(opts).ok).toBe(false)
  })

  it('isolates keys', () => {
    const a = { key: 'a', limit: 1, windowMs: 1000 }
    const b = { key: 'b', limit: 1, windowMs: 1000 }
    expect(rateLimit(a).ok).toBe(true)
    expect(rateLimit(b).ok).toBe(true)
    expect(rateLimit(a).ok).toBe(false)
  })
})
```

- [ ] **Step 2: Run (fails)**

```bash
pnpm test:int -- rate-limit
```

- [ ] **Step 3: Implement**

```ts
// src/lib/rate-limit.ts
/**
 * Best-effort in-memory rate limiter. Survives one serverless invocation
 * only — not a security boundary, just friction. Use Vercel KV / Redis
 * for production-grade. Tracked as future work in the spec.
 */

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0 }
  }
  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count }
}

/** Test-only — clears all buckets. Do not call from app code. */
export function __resetRateLimitForTests(): void {
  buckets.clear()
}
```

- [ ] **Step 4: Test passes**

```bash
pnpm test:int -- rate-limit
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/rate-limit.ts tests/int/rate-limit.int.spec.ts
git commit -m "feat(user-section): in-memory rate-limit helper"
```

---

## Task 5: Email templates (inline HTML strings)

**Files:**
- Create: `src/lib/email/templates.ts`
- Create: `tests/int/email-templates.int.spec.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/int/email-templates.int.spec.ts
import { describe, expect, it, beforeEach } from 'vitest'
import {
  verifyEmailTemplate,
  resetPasswordTemplate,
  confirmEmailChangeTemplate,
} from '../../src/lib/email/templates'

describe('email templates', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net'
  })

  it('verify email contains a link with the token and the recipient name', () => {
    const html = verifyEmailTemplate({ token: 'abc123', name: 'Honza' })
    expect(html).toContain('https://rockbusters.net/verify-email?token=abc123')
    expect(html).toContain('Honza')
  })

  it('reset password email links to /reset-password/<token>', () => {
    const html = resetPasswordTemplate({ token: 'tok99', name: 'Anna' })
    expect(html).toContain('https://rockbusters.net/reset-password/tok99')
  })

  it('confirm-email-change links to /account/profile/confirm-email', () => {
    const html = confirmEmailChangeTemplate({ token: 'tok42', name: 'Jan' })
    expect(html).toContain(
      'https://rockbusters.net/account/profile/confirm-email?token=tok42',
    )
  })

  it('templates HTML-escape user-controlled input', () => {
    const html = verifyEmailTemplate({ token: 'x', name: '<script>alert(1)</script>' })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
```

- [ ] **Step 2: Run (fails)**

```bash
pnpm test:int -- email-templates
```

- [ ] **Step 3: Implement**

```ts
// src/lib/email/templates.ts
import { siteUrl } from '../url'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface TemplateProps {
  token: string
  name: string
}

function shell(title: string, bodyHtml: string, cta: { label: string; href: string }): string {
  return `<!doctype html>
<html><body style="font-family:Lato,system-ui,sans-serif;background:#f7f5f3;margin:0;padding:24px;color:#1a1a1a;">
  <div style="max-width:520px;margin:0 auto;background:#fff;padding:32px;border-radius:8px;">
    <h1 style="font-family:'Libre Franklin',sans-serif;color:#c8102e;margin:0 0 16px;font-size:22px;">${escapeHtml(title)}</h1>
    ${bodyHtml}
    <p style="margin:24px 0;">
      <a href="${cta.href}" style="background:#c8102e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:4px;display:inline-block;font-weight:600;">${escapeHtml(cta.label)}</a>
    </p>
    <p style="font-size:13px;color:#666;">If the button doesn't work, copy this link into your browser:<br/><span style="word-break:break-all;">${cta.href}</span></p>
    <p style="font-size:13px;color:#666;margin-top:32px;">— Rockbusters</p>
  </div>
</body></html>`
}

export function verifyEmailTemplate({ token, name }: TemplateProps): string {
  const href = siteUrl(`/verify-email?token=${encodeURIComponent(token)}`)
  const body = `<p>Hi ${escapeHtml(name)},</p><p>Welcome to Rockbusters. Please confirm your email address to activate your account.</p>`
  return shell('Verify your email', body, { label: 'Verify email', href })
}

export function resetPasswordTemplate({ token, name }: TemplateProps): string {
  const href = siteUrl(`/reset-password/${encodeURIComponent(token)}`)
  const body = `<p>Hi ${escapeHtml(name)},</p><p>Someone requested a password reset for your Rockbusters account. If that was you, click below to set a new password. The link expires in 1 hour.</p>`
  return shell('Reset your password', body, { label: 'Reset password', href })
}

export function confirmEmailChangeTemplate({ token, name }: TemplateProps): string {
  const href = siteUrl(`/account/profile/confirm-email?token=${encodeURIComponent(token)}`)
  const body = `<p>Hi ${escapeHtml(name)},</p><p>You requested to change your Rockbusters sign-in email to this address. Click below to confirm. The link expires in 24 hours.</p>`
  return shell('Confirm your new email', body, { label: 'Confirm email', href })
}
```

- [ ] **Step 4: Test passes**

```bash
pnpm test:int -- email-templates
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/email/templates.ts tests/int/email-templates.int.spec.ts
git commit -m "feat(user-section): branded email templates (verify, reset, confirm-email-change)"
```

---

## Task 6: Email adapter — Resend with test/console fallback

The Payload `email` config slot expects an adapter conforming to `EmailAdapter`. We want three modes:
- **Test mode** (`NODE_ENV === 'test'`): an in-memory adapter pushing to a test inbox.
- **Resend** (`RESEND_API_KEY` set + not test): the real Resend adapter from `@payloadcms/email-resend`.
- **Console fallback** (default): logs sends to stdout — same defensive pattern as the R2 fallback.

**Files:**
- Create: `src/lib/email/adapter.ts`
- Create: `tests/int/email-adapter.int.spec.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/int/email-adapter.int.spec.ts
import { describe, expect, it, beforeEach } from 'vitest'
import { buildEmailAdapter, getTestInbox, clearTestInbox } from '../../src/lib/email/adapter'

describe('email adapter', () => {
  beforeEach(() => {
    clearTestInbox()
  })

  it('in test mode, captures sends into the test inbox', async () => {
    const adapter = buildEmailAdapter({
      apiKey: '',
      defaultFromAddress: 'noreply@test.example',
      defaultFromName: 'Test',
      mode: 'test',
    })
    // EmailAdapter is a factory: it returns the actual adapter with a sendEmail method.
    const built = adapter({} as never) // payload arg not used in test mode
    await built.sendEmail({
      to: 'a@example.com',
      subject: 'Hello',
      html: '<p>hi</p>',
    })
    const inbox = getTestInbox()
    expect(inbox).toHaveLength(1)
    expect(inbox[0]).toMatchObject({
      to: 'a@example.com',
      subject: 'Hello',
      html: '<p>hi</p>',
    })
  })
})
```

- [ ] **Step 2: Run (fails)**

```bash
pnpm test:int -- email-adapter
```

- [ ] **Step 3: Implement**

```ts
// src/lib/email/adapter.ts
import type { EmailAdapter } from 'payload'
import { resendAdapter } from '@payloadcms/email-resend'

export interface TestInboxEntry {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

const testInbox: TestInboxEntry[] = []

export function getTestInbox(): readonly TestInboxEntry[] {
  return testInbox
}

export function clearTestInbox(): void {
  testInbox.length = 0
}

export type EmailMode = 'test' | 'resend' | 'console'

export function resolveEmailMode(): EmailMode {
  if (process.env.NODE_ENV === 'test') return 'test'
  if (process.env.RESEND_API_KEY) return 'resend'
  return 'console'
}

export interface BuildAdapterOptions {
  apiKey: string
  defaultFromAddress: string
  defaultFromName: string
  mode?: EmailMode
}

export function buildEmailAdapter(opts: BuildAdapterOptions): EmailAdapter {
  const mode = opts.mode ?? resolveEmailMode()
  if (mode === 'resend') {
    return resendAdapter({
      apiKey: opts.apiKey,
      defaultFromAddress: opts.defaultFromAddress,
      defaultFromName: opts.defaultFromName,
    })
  }
  // test or console
  return () => ({
    name: mode === 'test' ? 'test' : 'console',
    defaultFromAddress: opts.defaultFromAddress,
    defaultFromName: opts.defaultFromName,
    sendEmail: async (message) => {
      const entry: TestInboxEntry = {
        to: message.to as string | string[],
        subject: message.subject ?? '',
        html: typeof message.html === 'string' ? message.html : undefined,
        text: typeof message.text === 'string' ? message.text : undefined,
        from: typeof message.from === 'string' ? message.from : undefined,
      }
      if (mode === 'test') {
        testInbox.push(entry)
      } else {
        console.log('[email:console]', JSON.stringify(entry, null, 2))
      }
      return { id: 'noop' }
    },
  })
}
```

**Note on the `@payloadcms/email-resend` API:** the factory accepts `apiKey`, `defaultFromAddress`, `defaultFromName`. If your installed version differs, fix the destructure here. (Verify with `pnpm why @payloadcms/email-resend` + check `node_modules/@payloadcms/email-resend/dist/index.d.ts`.)

- [ ] **Step 4: Test passes**

```bash
pnpm test:int -- email-adapter
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/email/adapter.ts tests/int/email-adapter.int.spec.ts
git commit -m "feat(user-section): email adapter with resend + console + test fallback"
```

---

## Task 7: Wire email adapter + Resend into payload.config.ts

**Files:**
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Modify payload.config.ts**

Add the import at the top with the other module imports:
```ts
import { buildEmailAdapter } from './lib/email/adapter'
```

Inside the `buildConfig({ ... })` call, add an `email` field (next to `secret`):
```ts
  email: buildEmailAdapter({
    apiKey: process.env.RESEND_API_KEY ?? '',
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS ?? 'noreply@rockbusters.net',
    defaultFromName: process.env.EMAIL_FROM_NAME ?? 'Rockbusters',
  }),
```

- [ ] **Step 2: Verify Payload boots**

```bash
pnpm test:int -- harness
```
Expected: existing `harness.int.spec.ts` still passes (Payload boots with the new email field).

- [ ] **Step 3: Commit**

```bash
git add src/payload.config.ts
git commit -m "feat(user-section): wire email adapter into payload.config"
```

---

## Task 8: Users collection — schema + access changes

This expands `Users.ts` with phone, hidden pending-email-change fields, auth.verify, auth.forgotPassword, branded templates, field-level access on `role`, opens self-registration, and extends the `addresses[]` array. Greenfield Postgres handles the migration automatically.

**Files:**
- Modify: `src/collections/Users.ts`
- Modify: `tests/int/users.int.spec.ts`
- Run: `pnpm generate:types`

- [ ] **Step 1: Write the failing tests**

Append to `tests/int/users.int.spec.ts`:

```ts
  it('requires phone and validates format', async () => {
    const payload = await getTestPayload()
    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: `p-${Date.now()}@example.com`,
          password: 'password123',
          name: 'No Phone',
        } as never,
      }),
    ).rejects.toThrow()

    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: `p-${Date.now()}@example.com`,
          password: 'password123',
          name: 'Bad Phone',
          phone: 'not-a-phone-AAAA',
        } as never,
      }),
    ).rejects.toThrow()

    const ok = await payload.create({
      collection: 'users',
      data: {
        email: `p-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Good Phone',
        phone: '+420 777 123 456',
      } as never,
    })
    expect(ok.phone).toBe('+420 777 123 456')
  })

  it('creates user with _verified false (auth.verify is on)', async () => {
    const payload = await getTestPayload()
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `v-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Verify Me',
        phone: '+420 777 000 000',
      } as never,
    })
    expect(user._verified).toBe(false)
  })

  it('stores an address with optional company block', async () => {
    const payload = await getTestPayload()
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `a-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Addr',
        phone: '+420 777 111 222',
        addresses: [
          {
            label: 'Work',
            isDefault: true,
            firstName: 'Jan',
            lastName: 'Antl',
            street: 'Prazska 1',
            city: 'Brno',
            postalCode: '60200',
            country: 'CZ',
            company: { companyName: 'Acme', ico: '12345678', dic: 'CZ12345678' },
          },
        ],
      } as never,
    })
    expect(user.addresses?.[0]?.company?.ico).toBe('12345678')
  })

  it('rejects bad ICO format', async () => {
    const payload = await getTestPayload()
    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: `ic-${Date.now()}@example.com`,
          password: 'password123',
          name: 'Bad Ico',
          phone: '+420 777 333 444',
          addresses: [
            {
              firstName: 'X',
              lastName: 'Y',
              street: 's',
              city: 'c',
              postalCode: 'p',
              country: 'CZ',
              company: { companyName: 'Acme', ico: '1234' },
            },
          ],
        } as never,
      }),
    ).rejects.toThrow()
  })
```

- [ ] **Step 2: Run (fails)**

```bash
pnpm test:int -- users
```

- [ ] **Step 3: Rewrite `src/collections/Users.ts`**

```ts
import type { CollectionConfig, Validate } from 'payload'
import { anyone, isAdmin, isAdminOrSelf } from '../access'
import {
  verifyEmailTemplate,
  resetPasswordTemplate,
} from '../lib/email/templates'

const phoneRegex = /^\+?[\d\s\-()]{6,20}$/
const icoRegex = /^\d{8}$/
const dicRegex = /^CZ\d{8,10}$/

const validatePhone: Validate<string | null | undefined, unknown, unknown, unknown> = (value) => {
  if (!value) return 'Phone is required'
  if (!phoneRegex.test(String(value))) return 'Invalid phone number'
  return true
}

const validateIco: Validate<string | null | undefined, unknown, unknown, unknown> = (value) => {
  if (!value) return true
  if (!icoRegex.test(String(value))) return 'IČO must be 8 digits'
  return true
}

const validateDic: Validate<string | null | undefined, unknown, unknown, unknown> = (value) => {
  if (!value) return true
  if (!dicRegex.test(String(value))) return 'DIČ must be in the form CZ followed by 8–10 digits'
  return true
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    verify: {
      generateEmailSubject: () => 'Welcome to Rockbusters — please verify your email',
      generateEmailHTML: ({ token, user }) =>
        verifyEmailTemplate({
          token: String(token),
          name: typeof (user as { name?: string }).name === 'string'
            ? (user as { name: string }).name
            : 'there',
        }),
    },
    forgotPassword: {
      generateEmailSubject: () => 'Reset your Rockbusters password',
      generateEmailHTML: ({ token, user }) =>
        resetPasswordTemplate({
          token: String(token),
          name: typeof (user as { name?: string })?.name === 'string'
            ? (user as { name: string }).name
            : 'there',
        }),
    },
    maxLoginAttempts: 5,
    lockTime: 600 * 1000,
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days
  },
  admin: { useAsTitle: 'email', group: 'Admin' },
  access: {
    read: isAdminOrSelf,
    create: anyone,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true, validate: validatePhone },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'customer',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Admin', value: 'admin' },
      ],
      access: { update: isAdmin },
    },
    {
      name: 'addresses',
      type: 'array',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'isDefault', type: 'checkbox', defaultValue: false },
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
        { name: 'street', type: 'text', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'postalCode', type: 'text', required: true },
        { name: 'country', type: 'text', required: true },
        {
          name: 'company',
          type: 'group',
          fields: [
            { name: 'companyName', type: 'text' },
            { name: 'ico', type: 'text', validate: validateIco },
            { name: 'dic', type: 'text', validate: validateDic },
          ],
        },
      ],
    },
    {
      name: 'pendingEmail',
      type: 'text',
      admin: { hidden: true },
      access: { read: isAdmin, update: isAdmin },
    },
    {
      name: 'pendingEmailToken',
      type: 'text',
      admin: { hidden: true },
      access: { read: isAdmin, update: isAdmin },
    },
    {
      name: 'pendingEmailExpiresAt',
      type: 'date',
      admin: { hidden: true },
      access: { read: isAdmin, update: isAdmin },
    },
    {
      name: 'lastVerifyEmailSentAt',
      type: 'date',
      admin: { hidden: true },
      access: { read: isAdmin, update: isAdmin },
    },
  ],
}
```

- [ ] **Step 4: Regenerate Payload types**

```bash
pnpm generate:types
```

- [ ] **Step 5: Update `tests/helpers/seedUser.ts`**

The test admin seed currently has no `phone`. Add it:
```ts
export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
  name: 'Dev Admin',
  phone: '+420 777 000 001',
}
```
And in the create call, include `phone: testUser.phone`. Also after `create`, the new admin must be verified — add this line right after the `create`:
```ts
  // Admins seeded for tests bypass the verification gate.
  const admin = await payload.find({
    collection: 'users',
    where: { email: { equals: testUser.email } },
    limit: 1,
  })
  if (admin.docs[0]) {
    await payload.update({
      collection: 'users',
      id: admin.docs[0].id,
      data: { _verified: true } as never,
    })
  }
```

- [ ] **Step 6: Run all tests**

```bash
pnpm test:int
```
Expected: green. If the existing users.int.spec.ts `'creates a customer with a role'` test fails because it omits `phone`, update it to include `phone: '+420 777 000 099'`.

- [ ] **Step 7: Commit**

```bash
git add src/collections/Users.ts src/payload-types.ts tests/int/users.int.spec.ts tests/helpers/seedUser.ts
git commit -m "feat(user-section): extend Users schema (phone, verify, addresses, B2B fields)"
```

---

## Task 9: Auth helper — `getCurrentUser()`

The single helper Server Components and Server Actions both call to read the current user.

**Files:**
- Create: `src/lib/auth.ts`

- [ ] **Step 1: Implement (no unit test — it's a thin wrapper over `payload.auth({ headers })`; covered by e2e + integration further on)**

```ts
// src/lib/auth.ts
import { headers as nextHeaders } from 'next/headers'
import { getPayloadClient } from './payload'
import type { User } from '../payload-types'

/**
 * Returns the currently logged-in user (or null) by reading the
 * payload-token cookie via Next.js request headers and asking Payload
 * to verify + look up the user. Use from Server Components or Server
 * Actions only — never from Client Components.
 */
export async function getCurrentUser(): Promise<User | null> {
  const payload = await getPayloadClient()
  const h = await nextHeaders()
  // payload.auth() accepts a Headers-like object; Next's ReadonlyHeaders works.
  const { user } = await payload.auth({ headers: h as unknown as Headers })
  return (user as User | null) ?? null
}

/**
 * Returns the user or throws — for routes that must be authenticated.
 * Middleware will normally have redirected to /login before this fires.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  return user
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat(user-section): getCurrentUser/requireUser helpers"
```

---

## Task 10: Middleware — cookie pre-filter for `(account)` and `(auth)` groups

**Files:**
- Create: `src/middleware.ts`

Note: Next.js middleware runs on the Edge runtime — no Payload local API there. We do a **shallow** JWT signature check using `jose` (already pulled in by Payload) or by trusting the cookie's presence. For simplicity (and to avoid pulling crypto into edge bundle), trust **presence + non-emptiness** here. Authoritative auth still happens in Server Components via `getCurrentUser()`.

- [ ] **Step 1: Implement**

```ts
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_PAGES = ['/login', '/register']

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('payload-token')?.value

  // /account/** requires a token. If missing, redirect to /login?from=<path>.
  if (pathname.startsWith('/account') && !token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname + (req.nextUrl.search ?? ''))
    return NextResponse.redirect(url)
  }

  // If signed in, bounce away from /login and /register.
  if (token && AUTH_PAGES.includes(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = '/account'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/login', '/register'],
}
```

- [ ] **Step 2: Verify dev server starts**

```bash
pnpm dev
```
Hit `http://localhost:3000/account` in a browser — expect redirect to `/login?from=/account`. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(user-section): middleware for (account) + (auth) cookie pre-filter"
```

---

## Task 11: Auth shell — `(auth)` route group layout + card component

**Files:**
- Create: `src/app/(frontend)/(auth)/layout.tsx`
- Create: `src/app/(frontend)/(auth)/auth-card.module.css`
- Create: `src/components/marketing/AuthCard.tsx` (or co-located if your design-system shell puts cards elsewhere — check `src/components/marketing/` for an existing card pattern and follow it)

- [ ] **Step 1: Look up the existing marketing shell**

```bash
ls src/components/marketing/
```
You should see the design-system primitives from `feat: design-system round 1`. Reuse them — do NOT introduce new tokens.

- [ ] **Step 2: Layout file**

```tsx
// src/app/(frontend)/(auth)/layout.tsx
import React from 'react'
import styles from './auth-card.module.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.shell}>
      <div className={styles.card}>{children}</div>
    </main>
  )
}
```

- [ ] **Step 3: Stylesheet**

```css
/* src/app/(frontend)/(auth)/auth-card.module.css */
.shell {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
  background: var(--color-surface, #f7f5f3);
}
.card {
  background: #fff;
  border-radius: 8px;
  padding: 32px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.06);
}
```

- [ ] **Step 4: Smoke test (manual)**

The layout will not render until at least one child page exists (Task 12 adds login). Skip running; rely on the next task to verify.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\(auth\)/layout.tsx src/app/\(frontend\)/\(auth\)/auth-card.module.css
git commit -m "feat(user-section): (auth) route-group layout + auth-card styles"
```

---

## Task 12: Shared form components

Reusable building blocks for every auth/account form. Three pieces: field + error display, banner, pending-state submit button.

**Files:**
- Create: `src/components/forms/FormField.tsx`
- Create: `src/components/forms/FormBanner.tsx`
- Create: `src/components/forms/SubmitButton.tsx`
- Create: `src/components/forms/forms.module.css`
- Create: `src/components/forms/action-result.ts`

- [ ] **Step 1: Implement `action-result.ts`** (the uniform return type used everywhere)

```ts
// src/components/forms/action-result.ts
export type ActionResult =
  | { ok: true; redirect?: string }
  | {
      ok: false
      formError?: string
      fieldErrors?: Record<string, string>
    }

export const INITIAL_ACTION_STATE: ActionResult = { ok: false }
```

- [ ] **Step 2: Implement `forms.module.css`**

```css
/* src/components/forms/forms.module.css */
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.label { font-weight: 600; font-size: 14px; color: #1a1a1a; }
.input {
  border: 1px solid #d0cfcd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 16px;
  font-family: inherit;
}
.input:focus { outline: 2px solid #c8102e; outline-offset: 1px; }
.error { color: #c8102e; font-size: 13px; }
.banner {
  padding: 12px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
}
.bannerError { background: #fde9ec; color: #8a0a1d; }
.bannerSuccess { background: #e6f4ea; color: #1e5631; }
.submit {
  width: 100%;
  background: #c8102e;
  color: #fff;
  border: 0;
  border-radius: 6px;
  padding: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
}
.submit:disabled { opacity: 0.6; cursor: progress; }
```

- [ ] **Step 3: Implement `FormField.tsx`**

```tsx
// src/components/forms/FormField.tsx
import React from 'react'
import styles from './forms.module.css'

interface Props {
  name: string
  label: string
  type?: string
  defaultValue?: string
  required?: boolean
  autoComplete?: string
  error?: string
  helpText?: string
}

export function FormField({
  name,
  label,
  type = 'text',
  defaultValue,
  required,
  autoComplete,
  error,
  helpText,
}: Props) {
  const id = `field-${name}`
  const describedBy: string[] = []
  if (helpText) describedBy.push(`${id}-help`)
  if (error) describedBy.push(`${id}-error`)
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        aria-describedby={describedBy.length ? describedBy.join(' ') : undefined}
        aria-invalid={error ? 'true' : undefined}
        className={styles.input}
      />
      {helpText && <span id={`${id}-help`} style={{ fontSize: 13, color: '#666' }}>{helpText}</span>}
      {error && <span id={`${id}-error`} role="alert" className={styles.error}>{error}</span>}
    </div>
  )
}
```

- [ ] **Step 4: Implement `FormBanner.tsx`**

```tsx
// src/components/forms/FormBanner.tsx
import React from 'react'
import styles from './forms.module.css'

export function FormBanner({
  kind,
  children,
}: {
  kind: 'error' | 'success'
  children: React.ReactNode
}) {
  return (
    <div
      className={`${styles.banner} ${kind === 'error' ? styles.bannerError : styles.bannerSuccess}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 5: Implement `SubmitButton.tsx`** (Client Component — uses `useFormStatus`)

```tsx
// src/components/forms/SubmitButton.tsx
'use client'
import React from 'react'
import { useFormStatus } from 'react-dom'
import styles from './forms.module.css'

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? 'Working…' : children}
    </button>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/forms/
git commit -m "feat(user-section): shared form components (FormField, FormBanner, SubmitButton, ActionResult)"
```

---

## Task 13: Login page + action

**Files:**
- Create: `src/app/(frontend)/(auth)/login/page.tsx`
- Create: `src/app/(frontend)/(auth)/login/actions.ts`
- Create: `src/app/(frontend)/(auth)/login/schema.ts`
- Create: `src/app/(frontend)/(auth)/login/LoginForm.tsx`

- [ ] **Step 1: Schema**

```ts
// src/app/(frontend)/(auth)/login/schema.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  from: z.string().optional(),
})
export type LoginInput = z.infer<typeof loginSchema>
```

- [ ] **Step 2: Action**

```ts
// src/app/(frontend)/(auth)/login/actions.ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { sanitizeRedirect } from '@/lib/redirect'
import type { ActionResult } from '@/components/forms/action-result'
import { loginSchema } from './schema'

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    from: formData.get('from') ?? undefined,
  })
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path[0] as string, i.message]),
      ),
    }
  }
  const { email, password, from } = parsed.data

  const payload = await getPayloadClient()
  try {
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })
    const token = result.token
    if (!token) {
      return { ok: false, formError: 'Login failed — no token returned.' }
    }
    const c = await cookies()
    c.set('payload-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Payload's verify-required and locked errors include identifying substrings.
    if (/verify/i.test(msg) && /(account|email)/i.test(msg)) {
      return { ok: false, formError: `verify_required:${email}` }
    }
    if (/locked/i.test(msg)) {
      return {
        ok: false,
        formError:
          'Account temporarily locked. Try again in ~10 minutes or reset your password.',
      }
    }
    return { ok: false, formError: 'Invalid email or password.' }
  }

  const target = sanitizeRedirect(from) ?? '/account'
  redirect(target)
}
```

- [ ] **Step 3: Form (Client Component)**

```tsx
// src/app/(frontend)/(auth)/login/LoginForm.tsx
'use client'
import React, { useActionState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { loginAction } from './actions'

interface Props {
  from?: string
  verifiedFlash?: boolean
  passwordResetFlash?: boolean
}

export function LoginForm({ from, verifiedFlash, passwordResetFlash }: Props) {
  const [state, formAction] = useActionState(loginAction, INITIAL_ACTION_STATE)
  const verifyRequired =
    !state.ok && state.formError?.startsWith('verify_required:')
  const verifyEmail = verifyRequired ? state.formError!.slice('verify_required:'.length) : null

  return (
    <>
      {verifiedFlash && (
        <FormBanner kind="success">Email verified. You can sign in now.</FormBanner>
      )}
      {passwordResetFlash && (
        <FormBanner kind="success">Password changed. You can sign in with your new password.</FormBanner>
      )}
      {verifyRequired ? (
        <FormBanner kind="error">
          Please verify your email address before signing in.{' '}
          <a href={`/verify-email/pending?email=${encodeURIComponent(verifyEmail!)}`}>
            Resend verification email
          </a>
        </FormBanner>
      ) : (
        !state.ok &&
        state.formError && <FormBanner kind="error">{state.formError}</FormBanner>
      )}
      <form action={formAction}>
        {from && <input type="hidden" name="from" value={from} />}
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={!state.ok ? state.fieldErrors?.email : undefined}
        />
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          error={!state.ok ? state.fieldErrors?.password : undefined}
        />
        <SubmitButton>Sign in</SubmitButton>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        <a href="/forgot-password">Forgot password?</a>
      </p>
      <p style={{ fontSize: 14 }}>
        No account? <a href="/register">Create one</a>
      </p>
    </>
  )
}
```

- [ ] **Step 4: Page**

```tsx
// src/app/(frontend)/(auth)/login/page.tsx
import React from 'react'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Sign in — Rockbusters' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; verified?: string; ['password-reset']?: string }>
}) {
  const sp = await searchParams
  return (
    <>
      <h1>Sign in</h1>
      <LoginForm
        from={sp.from}
        verifiedFlash={sp.verified === '1'}
        passwordResetFlash={sp['password-reset'] === '1'}
      />
    </>
  )
}
```

- [ ] **Step 5: Manual smoke (no e2e yet — that comes in Task 27)**

```bash
pnpm dev
```
Hit `http://localhost:3000/login`. Verify the form renders. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(frontend\)/\(auth\)/login/
git commit -m "feat(user-section): /login page + server action"
```

---

## Task 14: Logout action

**Files:**
- Create: `src/lib/actions/logout.ts`

- [ ] **Step 1: Implement**

```ts
// src/lib/actions/logout.ts
'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function logoutAction(): Promise<void> {
  const c = await cookies()
  c.delete('payload-token')
  redirect('/')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/logout.ts
git commit -m "feat(user-section): logout server action"
```

---

## Task 15: Register page + action + verify-pending page

**Files:**
- Create: `src/app/(frontend)/(auth)/register/page.tsx`
- Create: `src/app/(frontend)/(auth)/register/RegisterForm.tsx`
- Create: `src/app/(frontend)/(auth)/register/actions.ts`
- Create: `src/app/(frontend)/(auth)/register/schema.ts`
- Create: `src/app/(frontend)/(auth)/verify-email/pending/page.tsx`
- Create: `src/app/(frontend)/(auth)/verify-email/pending/ResendForm.tsx`
- Create: `src/app/(frontend)/(auth)/verify-email/actions.ts`
- Create: `src/app/(frontend)/(auth)/verify-email/schema.ts`

### Register

- [ ] **Step 1: Register schema**

```ts
// src/app/(frontend)/(auth)/register/schema.ts
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{6,20}$/, 'Enter a valid phone number.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})
```

- [ ] **Step 2: Register action**

```ts
// src/app/(frontend)/(auth)/register/actions.ts
'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import type { ActionResult } from '@/components/forms/action-result'
import { registerSchema } from './schema'

export async function registerAction(_p: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path[0] as string, i.message]),
      ),
    }
  }
  const { name, email, phone, password } = parsed.data

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit({ key: `register:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 })
  if (!rl.ok) {
    return { ok: false, formError: 'Too many attempts. Please try again in a few minutes.' }
  }

  const payload = await getPayloadClient()
  try {
    await payload.create({
      collection: 'users',
      data: { name, email, phone, password, role: 'customer' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/(already exists|already in use|duplicate)/i.test(msg) || /email/i.test(msg)) {
      return { ok: false, fieldErrors: { email: 'An account with this email already exists.' } }
    }
    return { ok: false, formError: 'Something went wrong. Please try again.' }
  }

  redirect(`/verify-email/pending?email=${encodeURIComponent(email)}`)
}
```

- [ ] **Step 3: Register form**

```tsx
// src/app/(frontend)/(auth)/register/RegisterForm.tsx
'use client'
import React, { useActionState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { registerAction } from './actions'

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, INITIAL_ACTION_STATE)
  return (
    <>
      {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      <form action={formAction}>
        <FormField name="name" label="Full name" required autoComplete="name"
          error={!state.ok ? state.fieldErrors?.name : undefined} />
        <FormField name="email" label="Email" type="email" required autoComplete="email"
          error={!state.ok ? state.fieldErrors?.email : undefined} />
        <FormField name="phone" label="Phone" required autoComplete="tel"
          error={!state.ok ? state.fieldErrors?.phone : undefined} />
        <FormField name="password" label="Password" type="password" required
          autoComplete="new-password" helpText="At least 8 characters."
          error={!state.ok ? state.fieldErrors?.password : undefined} />
        <SubmitButton>Create account</SubmitButton>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        Have an account? <a href="/login">Sign in</a>
      </p>
    </>
  )
}
```

- [ ] **Step 4: Register page**

```tsx
// src/app/(frontend)/(auth)/register/page.tsx
import React from 'react'
import { RegisterForm } from './RegisterForm'

export const metadata = { title: 'Create account — Rockbusters' }

export default function RegisterPage() {
  return (
    <>
      <h1>Create account</h1>
      <RegisterForm />
    </>
  )
}
```

### Verify-email-pending

- [ ] **Step 5: Verify-email schema (shared)**

```ts
// src/app/(frontend)/(auth)/verify-email/schema.ts
import { z } from 'zod'
export const resendSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})
```

- [ ] **Step 6: Verify-email actions** (resend-verification)

```ts
// src/app/(frontend)/(auth)/verify-email/actions.ts
'use server'

import { headers } from 'next/headers'
import crypto from 'crypto'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import { siteUrl } from '@/lib/url'
import { verifyEmailTemplate } from '@/lib/email/templates'
import type { ActionResult } from '@/components/forms/action-result'
import { resendSchema } from './schema'

const RESEND_THROTTLE_MS = 60 * 1000

export async function resendVerificationAction(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resendSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { ok: false, fieldErrors: { email: parsed.error.issues[0]?.message ?? 'Invalid email.' } }
  }
  const { email } = parsed.data

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit({ key: `resend:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 })
  if (!rl.ok) {
    return { ok: true } // silent success — no enumeration / no abuse signal
  }

  const payload = await getPayloadClient()
  const found = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    showHiddenFields: true,
  })
  const user = found.docs[0]
  if (!user || (user as { _verified?: boolean })._verified) {
    return { ok: true }
  }
  const last = (user as { lastVerifyEmailSentAt?: string }).lastVerifyEmailSentAt
  if (last && Date.now() - Date.parse(last) < RESEND_THROTTLE_MS) {
    return { ok: true }
  }

  const token = crypto.randomBytes(20).toString('hex')
  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      _verificationToken: token,
      lastVerifyEmailSentAt: new Date().toISOString(),
    } as never,
    overrideAccess: true,
  })
  await payload.sendEmail({
    to: email,
    subject: 'Welcome to Rockbusters — please verify your email',
    html: verifyEmailTemplate({
      token,
      name: (user as { name?: string }).name ?? 'there',
    }),
  })

  return { ok: true }
}
```

- [ ] **Step 7: ResendForm**

```tsx
// src/app/(frontend)/(auth)/verify-email/pending/ResendForm.tsx
'use client'
import React, { useActionState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { resendVerificationAction } from '../actions'

export function ResendForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, formAction] = useActionState(resendVerificationAction, INITIAL_ACTION_STATE)
  return (
    <>
      {state.ok && (
        <FormBanner kind="success">
          If an unverified account exists for that address, we re-sent the verification email. Check
          your inbox.
        </FormBanner>
      )}
      <form action={formAction}>
        <FormField
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          defaultValue={defaultEmail}
          error={!state.ok ? state.fieldErrors?.email : undefined}
        />
        <SubmitButton>Resend verification email</SubmitButton>
      </form>
    </>
  )
}
```

- [ ] **Step 8: Verify-pending page**

```tsx
// src/app/(frontend)/(auth)/verify-email/pending/page.tsx
import React from 'react'
import { ResendForm } from './ResendForm'

export const metadata = { title: 'Check your inbox — Rockbusters' }

export default async function VerifyPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  return (
    <>
      <h1>Check your inbox</h1>
      <p>
        We sent a verification link {email ? <>to <strong>{email}</strong></> : 'to your email address'}.
        Click it to activate your account.
      </p>
      <p>Didn't get the email? Check spam, or resend it:</p>
      <ResendForm defaultEmail={email} />
    </>
  )
}
```

- [ ] **Step 9: Commit**

```bash
git add src/app/\(frontend\)/\(auth\)/register/ src/app/\(frontend\)/\(auth\)/verify-email/
git commit -m "feat(user-section): /register + /verify-email/pending + resend-verification"
```

---

## Task 16: Verify-email landing route

**Files:**
- Create: `src/app/(frontend)/(auth)/verify-email/page.tsx`
- Create: `src/app/(frontend)/(auth)/verify-email/VerifyError.tsx`

- [ ] **Step 1: Page**

```tsx
// src/app/(frontend)/(auth)/verify-email/page.tsx
import React from 'react'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { ResendForm } from './pending/ResendForm'

export const metadata = { title: 'Verify email — Rockbusters' }

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token) {
    return (
      <>
        <h1>Verification link invalid</h1>
        <p>No verification token in the URL. Request a new email:</p>
        <ResendForm />
      </>
    )
  }
  const payload = await getPayloadClient()
  try {
    await payload.verifyEmail({ collection: 'users', token })
  } catch {
    return (
      <>
        <h1>This link has expired</h1>
        <p>Verification links expire after a short time. Request a new one:</p>
        <ResendForm />
      </>
    )
  }
  redirect('/login?verified=1')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(frontend\)/\(auth\)/verify-email/page.tsx
git commit -m "feat(user-section): /verify-email token-handling route"
```

---

## Task 17: Forgot password page + action

**Files:**
- Create: `src/app/(frontend)/(auth)/forgot-password/page.tsx`
- Create: `src/app/(frontend)/(auth)/forgot-password/ForgotForm.tsx`
- Create: `src/app/(frontend)/(auth)/forgot-password/actions.ts`
- Create: `src/app/(frontend)/(auth)/forgot-password/schema.ts`

- [ ] **Step 1: Schema**

```ts
// src/app/(frontend)/(auth)/forgot-password/schema.ts
import { z } from 'zod'
export const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})
```

- [ ] **Step 2: Action**

```ts
// src/app/(frontend)/(auth)/forgot-password/actions.ts
'use server'

import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import type { ActionResult } from '@/components/forms/action-result'
import { forgotSchema } from './schema'

export async function forgotPasswordAction(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { ok: false, fieldErrors: { email: parsed.error.issues[0]?.message ?? 'Invalid email.' } }
  }
  const { email } = parsed.data

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit({ key: `forgot:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 })
  if (!rl.ok) {
    return { ok: true } // silent — no enumeration
  }

  const payload = await getPayloadClient()
  try {
    await payload.forgotPassword({ collection: 'users', data: { email } })
  } catch {
    // swallow — we never reveal whether the account exists
  }
  return { ok: true }
}
```

- [ ] **Step 3: Form**

```tsx
// src/app/(frontend)/(auth)/forgot-password/ForgotForm.tsx
'use client'
import React, { useActionState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { forgotPasswordAction } from './actions'

export function ForgotForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, INITIAL_ACTION_STATE)
  if (state.ok) {
    return (
      <FormBanner kind="success">
        If an account exists for that address, we sent a reset link. Check your inbox.
      </FormBanner>
    )
  }
  return (
    <form action={formAction}>
      {state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      <FormField name="email" label="Email" type="email" required autoComplete="email"
        error={state.fieldErrors?.email} />
      <SubmitButton>Send reset link</SubmitButton>
    </form>
  )
}
```

- [ ] **Step 4: Page**

```tsx
// src/app/(frontend)/(auth)/forgot-password/page.tsx
import React from 'react'
import { ForgotForm } from './ForgotForm'

export const metadata = { title: 'Forgot password — Rockbusters' }

export default function ForgotPasswordPage() {
  return (
    <>
      <h1>Forgot password</h1>
      <p>Enter the email address on your account. We'll send you a link to reset your password.</p>
      <ForgotForm />
    </>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\(auth\)/forgot-password/
git commit -m "feat(user-section): /forgot-password page + action"
```

---

## Task 18: Reset password page + action

**Files:**
- Create: `src/app/(frontend)/(auth)/reset-password/[token]/page.tsx`
- Create: `src/app/(frontend)/(auth)/reset-password/[token]/ResetForm.tsx`
- Create: `src/app/(frontend)/(auth)/reset-password/[token]/actions.ts`
- Create: `src/app/(frontend)/(auth)/reset-password/[token]/schema.ts`

- [ ] **Step 1: Schema**

```ts
// src/app/(frontend)/(auth)/reset-password/[token]/schema.ts
import { z } from 'zod'

export const resetSchema = z
  .object({
    token: z.string().min(1, 'Missing token.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirm: z.string().min(1, 'Confirm your password.'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  })
```

- [ ] **Step 2: Action**

```ts
// src/app/(frontend)/(auth)/reset-password/[token]/actions.ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult } from '@/components/forms/action-result'
import { resetSchema } from './schema'

export async function resetPasswordAction(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path[0] as string, i.message]),
      ),
    }
  }
  const { token, password } = parsed.data

  const payload = await getPayloadClient()
  let issuedToken: string | undefined
  try {
    const result = await payload.resetPassword({
      collection: 'users',
      data: { token, password },
      overrideAccess: true,
    })
    issuedToken = result.token
  } catch {
    return {
      ok: false,
      formError: 'This reset link is invalid or has expired. Request a new one.',
    }
  }

  if (issuedToken) {
    const c = await cookies()
    c.set('payload-token', issuedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }
  redirect('/account?password-reset=1')
}
```

- [ ] **Step 3: Form**

```tsx
// src/app/(frontend)/(auth)/reset-password/[token]/ResetForm.tsx
'use client'
import React, { useActionState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { resetPasswordAction } from './actions'

export function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, INITIAL_ACTION_STATE)
  return (
    <>
      {!state.ok && state.formError && (
        <FormBanner kind="error">
          {state.formError} <a href="/forgot-password">Request a new link</a>.
        </FormBanner>
      )}
      <form action={formAction}>
        <input type="hidden" name="token" value={token} />
        <FormField name="password" label="New password" type="password" required
          autoComplete="new-password" helpText="At least 8 characters."
          error={!state.ok ? state.fieldErrors?.password : undefined} />
        <FormField name="confirm" label="Confirm new password" type="password" required
          autoComplete="new-password"
          error={!state.ok ? state.fieldErrors?.confirm : undefined} />
        <SubmitButton>Set new password</SubmitButton>
      </form>
    </>
  )
}
```

- [ ] **Step 4: Page**

```tsx
// src/app/(frontend)/(auth)/reset-password/[token]/page.tsx
import React from 'react'
import { ResetForm } from './ResetForm'

export const metadata = { title: 'Reset password — Rockbusters' }

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return (
    <>
      <h1>Set a new password</h1>
      <ResetForm token={token} />
    </>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\(auth\)/reset-password/
git commit -m "feat(user-section): /reset-password/[token] page + action"
```

---

## Task 19: Account shell — `(account)` layout + sidebar + overview

**Files:**
- Create: `src/app/(frontend)/(account)/layout.tsx`
- Create: `src/app/(frontend)/(account)/AccountSidebar.tsx`
- Create: `src/app/(frontend)/(account)/account.module.css`
- Create: `src/app/(frontend)/(account)/page.tsx`

- [ ] **Step 1: CSS**

```css
/* src/app/(frontend)/(account)/account.module.css */
.shell { display: grid; grid-template-columns: 240px 1fr; gap: 32px; padding: 32px 16px; max-width: 1080px; margin: 0 auto; }
@media (max-width: 900px) { .shell { grid-template-columns: 1fr; } }
.sidebar { display: flex; flex-direction: column; gap: 4px; }
.link {
  padding: 10px 12px; border-radius: 6px; color: #1a1a1a;
  text-decoration: none; font-weight: 500; font-size: 15px;
}
.link:hover { background: #f1efed; }
.linkActive { background: #fde9ec; color: #c8102e; }
.divider { height: 1px; background: #e4e2df; margin: 8px 0; }
.email { padding: 8px 12px; font-size: 13px; color: #666; }
.signout {
  background: none; border: 0; padding: 10px 12px;
  text-align: left; cursor: pointer; color: #c8102e; font-weight: 600; font-size: 15px;
}
.content { min-width: 0; }
```

- [ ] **Step 2: Sidebar (Client Component for `usePathname`)**

```tsx
// src/app/(frontend)/(account)/AccountSidebar.tsx
'use client'
import React from 'react'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/lib/actions/logout'
import styles from './account.module.css'

const ITEMS = [
  { href: '/account', label: 'Overview', exact: true },
  { href: '/account/profile', label: 'Profile' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/security', label: 'Security' },
  { href: '/account/orders', label: 'Orders' },
] as const

export function AccountSidebar({ email }: { email: string }) {
  const pathname = usePathname()
  return (
    <nav className={styles.sidebar}>
      {ITEMS.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href)
        return (
          <a key={it.href} href={it.href}
            className={`${styles.link} ${active ? styles.linkActive : ''}`}>
            {it.label}
          </a>
        )
      })}
      <div className={styles.divider} />
      <div className={styles.email}>Signed in as {email}</div>
      <form action={logoutAction}>
        <button type="submit" className={styles.signout}>Sign out</button>
      </form>
    </nav>
  )
}
```

- [ ] **Step 3: Layout**

```tsx
// src/app/(frontend)/(account)/layout.tsx
import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AccountSidebar } from './AccountSidebar'
import styles from './account.module.css'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return (
    <div className={styles.shell}>
      <AccountSidebar email={user.email} />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
```

- [ ] **Step 4: Overview page**

```tsx
// src/app/(frontend)/(account)/page.tsx
import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { FormBanner } from '@/components/forms/FormBanner'

export const metadata = { title: 'Account — Rockbusters' }

export default async function AccountOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ ['password-reset']?: string; ['email-changed']?: string }>
}) {
  const sp = await searchParams
  const user = (await getCurrentUser())!
  return (
    <>
      {sp['password-reset'] === '1' && (
        <FormBanner kind="success">Password changed. You're signed in.</FormBanner>
      )}
      {sp['email-changed'] === '1' && (
        <FormBanner kind="success">Your sign-in email has been updated.</FormBanner>
      )}
      <h1>Welcome back, {user.name.split(' ')[0]}</h1>
      <p>Manage your account using the menu on the left.</p>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 24 }}>
        <li>📭 You have <strong>0</strong> orders.</li>
        <li>📒 {user.addresses?.length ?? 0} address{(user.addresses?.length ?? 0) === 1 ? '' : 'es'} on file.</li>
      </ul>
    </>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\(account\)/
git commit -m "feat(user-section): /account shell + sidebar + overview"
```

---

## Task 20: Profile page (name + phone only)

The email-change path lands in Task 21 — keep this one simple first.

**Files:**
- Create: `src/app/(frontend)/(account)/profile/page.tsx`
- Create: `src/app/(frontend)/(account)/profile/ProfileForm.tsx`
- Create: `src/app/(frontend)/(account)/profile/actions.ts`
- Create: `src/app/(frontend)/(account)/profile/schema.ts`

- [ ] **Step 1: Schema** (covers name/phone now and the email-change path in Task 21)

```ts
// src/app/(frontend)/(account)/profile/schema.ts
import { z } from 'zod'

export const profileSchema = z
  .object({
    name: z.string().min(1, 'Name is required.'),
    phone: z.string().regex(/^\+?[\d\s\-()]{6,20}$/, 'Enter a valid phone number.'),
    email: z.string().email('Enter a valid email address.'),
    currentEmail: z.string().email(),
    currentPassword: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.email !== d.currentEmail) {
      if (!d.currentPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentPassword'],
          message: 'Confirm your current password to change your email.',
        })
      }
    }
  })
```

- [ ] **Step 2: Action — name + phone branch only (email branch returns "not implemented" for now)**

```ts
// src/app/(frontend)/(account)/profile/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult } from '@/components/forms/action-result'
import { profileSchema } from './schema'

export async function updateProfileAction(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    currentEmail: user.email,
    currentPassword: formData.get('currentPassword') ?? undefined,
  })
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
      ),
    }
  }
  const { name, phone, email } = parsed.data
  const payload = await getPayloadClient()

  if (email === user.email) {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { name, phone },
      overrideAccess: false,
      user,
    })
    revalidatePath('/account/profile')
    return { ok: true }
  }
  // Email-change branch is implemented in Task 21.
  return {
    ok: false,
    formError: 'Email change is being implemented — try again shortly.',
  }
}
```

- [ ] **Step 3: Form**

```tsx
// src/app/(frontend)/(account)/profile/ProfileForm.tsx
'use client'
import React, { useActionState, useState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import styles from '@/components/forms/forms.module.css'
import { updateProfileAction } from './actions'

interface Props {
  initial: { name: string; phone: string; email: string }
  pendingEmail?: string
}

export function ProfileForm({ initial, pendingEmail }: Props) {
  const [state, formAction] = useActionState(updateProfileAction, INITIAL_ACTION_STATE)
  const [email, setEmail] = useState(initial.email)
  const emailDirty = email !== initial.email
  return (
    <>
      {state.ok && <FormBanner kind="success">Profile updated.</FormBanner>}
      {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      {pendingEmail && (
        <FormBanner kind="success">
          We sent a confirmation link to <strong>{pendingEmail}</strong>. Until you click it, your
          sign-in email stays as <strong>{initial.email}</strong>.
        </FormBanner>
      )}
      <form action={formAction}>
        <FormField name="name" label="Name" defaultValue={initial.name} required
          error={!state.ok ? state.fieldErrors?.name : undefined} />
        <FormField name="phone" label="Phone" defaultValue={initial.phone} required
          error={!state.ok ? state.fieldErrors?.phone : undefined} />
        {/* Email field is controlled here so we can show currentPassword conditionally. */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="field-email">Email</label>
          <input
            id="field-email"
            name="email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            autoComplete="email"
            required
            aria-invalid={!state.ok && state.fieldErrors?.email ? 'true' : undefined}
            aria-describedby={!state.ok && state.fieldErrors?.email ? 'field-email-error' : undefined}
          />
          {!state.ok && state.fieldErrors?.email && (
            <span id="field-email-error" role="alert" className={styles.error}>
              {state.fieldErrors.email}
            </span>
          )}
        </div>
        {emailDirty && (
          <FormField name="currentPassword" label="Current password" type="password"
            autoComplete="current-password"
            helpText="Required to change your sign-in email."
            error={!state.ok ? state.fieldErrors?.currentPassword : undefined} />
        )}
        <SubmitButton>Save changes</SubmitButton>
      </form>
    </>
  )
}
```

- [ ] **Step 4: Page**

```tsx
// src/app/(frontend)/(account)/profile/page.tsx
import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { ProfileForm } from './ProfileForm'

export const metadata = { title: 'Profile — Rockbusters' }

export default async function ProfilePage() {
  const user = (await getCurrentUser())!
  return (
    <>
      <h1>Profile</h1>
      <ProfileForm
        initial={{ name: user.name, phone: user.phone, email: user.email }}
        pendingEmail={(user as { pendingEmail?: string }).pendingEmail}
      />
    </>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\(account\)/profile/
git commit -m "feat(user-section): /account/profile name+phone editing"
```

---

## Task 21: Profile — email-change pessimistic flow

Wires up the pending-email fields added in Task 8 and the `confirmEmailChangeTemplate` from Task 5.

**Files:**
- Modify: `src/app/(frontend)/(account)/profile/actions.ts`
- Create: `src/app/(frontend)/(account)/profile/confirm-email/page.tsx`

- [ ] **Step 1: Replace the email-change branch in `actions.ts`**

Replace the `// Email-change branch is implemented in Task 21.` block with:

```ts
  // Email-change branch (pessimistic — keep old email until new is confirmed).
  const currentPassword = parsed.data.currentPassword as string

  // Re-auth.
  try {
    await payload.login({
      collection: 'users',
      data: { email: user.email, password: currentPassword },
    })
  } catch {
    return { ok: false, fieldErrors: { currentPassword: 'Incorrect password.' } }
  }

  // Reject if the new email is already in use.
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })
  if (existing.docs[0] && existing.docs[0].id !== user.id) {
    return { ok: false, fieldErrors: { email: 'That email is already in use.' } }
  }

  const token = crypto.randomBytes(20).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      name,
      phone,
      pendingEmail: email,
      pendingEmailToken: token,
      pendingEmailExpiresAt: expiresAt,
    } as never,
    overrideAccess: true,
  })
  await payload.sendEmail({
    to: email,
    subject: 'Confirm your new Rockbusters email',
    html: confirmEmailChangeTemplate({ token, name: user.name }),
  })
  revalidatePath('/account/profile')
  return { ok: true }
```

Add imports to the top:
```ts
import crypto from 'crypto'
import { confirmEmailChangeTemplate } from '@/lib/email/templates'
```

Also add a new exported action:
```ts
export async function cancelPendingEmailChangeAction(): Promise<ActionResult> {
  const user = await requireUser()
  const payload = await getPayloadClient()
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { pendingEmail: null, pendingEmailToken: null, pendingEmailExpiresAt: null } as never,
    overrideAccess: true,
  })
  revalidatePath('/account/profile')
  return { ok: true }
}
```

- [ ] **Step 2: Wire cancel into the form**

Add to `ProfileForm.tsx`, near the pending-email banner:

```tsx
{pendingEmail && (
  <form action={cancelPendingEmailChangeAction} style={{ marginBottom: 16 }}>
    <button type="submit" style={{ background: 'none', border: 0, color: '#c8102e', cursor: 'pointer', textDecoration: 'underline' }}>
      Cancel pending email change
    </button>
  </form>
)}
```
Import:
```ts
import { cancelPendingEmailChangeAction } from './actions'
```

- [ ] **Step 3: Confirm-email route**

```tsx
// src/app/(frontend)/(account)/profile/confirm-email/page.tsx
import React from 'react'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export const metadata = { title: 'Confirm email — Rockbusters' }

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const user = await requireUser()
  if (!token) {
    return <p>Missing token in URL.</p>
  }
  const payload = await getPayloadClient()
  const found = await payload.find({
    collection: 'users',
    where: { pendingEmailToken: { equals: token } },
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
  })
  const target = found.docs[0] as
    | undefined
    | {
        id: string | number
        pendingEmail?: string | null
        pendingEmailExpiresAt?: string | null
      }
  if (!target) {
    return <p>This link is invalid.</p>
  }
  // Defense in depth: the looked-up user must match the logged-in user.
  if (String(target.id) !== String(user.id)) {
    return <p>This link does not belong to your account.</p>
  }
  if (
    !target.pendingEmail ||
    !target.pendingEmailExpiresAt ||
    Date.parse(target.pendingEmailExpiresAt) < Date.now()
  ) {
    return <p>This link has expired.</p>
  }
  await payload.update({
    collection: 'users',
    id: target.id,
    data: {
      email: target.pendingEmail,
      pendingEmail: null,
      pendingEmailToken: null,
      pendingEmailExpiresAt: null,
    } as never,
    overrideAccess: true,
  })
  redirect('/account/profile?email-changed=1')
}
```

- [ ] **Step 4: Manual smoke + commit**

Run dev, register a user, change their email, watch the confirmation email in the console (RESEND_API_KEY blank in dev), open the link.

```bash
git add src/app/\(frontend\)/\(account\)/profile/
git commit -m "feat(user-section): pessimistic email-change flow + confirm-email route"
```

---

## Task 22: Change-password page + action

**Files:**
- Create: `src/app/(frontend)/(account)/security/page.tsx`
- Create: `src/app/(frontend)/(account)/security/SecurityForm.tsx`
- Create: `src/app/(frontend)/(account)/security/actions.ts`
- Create: `src/app/(frontend)/(account)/security/schema.ts`

- [ ] **Step 1: Schema**

```ts
// src/app/(frontend)/(account)/security/schema.ts
import { z } from 'zod'

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password required.'),
    password: z.string().min(8, 'At least 8 characters.'),
    confirm: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  })
  .refine((d) => d.password !== d.currentPassword, {
    message: 'New password must differ from current.',
    path: ['password'],
  })
```

- [ ] **Step 2: Action**

```ts
// src/app/(frontend)/(account)/security/actions.ts
'use server'

import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult } from '@/components/forms/action-result'
import { changePasswordSchema } from './schema'

export async function changePasswordAction(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
      ),
    }
  }
  const payload = await getPayloadClient()
  try {
    await payload.login({
      collection: 'users',
      data: { email: user.email, password: parsed.data.currentPassword },
    })
  } catch {
    return { ok: false, fieldErrors: { currentPassword: 'Incorrect password.' } }
  }
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { password: parsed.data.password } as never,
    overrideAccess: false,
    user,
  })
  return { ok: true }
}
```

- [ ] **Step 3: Form**

```tsx
// src/app/(frontend)/(account)/security/SecurityForm.tsx
'use client'
import React, { useActionState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { changePasswordAction } from './actions'

export function SecurityForm() {
  const [state, formAction] = useActionState(changePasswordAction, INITIAL_ACTION_STATE)
  return (
    <>
      {state.ok && <FormBanner kind="success">Password updated.</FormBanner>}
      <form action={formAction}>
        <FormField name="currentPassword" label="Current password" type="password" required
          autoComplete="current-password"
          error={!state.ok ? state.fieldErrors?.currentPassword : undefined} />
        <FormField name="password" label="New password" type="password" required
          autoComplete="new-password" helpText="At least 8 characters."
          error={!state.ok ? state.fieldErrors?.password : undefined} />
        <FormField name="confirm" label="Confirm new password" type="password" required
          autoComplete="new-password"
          error={!state.ok ? state.fieldErrors?.confirm : undefined} />
        <SubmitButton>Change password</SubmitButton>
      </form>
    </>
  )
}
```

- [ ] **Step 4: Page**

```tsx
// src/app/(frontend)/(account)/security/page.tsx
import React from 'react'
import { SecurityForm } from './SecurityForm'

export const metadata = { title: 'Security — Rockbusters' }

export default function SecurityPage() {
  return (
    <>
      <h1>Security</h1>
      <p>Change the password you use to sign in.</p>
      <SecurityForm />
    </>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\(account\)/security/
git commit -m "feat(user-section): /account/security change-password"
```

---

## Task 23: Addresses — shared form + list page

**Files:**
- Create: `src/app/(frontend)/(account)/addresses/page.tsx`
- Create: `src/app/(frontend)/(account)/addresses/AddressCard.tsx`
- Create: `src/app/(frontend)/(account)/addresses/AddressForm.tsx`
- Create: `src/app/(frontend)/(account)/addresses/addresses.module.css`
- Create: `src/app/(frontend)/(account)/addresses/schema.ts`
- Create: `src/app/(frontend)/(account)/addresses/actions.ts`

- [ ] **Step 1: Schema**

```ts
// src/app/(frontend)/(account)/addresses/schema.ts
import { z } from 'zod'

export const addressSchema = z
  .object({
    label: z.string().optional(),
    isDefault: z
      .union([z.literal('on'), z.literal('off'), z.string().length(0)])
      .optional()
      .transform((v) => v === 'on'),
    firstName: z.string().min(1, 'First name required.'),
    lastName: z.string().min(1, 'Last name required.'),
    street: z.string().min(1, 'Street required.'),
    city: z.string().min(1, 'City required.'),
    postalCode: z.string().min(1, 'Postal code required.'),
    country: z.string().min(1, 'Country required.'),
    companyName: z.string().optional(),
    ico: z.string().optional(),
    dic: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.companyName) {
      if (d.ico && !/^\d{8}$/.test(d.ico)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ico'], message: 'IČO must be 8 digits.' })
      }
      if (d.dic && !/^CZ\d{8,10}$/.test(d.dic)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dic'], message: 'DIČ must be CZ + 8–10 digits.' })
      }
    }
  })
```

- [ ] **Step 2: Actions**

```ts
// src/app/(frontend)/(account)/addresses/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult } from '@/components/forms/action-result'
import { addressSchema } from './schema'
import type { User } from '@/payload-types'

type Address = NonNullable<User['addresses']>[number]

function parseForm(formData: FormData) {
  return addressSchema.safeParse({
    label: formData.get('label') ?? undefined,
    isDefault: formData.get('isDefault') ?? undefined,
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    street: formData.get('street'),
    city: formData.get('city'),
    postalCode: formData.get('postalCode'),
    country: formData.get('country'),
    companyName: formData.get('companyName') ?? undefined,
    ico: formData.get('ico') ?? undefined,
    dic: formData.get('dic') ?? undefined,
  })
}

function toAddressRow(data: ReturnType<typeof addressSchema.parse>): Address {
  const row: Address = {
    label: data.label || undefined,
    isDefault: data.isDefault,
    firstName: data.firstName,
    lastName: data.lastName,
    street: data.street,
    city: data.city,
    postalCode: data.postalCode,
    country: data.country,
  }
  if (data.companyName) {
    row.company = {
      companyName: data.companyName,
      ico: data.ico || undefined,
      dic: data.dic || undefined,
    }
  }
  return row
}

function enforceSingleDefault(rows: Address[], newDefaultIdx: number | null): Address[] {
  if (newDefaultIdx === null) return rows
  return rows.map((r, i) => ({ ...r, isDefault: i === newDefaultIdx }))
}

export async function addAddressAction(
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
    }
  }
  const payload = await getPayloadClient()
  const newRow = toAddressRow(parsed.data)
  let next: Address[] = [...(user.addresses ?? []), newRow]
  if (newRow.isDefault) {
    next = enforceSingleDefault(next, next.length - 1)
  } else if (next.length === 1) {
    // First address auto-default.
    next[0] = { ...next[0], isDefault: true }
  }
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { addresses: next },
    overrideAccess: false,
    user,
  })
  redirect('/account/addresses')
}

export async function updateAddressAction(
  idx: number,
  _p: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
    }
  }
  const payload = await getPayloadClient()
  const existing = user.addresses ?? []
  if (idx < 0 || idx >= existing.length) {
    return { ok: false, formError: 'Address not found.' }
  }
  const updatedRow = toAddressRow(parsed.data)
  let next: Address[] = existing.map((r, i) =>
    i === idx ? { ...updatedRow, id: r.id } : r,
  )
  if (updatedRow.isDefault) next = enforceSingleDefault(next, idx)
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { addresses: next },
    overrideAccess: false,
    user,
  })
  redirect('/account/addresses')
}

export async function deleteAddressAction(idx: number): Promise<void> {
  const user = await requireUser()
  const payload = await getPayloadClient()
  const existing = user.addresses ?? []
  if (idx < 0 || idx >= existing.length) return
  const next = existing.filter((_, i) => i !== idx)
  // If we deleted the default, promote the first remaining row.
  if (existing[idx].isDefault && next.length > 0) {
    next[0] = { ...next[0], isDefault: true }
  }
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { addresses: next },
    overrideAccess: false,
    user,
  })
  revalidatePath('/account/addresses')
}

export async function setDefaultAddressAction(idx: number): Promise<void> {
  const user = await requireUser()
  const payload = await getPayloadClient()
  const existing = user.addresses ?? []
  if (idx < 0 || idx >= existing.length) return
  const next = enforceSingleDefault(existing, idx)
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { addresses: next },
    overrideAccess: false,
    user,
  })
  revalidatePath('/account/addresses')
}
```

- [ ] **Step 3: CSS**

```css
/* src/app/(frontend)/(account)/addresses/addresses.module.css */
.list { display: grid; gap: 16px; }
.card { border: 1px solid #e4e2df; border-radius: 8px; padding: 16px; background: #fff; }
.cardHeader { display: flex; justify-content: space-between; align-items: baseline; }
.badge { background: #fde9ec; color: #c8102e; font-size: 12px; padding: 2px 8px; border-radius: 999px; }
.actions { display: flex; gap: 8px; margin-top: 12px; }
.action {
  background: none; border: 1px solid #d0cfcd; border-radius: 6px;
  padding: 6px 10px; cursor: pointer; font-size: 14px;
}
.action:hover { background: #f7f5f3; }
.danger { color: #c8102e; border-color: #f3c4cb; }
.empty { padding: 32px; text-align: center; border: 1px dashed #d0cfcd; border-radius: 8px; }
.toggle { margin: 16px 0 8px; display: flex; gap: 8px; align-items: center; }
.companyBox { border-top: 1px solid #e4e2df; padding-top: 16px; margin-top: 16px; }
```

- [ ] **Step 4: AddressCard**

```tsx
// src/app/(frontend)/(account)/addresses/AddressCard.tsx
'use client'
import React from 'react'
import { deleteAddressAction, setDefaultAddressAction } from './actions'
import styles from './addresses.module.css'
import type { User } from '@/payload-types'

type Address = NonNullable<User['addresses']>[number]

export function AddressCard({ idx, address }: { idx: number; address: Address }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <strong>{address.label ?? `Address ${idx + 1}`}</strong>
        {address.isDefault && <span className={styles.badge}>Default</span>}
      </div>
      <div style={{ marginTop: 8, color: '#1a1a1a', lineHeight: 1.5 }}>
        {address.firstName} {address.lastName}
        <br />
        {address.street}
        <br />
        {address.postalCode} {address.city}, {address.country}
        {address.company?.companyName && (
          <>
            <br />
            <em style={{ color: '#666' }}>
              {address.company.companyName}
              {address.company.ico && ` · IČO ${address.company.ico}`}
              {address.company.dic && ` · DIČ ${address.company.dic}`}
            </em>
          </>
        )}
      </div>
      <div className={styles.actions}>
        <a className={styles.action} href={`/account/addresses/${idx}/edit`}>Edit</a>
        {!address.isDefault && (
          <form action={async () => { 'use server'; await setDefaultAddressAction(idx) }}>
            <button type="submit" className={styles.action}>Set as default</button>
          </form>
        )}
        <form action={async () => { 'use server'; await deleteAddressAction(idx) }}>
          <button type="submit" className={`${styles.action} ${styles.danger}`}>Delete</button>
        </form>
      </div>
    </div>
  )
}
```

**Note:** Inline server actions inside Client Component `<form action>` props need to be defined at module scope, not inline-in-JSX. Refactor: pull them into action wrappers. The cleanest pattern is to make `AddressCard` a Server Component (no `'use client'`) and use the imported actions directly:

Replace the `'use client'` directive plus inline `'use server'` blocks with the simpler Server Component version:

```tsx
// src/app/(frontend)/(account)/addresses/AddressCard.tsx
import React from 'react'
import { deleteAddressAction, setDefaultAddressAction } from './actions'
import styles from './addresses.module.css'
import type { User } from '@/payload-types'

type Address = NonNullable<User['addresses']>[number]

async function setDefault(idx: number) {
  'use server'
  await setDefaultAddressAction(idx)
}
async function del(idx: number) {
  'use server'
  await deleteAddressAction(idx)
}

export function AddressCard({ idx, address }: { idx: number; address: Address }) {
  const setDefaultBound = setDefault.bind(null, idx)
  const delBound = del.bind(null, idx)
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <strong>{address.label ?? `Address ${idx + 1}`}</strong>
        {address.isDefault && <span className={styles.badge}>Default</span>}
      </div>
      <div style={{ marginTop: 8, lineHeight: 1.5 }}>
        {address.firstName} {address.lastName}
        <br />
        {address.street}
        <br />
        {address.postalCode} {address.city}, {address.country}
        {address.company?.companyName && (
          <>
            <br />
            <em style={{ color: '#666' }}>
              {address.company.companyName}
              {address.company.ico && ` · IČO ${address.company.ico}`}
              {address.company.dic && ` · DIČ ${address.company.dic}`}
            </em>
          </>
        )}
      </div>
      <div className={styles.actions}>
        <a className={styles.action} href={`/account/addresses/${idx}/edit`}>Edit</a>
        {!address.isDefault && (
          <form action={setDefaultBound}>
            <button type="submit" className={styles.action}>Set as default</button>
          </form>
        )}
        <form action={delBound}>
          <button type="submit" className={`${styles.action} ${styles.danger}`}>Delete</button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: List page**

```tsx
// src/app/(frontend)/(account)/addresses/page.tsx
import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { AddressCard } from './AddressCard'
import styles from './addresses.module.css'

export const metadata = { title: 'Addresses — Rockbusters' }

export default async function AddressesPage() {
  const user = (await getCurrentUser())!
  const addresses = user.addresses ?? []
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1>Addresses</h1>
        <a className={styles.action} href="/account/addresses/new">Add address</a>
      </div>
      {addresses.length === 0 ? (
        <div className={styles.empty}>
          <p>You haven't added an address yet.</p>
          <p><a href="/account/addresses/new">Add your first address →</a></p>
        </div>
      ) : (
        <div className={styles.list}>
          {addresses.map((a, idx) => (
            <AddressCard key={a.id ?? idx} idx={idx} address={a} />
          ))}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(frontend\)/\(account\)/addresses/
git commit -m "feat(user-section): /account/addresses list + delete + set-default"
```

---

## Task 24: Address add + edit pages with shared form

**Files:**
- Modify: `src/app/(frontend)/(account)/addresses/AddressForm.tsx` (create now)
- Create: `src/app/(frontend)/(account)/addresses/new/page.tsx`
- Create: `src/app/(frontend)/(account)/addresses/[idx]/edit/page.tsx`

- [ ] **Step 1: AddressForm (shared between new + edit)**

```tsx
// src/app/(frontend)/(account)/addresses/AddressForm.tsx
'use client'
import React, { useActionState, useState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE, type ActionResult } from '@/components/forms/action-result'
import styles from './addresses.module.css'
import type { User } from '@/payload-types'

type Address = NonNullable<User['addresses']>[number]

interface Props {
  initial?: Address
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>
  submitLabel: string
}

export function AddressForm({ initial, action, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE)
  const [showCompany, setShowCompany] = useState(!!initial?.company?.companyName)
  return (
    <>
      {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      <form action={formAction}>
        <FormField name="label" label="Label (optional)" defaultValue={initial?.label ?? ''}
          helpText="Home, Work, Mom's place…" />
        <FormField name="firstName" label="First name" required defaultValue={initial?.firstName}
          error={!state.ok ? state.fieldErrors?.firstName : undefined} />
        <FormField name="lastName" label="Last name" required defaultValue={initial?.lastName}
          error={!state.ok ? state.fieldErrors?.lastName : undefined} />
        <FormField name="street" label="Street" required defaultValue={initial?.street}
          error={!state.ok ? state.fieldErrors?.street : undefined} />
        <FormField name="city" label="City" required defaultValue={initial?.city}
          error={!state.ok ? state.fieldErrors?.city : undefined} />
        <FormField name="postalCode" label="Postal code" required defaultValue={initial?.postalCode}
          error={!state.ok ? state.fieldErrors?.postalCode : undefined} />
        <FormField name="country" label="Country" required defaultValue={initial?.country ?? 'CZ'}
          error={!state.ok ? state.fieldErrors?.country : undefined} />
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showCompany}
            onChange={(e) => setShowCompany(e.currentTarget.checked)}
          />
          Use as a company invoice address
        </label>
        {showCompany && (
          <div className={styles.companyBox}>
            <FormField name="companyName" label="Company name" defaultValue={initial?.company?.companyName ?? ''}
              error={!state.ok ? state.fieldErrors?.companyName : undefined} />
            <FormField name="ico" label="IČO" defaultValue={initial?.company?.ico ?? ''}
              error={!state.ok ? state.fieldErrors?.ico : undefined} />
            <FormField name="dic" label="DIČ (optional)" defaultValue={initial?.company?.dic ?? ''}
              error={!state.ok ? state.fieldErrors?.dic : undefined} />
          </div>
        )}
        {!showCompany && (
          <>
            <input type="hidden" name="companyName" value="" />
            <input type="hidden" name="ico" value="" />
            <input type="hidden" name="dic" value="" />
          </>
        )}
        <label className={styles.toggle}>
          <input type="checkbox" name="isDefault" defaultChecked={initial?.isDefault ?? false} />
          Set as default address
        </label>
        <SubmitButton>{submitLabel}</SubmitButton>
      </form>
    </>
  )
}
```

- [ ] **Step 2: New page**

```tsx
// src/app/(frontend)/(account)/addresses/new/page.tsx
import React from 'react'
import { AddressForm } from '../AddressForm'
import { addAddressAction } from '../actions'

export const metadata = { title: 'Add address — Rockbusters' }

export default function AddAddressPage() {
  return (
    <>
      <h1>Add address</h1>
      <AddressForm action={addAddressAction} submitLabel="Add address" />
    </>
  )
}
```

- [ ] **Step 3: Edit page**

```tsx
// src/app/(frontend)/(account)/addresses/[idx]/edit/page.tsx
import React from 'react'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AddressForm } from '../../AddressForm'
import { updateAddressAction } from '../../actions'
import type { ActionResult } from '@/components/forms/action-result'

export const metadata = { title: 'Edit address — Rockbusters' }

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ idx: string }>
}) {
  const { idx: idxRaw } = await params
  const idx = Number(idxRaw)
  if (!Number.isInteger(idx) || idx < 0) notFound()
  const user = (await getCurrentUser())!
  const address = (user.addresses ?? [])[idx]
  if (!address) notFound()

  async function action(prev: ActionResult, formData: FormData): Promise<ActionResult> {
    'use server'
    return updateAddressAction(idx, prev, formData)
  }

  return (
    <>
      <h1>Edit address</h1>
      <AddressForm initial={address} action={action} submitLabel="Save changes" />
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\(account\)/addresses/
git commit -m "feat(user-section): /account/addresses add + edit"
```

---

## Task 25: Orders stub page

**Files:**
- Create: `src/app/(frontend)/(account)/orders/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/(frontend)/(account)/orders/page.tsx
import React from 'react'

export const metadata = { title: 'Orders — Rockbusters' }

export default function OrdersPage() {
  return (
    <>
      <h1>Your orders</h1>
      <div
        style={{
          padding: 48,
          textAlign: 'center',
          border: '1px dashed #d0cfcd',
          borderRadius: 8,
          color: '#666',
        }}
      >
        <p style={{ fontSize: 18 }}>You haven't booked any trips yet.</p>
        <p>
          <a href="/programs">Browse trips →</a>
        </p>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(frontend\)/\(account\)/orders/
git commit -m "feat(user-section): /account/orders stub"
```

---

## Task 26: Integration tests — auth flows end-to-end

**Files:**
- Create: `tests/int/auth-flows.int.spec.ts`

This proves the full chain works against the real test database + the test email adapter.

- [ ] **Step 1: Write the integration test**

```ts
// tests/int/auth-flows.int.spec.ts
import { describe, expect, it, beforeEach } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import { clearTestInbox, getTestInbox } from '../../src/lib/email/adapter'

describe('auth flows (local API + test email adapter)', () => {
  beforeEach(() => {
    clearTestInbox()
  })

  it('registration produces an unverified user and sends a verify email', async () => {
    const payload = await getTestPayload()
    const email = `reg-${Date.now()}@example.com`
    await payload.create({
      collection: 'users',
      data: {
        name: 'Reg User',
        email,
        phone: '+420 777 100 200',
        password: 'password123',
      } as never,
    })
    const verifySends = getTestInbox().filter((m) => m.to === email)
    expect(verifySends.length).toBe(1)
    expect(verifySends[0].subject).toMatch(/verify your email/i)
  })

  it('forgot-password → reset-password succeeds; second use of same token fails', async () => {
    const payload = await getTestPayload()
    const email = `fp-${Date.now()}@example.com`
    const created = await payload.create({
      collection: 'users',
      data: {
        name: 'FP User',
        email,
        phone: '+420 777 200 300',
        password: 'oldpassword',
      } as never,
    })
    await payload.update({
      collection: 'users',
      id: created.id,
      data: { _verified: true } as never,
    })

    clearTestInbox()
    const token = await payload.forgotPassword({
      collection: 'users',
      data: { email },
    })
    expect(typeof token).toBe('string')
    const resetSends = getTestInbox().filter((m) => m.to === email)
    expect(resetSends.length).toBe(1)
    expect(resetSends[0].subject).toMatch(/reset your.*password/i)

    await payload.resetPassword({
      collection: 'users',
      data: { token: token as string, password: 'newpassword123' },
      overrideAccess: true,
    })

    // Second use of the same token must fail.
    await expect(
      payload.resetPassword({
        collection: 'users',
        data: { token: token as string, password: 'evenNewer' },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('field access: a customer cannot promote themselves to admin', async () => {
    const payload = await getTestPayload()
    const email = `r-${Date.now()}@example.com`
    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Promoter',
        email,
        phone: '+420 777 400 500',
        password: 'password123',
      } as never,
    })
    // Passing { user } simulates the customer acting as themselves.
    await expect(
      payload.update({
        collection: 'users',
        id: user.id,
        data: { role: 'admin' } as never,
        overrideAccess: false,
        user: user as never,
      }),
    ).rejects.toThrow()
  })

  it('default-address exclusivity: setting isDefault on a second row clears the first', async () => {
    const payload = await getTestPayload()
    const email = `dd-${Date.now()}@example.com`
    let user = await payload.create({
      collection: 'users',
      data: {
        name: 'Addr',
        email,
        phone: '+420 777 500 600',
        password: 'password123',
        addresses: [
          {
            isDefault: true,
            firstName: 'A',
            lastName: 'A',
            street: 's1',
            city: 'c',
            postalCode: '1',
            country: 'CZ',
          },
        ],
      } as never,
    })
    expect(user.addresses?.[0].isDefault).toBe(true)
    // Simulate the action: when adding row 2 with isDefault true, the action
    // is responsible for clearing row 1. Replicate that here.
    user = await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        addresses: [
          { ...user.addresses![0], isDefault: false },
          {
            isDefault: true,
            firstName: 'B',
            lastName: 'B',
            street: 's2',
            city: 'c',
            postalCode: '2',
            country: 'CZ',
          },
        ],
      } as never,
    })
    expect(user.addresses?.[0].isDefault).toBe(false)
    expect(user.addresses?.[1].isDefault).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests**

```bash
pnpm test:int -- auth-flows
```
Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add tests/int/auth-flows.int.spec.ts
git commit -m "test(user-section): auth-flow integration tests"
```

---

## Task 27: Playwright smoke tests

**Files:**
- Create: `tests/e2e/auth.e2e.spec.ts`

- [ ] **Step 1: Implement**

```ts
// tests/e2e/auth.e2e.spec.ts
import { expect, test } from '@playwright/test'

test.describe('user section smoke', () => {
  test('/login renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('/register renders all required fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible()
    for (const label of ['Full name', 'Email', 'Phone', 'Password']) {
      await expect(page.getByLabel(label)).toBeVisible()
    }
  })

  test('/forgot-password submit shows the no-enumeration success banner', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill('nobody-xyz@example.com')
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(
      page.getByText(/if an account exists for that address/i),
    ).toBeVisible()
  })

  test('/account redirects to /login when not signed in', async ({ page }) => {
    await page.goto('/account')
    await expect(page).toHaveURL(/\/login(\?.*)?$/)
  })

  test('register → verify-pending', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`
    await page.goto('/register')
    await page.getByLabel('Full name').fill('E2E User')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Phone').fill('+420 777 100 200')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/verify-email\/pending/)
    await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
  })
})
```

- [ ] **Step 2: Run**

```bash
pnpm test:e2e -- auth
```
Expected: all 5 pass. (Existing e2e tests boot the dev server — see `playwright.config.ts`.)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/auth.e2e.spec.ts
git commit -m "test(user-section): playwright smoke for auth + account redirect"
```

---

## Task 28: Documentation updates

**Files:**
- Modify: `CLAUDE.md`
- Modify: `.env.example` (final pass — make sure all vars are documented in the same place)

- [ ] **Step 1: Update CLAUDE.md deployment section**

In `CLAUDE.md` under "## Deployment", under "Required environment variables", append:
```
- `NEXT_PUBLIC_SITE_URL` — public base URL used in email templates (e.g. `https://rockbusters.net`)
- `RESEND_API_KEY` — Resend transactional-email API key. If unset, Payload falls back to its console adapter (logs emails) — same defensive pattern as the R2 fallback.
- `EMAIL_FROM_ADDRESS` — sender address (e.g. `hello@rockbusters.net` in prod, `onboarding@resend.dev` in dev). Domain must be verified in Resend for prod.
- `EMAIL_FROM_NAME` — sender display name (e.g. `Rockbusters`).
- `EMAIL_REPLY_TO` — optional reply-to address.
```

Also append a new top-level section before "## Code so far":
```
## User section

Self-registration, login, forgot/reset password, account profile/addresses/security, and an /account/orders stub are live (see `docs/superpowers/specs/2026-05-26-user-section-design.md` and `docs/superpowers/plans/2026-05-26-user-section.md`).
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md .env.example
git commit -m "docs(user-section): document env vars + user section in CLAUDE.md"
```

---

## Final verification

- [ ] **Run the full test suite**

```bash
pnpm test
```
Expected: all int + e2e tests pass.

- [ ] **Manual UI walkthrough**

```bash
pnpm dev
```
1. Visit `/register`. Sign up. Land on `/verify-email/pending`. See the verify email in the console (RESEND_API_KEY blank locally).
2. Copy the verify URL from the console. Visit it. Land on `/login?verified=1` with a green banner.
3. Log in. Land on `/account`.
4. Visit `/account/profile`. Change name and phone. Save. See success banner.
5. Visit `/account/security`. Change password (wrong current → error; right current → success).
6. Log out via the sidebar. Try `/account` — redirected to `/login`.
7. Use `/forgot-password`. Open the reset link in the console. Land on `/account` with the password-reset banner.
8. Visit `/account/addresses`. Add an address with company fields. Edit. Set as default. Delete.

If anything is broken, fix in a follow-up commit before declaring the plan done.

---

## Out of scope (documented in spec for future plans)

- Booking process: cart, checkout, Order/OrderItem/Participant, capacity + holds, discount/referral codes, payments. Separate spec.
- Order history rendering. Lands with the booking spec — this plan only ships the `/account/orders` stub.
- React Email templates (we have two emails; YAGNI).
- "Have I been pwned" password check.
- Other-session invalidation on password change (Payload uses stateless JWTs; needs a deny-list).
- Vercel KV-backed rate limiting (current limiter is in-memory).
- GDPR account deletion / data export.
