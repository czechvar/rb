# Account Section Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every `/account/*` page (except the already-finished `checkouts/`) look like the checkout process, carrying over Michal's 17-09 feedback.

**Architecture:** Account pages reuse `src/components/checkout/checkout.module.css` and the global `btn-primary` / `btn-ghost` classes directly, exactly as `account/checkouts/*` already does. The shared form primitives gain opt-in class overrides whose default output is byte-identical, so auth, contact and `/book` do not move. A new `AccountPage` frame gives every tab the reservation page's eyebrow + H1 header and padding.

**Tech Stack:** Next.js App Router (server components + server actions), React 19, CSS modules, Payload local API, Vitest (`renderToStaticMarkup`).

**Spec:** `docs/superpowers/specs/2026-09-18-account-section-styling-design.md`

---

## Ground rules for every task

- Run unit tests with: `pnpm exec vitest run --config tests/unit/vitest.config.mts <file>`
- That config has an explicit include list. Task 1 adds `tests/unit/account*.test.ts(x)`; every new test file must match that pattern.
- In the unit environment a CSS-module import is a proxy: `checkout.anything` returns `_anything_<hash>` **even when the class does not exist**. Tests therefore cannot catch a misspelt class. Only use class names that exist in the stylesheet you import — check with `grep -n '^\.name\b' <file>`.
- Alias: `checkout` = `@/components/checkout/checkout.module.css`, `styles` = the account stylesheet.
- No hex colours, no `border-radius`, no inline `style={{…}}` in anything you touch under `src/app/(frontend)/account/`.
- Keep `<a href>` where the current code uses `<a href>` and `Link` where it uses `Link`. The plain anchors force a fresh server render after address and profile mutations.
- Tasks 3–6 touch disjoint files and may run in parallel. When they do, workers **do not run git**; the orchestrator commits. `account.module.css` is owned by Task 2 — Tasks 3–6 must not edit it.

## File map

| File | Responsibility | Task |
| --- | --- | --- |
| `src/components/forms/FormField.tsx` | + `classNames` override | 1 |
| `src/components/forms/SubmitButton.tsx` | + `className` override | 1 |
| `src/app/(frontend)/account/form-controls.tsx` | `AccountField`, `AccountSubmit` | 1 |
| `tests/unit/vitest.config.mts` | include `account*` tests | 1 |
| `src/app/(frontend)/account/AccountPage.tsx` | eyebrow + H1 frame | 2 |
| `src/components/checkout/ReservationHeader.tsx` | + `eyebrow`, `referenceLabel` | 2 |
| `src/app/(frontend)/account/account.module.css` | all account-only rules | 2 |
| `account/profile/*`, `account/security/*`, `account/profile/confirm-email/page.tsx` | restyle | 3 |
| `account/addresses/*` (+ delete `addresses.module.css`) | restyle | 4 |
| `account/orders/presentation.ts`, `orders/page.tsx`, `orders/[id]/page.tsx`, `tests/e2e/booking.e2e.spec.ts` | restyle | 5 |
| `account/page.tsx` | Overview with real counts | 6 |

---

### Task 1: Opt-in class overrides on the form primitives

**Files:**
- Modify: `src/components/forms/FormField.tsx`
- Modify: `src/components/forms/SubmitButton.tsx`
- Create: `src/app/(frontend)/account/form-controls.tsx`
- Modify: `tests/unit/vitest.config.mts`
- Test: `tests/unit/account-form-controls.test.tsx`

- [ ] **Step 1: Let the unit config see the new tests**

In `tests/unit/vitest.config.mts`, add two entries to the `include` array, right after `'tests/unit/checkout*.test.tsx'`:

```ts
'tests/unit/account*.test.ts', 'tests/unit/account*.test.tsx',
```

- [ ] **Step 2: Write the failing test**

```tsx
// tests/unit/account-form-controls.test.tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import forms from '@/components/forms/forms.module.css'
import checkout from '@/components/checkout/checkout.module.css'
import { FormField } from '@/components/forms/FormField'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { AccountField, AccountSubmit } from '@/app/(frontend)/account/form-controls'

it('FormField renders its original markup when no classNames are passed', () => {
  const html = renderToStaticMarkup(
    <FormField name="city" label="City" helpText="Help" error="Bad" defaultValue="x" required />,
  )
  expect(html).toBe(
    `<div class="${forms.field}"><label class="${forms.label}" for="field-city">City</label>` +
      `<input id="field-city" type="text" required="" aria-describedby="field-city-help field-city-error" aria-invalid="true" class="${forms.input}" name="city" value="x"/>` +
      `<span id="field-city-help" style="font-size:13px;color:#666">Help</span>` +
      `<span id="field-city-error" role="alert" class="${forms.error}">Bad</span></div>`,
  )
})

it('FormField swaps in the given classes wholesale and drops the inline help colour', () => {
  const html = renderToStaticMarkup(
    <FormField
      name="city"
      label="City"
      helpText="Help"
      error="Bad"
      classNames={{ field: 'f', help: 'h', error: 'e' }}
    />,
  )
  expect(html).toContain('<div class="f">')
  expect(html).toContain('<label for="field-city">City</label>')
  expect(html).toContain('<span id="field-city-help" class="h">Help</span>')
  expect(html).toContain('<span id="field-city-error" role="alert" class="e">Bad</span>')
  expect(html).not.toContain('#666')
  expect(html).not.toContain(forms.input)
  expect(html).not.toContain(forms.label)
})

it('SubmitButton keeps its default class and accepts a replacement', () => {
  expect(renderToStaticMarkup(<SubmitButton>Save</SubmitButton>)).toBe(
    `<button type="submit" class="${forms.submit}">Save</button>`,
  )
  expect(renderToStaticMarkup(<SubmitButton className="btn-primary x">Save</SubmitButton>)).toBe(
    '<button type="submit" class="btn-primary x">Save</button>',
  )
})

it('AccountField and AccountSubmit carry the checkout look', () => {
  const html = renderToStaticMarkup(<AccountField name="city" label="City" helpText="Help" />)
  expect(html).toContain(`<div class="${checkout.field}">`)
  expect(html).toContain(`class="${checkout.helper}"`)
  expect(html).not.toContain(forms.input)
  expect(renderToStaticMarkup(<AccountSubmit>Save details</AccountSubmit>)).toBe(
    `<button type="submit" class="btn-primary ${checkout.button}">Save details</button>`,
  )
})
```

- [ ] **Step 3: Run it and watch it fail**

Run: `pnpm exec vitest run --config tests/unit/vitest.config.mts tests/unit/account-form-controls.test.tsx`
Expected: FAIL — cannot resolve `@/app/(frontend)/account/form-controls`.

- [ ] **Step 4: Implement**

`src/components/forms/FormField.tsx` — add the exported interface and the default set above `interface Props`, add the prop, and use `cx` in the markup. Keep the JSX attribute order exactly as it is; the first test compares the full string.

```tsx
// Replaces the default class set wholesale, so a caller can adopt another surface's field styling.
export interface FormFieldClassNames {
  field?: string
  label?: string
  input?: string
  help?: string
  error?: string
}

const DEFAULT_CLASS_NAMES: FormFieldClassNames = {
  field: styles.field,
  label: styles.label,
  input: styles.input,
  error: styles.error,
}
```

Add `classNames?: FormFieldClassNames` to `Props`, destructure it, and replace the returned JSX with:

```tsx
  const cx = classNames ?? DEFAULT_CLASS_NAMES
  return (
    <div className={cx.field}>
      <label className={cx.label} htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        {...(isControlled
          ? { value, onChange }
          : { defaultValue })}
        required={required}
        autoComplete={autoComplete}
        aria-describedby={describedBy.length ? describedBy.join(' ') : undefined}
        aria-invalid={error ? 'true' : undefined}
        className={cx.input}
      />
      {helpText && (
        <span
          id={`${id}-help`}
          className={cx.help}
          style={classNames ? undefined : { fontSize: 13, color: '#666' }}
        >
          {helpText}
        </span>
      )}
      {error && <span id={`${id}-error`} role="alert" className={cx.error}>{error}</span>}
    </div>
  )
```

`src/components/forms/SubmitButton.tsx`:

```tsx
export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className ?? styles.submit} disabled={pending}>
      {pending ? 'Working…' : children}
    </button>
  )
}
```

`src/app/(frontend)/account/form-controls.tsx`:

```tsx
import React from 'react'
import { FormField } from '@/components/forms/FormField'
import { SubmitButton } from '@/components/forms/SubmitButton'
import checkout from '@/components/checkout/checkout.module.css'

// The checkout stylesheet styles `.field input` itself, so the input and label need no class.
const FIELD_CLASS_NAMES = { field: checkout.field, help: checkout.helper, error: checkout.error }

export function AccountField(props: Omit<React.ComponentProps<typeof FormField>, 'classNames'>) {
  return <FormField {...props} classNames={FIELD_CLASS_NAMES} />
}

export function AccountSubmit({ children }: { children: React.ReactNode }) {
  return <SubmitButton className={`btn-primary ${checkout.button}`}>{children}</SubmitButton>
}
```

- [ ] **Step 5: Run it and watch it pass**

Run: `pnpm exec vitest run --config tests/unit/vitest.config.mts tests/unit/account-form-controls.test.tsx tests/unit/checkout-identity-forms.test.tsx tests/unit/contact-form.test.tsx`
Expected: PASS, including the two existing suites that render the primitives.

- [ ] **Step 6: Commit**

```bash
git add src/components/forms/FormField.tsx src/components/forms/SubmitButton.tsx "src/app/(frontend)/account/form-controls.tsx" tests/unit/vitest.config.mts tests/unit/account-form-controls.test.tsx
git commit -m "feat(forms): opt-in class overrides for FormField and SubmitButton"
```

---

### Task 2: `AccountPage` frame, `ReservationHeader` labels, account stylesheet

**Files:**
- Create: `src/app/(frontend)/account/AccountPage.tsx`
- Modify: `src/components/checkout/ReservationHeader.tsx`
- Modify: `src/app/(frontend)/account/account.module.css`
- Test: `tests/unit/account-page-frame.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/account-page-frame.test.tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountPage } from '@/app/(frontend)/account/AccountPage'
import { ReservationHeader } from '@/components/checkout/ReservationHeader'

it('AccountPage renders a one-line eyebrow, the H1, lead, actions and children in the checkout frame', () => {
  const html = renderToStaticMarkup(
    <AccountPage title="Addresses" lead="Reusable billing addresses." actions={<a href="/x">Add</a>}>
      <p>Body</p>
    </AccountPage>,
  )
  expect(html.startsWith(`<div class="${checkout.account}"><header class="${checkout.header}">`)).toBe(true)
  expect(html).toContain(`<p class="${checkout.eyebrow}" data-eyebrow="section">My account</p>`)
  expect(html).toContain('<h1>Addresses</h1>')
  expect(html).toContain(`<p class="${checkout.lead}">Reusable billing addresses.</p>`)
  expect(html).toContain(`<div class="${checkout.actions}"><a href="/x">Add</a></div>`)
  expect(html.indexOf('</header>')).toBeLessThan(html.indexOf('<p>Body</p>'))
})

it('AccountPage omits the lead and actions when they are not given and accepts an eyebrow', () => {
  const html = renderToStaticMarkup(
    <AccountPage title="Security" eyebrow="Your order">
      <p>Body</p>
    </AccountPage>,
  )
  expect(html).toContain('>Your order</p>')
  expect(html).not.toContain(checkout.lead)
  expect(html).not.toContain(checkout.actions)
})

it('ReservationHeader keeps its reservation wording by default', () => {
  const html = renderToStaticMarkup(
    <ReservationHeader reference="RB-C-1" title="Upcoming trips" status="Reserved" />,
  )
  expect(html).toContain('>Your reservation</p>')
  expect(html).toContain('Reservation reference')
})

it('ReservationHeader can present an order', () => {
  const html = renderToStaticMarkup(
    <ReservationHeader
      reference="RB-2026-000123"
      title="Gorges du Tarn"
      status="Confirmed"
      eyebrow="Your order"
      referenceLabel="Order number"
    />,
  )
  expect(html).toContain('>Your order</p>')
  expect(html).toContain('Order number')
  expect(html).not.toContain('Reservation reference')
  expect(html).toContain('<code>RB-2026-000123</code>')
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run --config tests/unit/vitest.config.mts tests/unit/account-page-frame.test.tsx`
Expected: FAIL — cannot resolve `AccountPage`.

- [ ] **Step 3: Implement `AccountPage`**

```tsx
// src/app/(frontend)/account/AccountPage.tsx
import React from 'react'
import checkout from '@/components/checkout/checkout.module.css'

/** The reservation page's header and inset, shared by every account tab so they line up. */
export function AccountPage({
  title,
  eyebrow = 'My account',
  lead,
  actions,
  children,
}: {
  title: string
  eyebrow?: string
  lead?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className={checkout.account}>
      <header className={checkout.header}>
        <p className={checkout.eyebrow} data-eyebrow="section">
          {eyebrow}
        </p>
        <h1>{title}</h1>
        {lead && <p className={checkout.lead}>{lead}</p>}
        {actions && <div className={checkout.actions}>{actions}</div>}
      </header>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Add the two optional labels to `ReservationHeader`**

In `src/components/checkout/ReservationHeader.tsx`, extend the props and use them. Defaults reproduce today's text exactly, including the screen-reader sentence "Reservation reference copied.".

```tsx
export function ReservationHeader({
  reference,
  title,
  status,
  expiresAt,
  eyebrow = 'Your reservation',
  referenceLabel = 'Reservation reference',
}: {
  reference: string
  title: string
  status: string
  expiresAt?: string | null
  eyebrow?: string
  referenceLabel?: string
}) {
```

Replace the three literals:

```tsx
      <p className={styles.eyebrow} data-eyebrow="section">
        {eyebrow}
      </p>
```

```tsx
        <span className={styles.referenceLabel}>{referenceLabel}</span>
```

```tsx
          {copied ? `${referenceLabel} copied.` : ''}
```

- [ ] **Step 5: Extend the account stylesheet**

Append to `src/app/(frontend)/account/account.module.css` (leave the existing shell and sidebar rules untouched):

```css
/* Account-only layout. Panels, fields and buttons come from the checkout stylesheet. */
.panelGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
.linkPanel {
  display: grid;
  gap: 8px;
  align-content: start;
}
.linkPanel p {
  margin: 0;
}
.linkPanel .panelAction {
  justify-self: start;
  margin-top: 16px;
}
.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
/* Two classes so this outranks the checkout `.panel h2` margin whatever the stylesheet order. */
.cardHeader .cardTitle {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}
.addressBody {
  margin: 0;
  font-style: normal;
  line-height: 1.7;
}
.addressBody + p {
  margin: 8px 0 0;
  font-size: var(--theme-text-small);
}
.cardActions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}
.cardActions form {
  display: contents;
}
.compactButton {
  padding: 10px 18px;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--theme-color-paper-80);
  font-size: var(--theme-text-small);
  cursor: pointer;
}
.toggle input {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  accent-color: var(--theme-color-primary);
}
.companyBox {
  display: grid;
  gap: 18px;
  border-top: 1px solid var(--theme-color-border);
  padding-top: 18px;
}
.plainList {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.plainList li > span {
  display: block;
}
.noticeBody {
  margin: 0;
}
.preLine {
  margin: 0;
  white-space: pre-line;
  line-height: 1.7;
}
@media (max-width: 900px) {
  .panelGrid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Run the tests**

Run: `pnpm exec vitest run --config tests/unit/vitest.config.mts tests/unit/account-page-frame.test.tsx tests/unit/checkout-detail-page.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(frontend)/account/AccountPage.tsx" "src/app/(frontend)/account/account.module.css" src/components/checkout/ReservationHeader.tsx tests/unit/account-page-frame.test.tsx
git commit -m "feat(account): shared page frame and order-capable reservation header"
```

---

### Task 3: Profile, Security and confirm-email

**Files:**
- Modify: `src/app/(frontend)/account/profile/page.tsx`
- Modify: `src/app/(frontend)/account/profile/ProfileForm.tsx`
- Modify: `src/app/(frontend)/account/profile/confirm-email/page.tsx`
- Modify: `src/app/(frontend)/account/security/page.tsx`
- Modify: `src/app/(frontend)/account/security/SecurityForm.tsx`
- Test: `tests/unit/account-profile-security.test.tsx`

Do not touch any `actions.ts` or `schema.ts`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/account-profile-security.test.tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import checkout from '@/components/checkout/checkout.module.css'
import forms from '@/components/forms/forms.module.css'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: async () => ({
    id: 9,
    name: 'Test Customer',
    phone: '+420 600 000 000',
    email: 'test@example.test',
    pendingEmail: null,
  }),
  requireUser: async () => ({ id: 9 }),
}))
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ find: async () => ({ docs: [] }) }) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }))
vi.mock('@/app/(frontend)/account/profile/actions', () => ({
  updateProfileAction: vi.fn(),
  cancelPendingEmailChangeAction: vi.fn(),
}))
vi.mock('@/app/(frontend)/account/security/actions', () => ({ changePasswordAction: vi.fn() }))

import ProfilePage from '@/app/(frontend)/account/profile/page'
import { ProfileForm } from '@/app/(frontend)/account/profile/ProfileForm'
import SecurityPage from '@/app/(frontend)/account/security/page'
import ConfirmEmailPage from '@/app/(frontend)/account/profile/confirm-email/page'

const initial = { name: 'Test Customer', phone: '+420 600 000 000', email: 'test@example.test' }

it('profile uses the checkout frame, "Your details" and "Save details"', async () => {
  const html = renderToStaticMarkup(await ProfilePage({ searchParams: Promise.resolve({}) }))
  expect(html).toContain('<h1>Your details</h1>')
  expect(html).toContain('data-eyebrow="section">My account</p>')
  expect(html).toContain(`<section class="${checkout.panel}">`)
  expect(html).toContain('data-type="card-lg">Contact details</h2>')
  expect(html).toContain(`class="btn-primary ${checkout.button}">Save details</button>`)
  expect(html).toContain('value="test@example.test"')
  expect(html).not.toContain(forms.input)
  expect(html).not.toContain(forms.submit)
  expect(html).not.toContain('style=')
})

it('profile confirms a completed email change', async () => {
  const html = renderToStaticMarkup(
    await ProfilePage({ searchParams: Promise.resolve({ 'email-changed': '1' }) }),
  )
  expect(html).toContain('Your sign-in email has been updated.')
})

it('a pending email change is a notice with an outline cancel button, not a text link', () => {
  const html = renderToStaticMarkup(<ProfileForm initial={initial} pendingEmail="new@example.test" />)
  expect(html).toContain(`<div class="${checkout.notice}">`)
  expect(html).toContain('new@example.test')
  expect(html).toContain(`class="btn-ghost ${checkout.button}">Cancel pending email change</button>`)
  expect(html).not.toContain('text-decoration')
})

it('security puts the password form in a panel with the primary button', async () => {
  const html = renderToStaticMarkup(SecurityPage())
  expect(html).toContain('<h1>Security</h1>')
  expect(html).toContain('data-type="card-lg">Change password</h2>')
  expect(html).toContain('autoComplete="new-password"'.toLowerCase())
  expect(html).toContain(`class="btn-primary ${checkout.button}">Change password</button>`)
  expect(html).toContain(`class="${checkout.helper}">At least 8 characters.</span>`)
  expect(html).not.toContain(forms.input)
})

it('confirm-email problems render in the frame with a way back', async () => {
  const html = renderToStaticMarkup(await ConfirmEmailPage({ searchParams: Promise.resolve({}) }))
  expect(html).toContain('<h1>Confirm email</h1>')
  expect(html).toContain(`<div class="${checkout.notice}">`)
  expect(html).toContain('Missing token in URL.')
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/profile"/)
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run --config tests/unit/vitest.config.mts tests/unit/account-profile-security.test.tsx`
Expected: FAIL — `<h1>Your details</h1>` not found.

- [ ] **Step 3: Profile page**

```tsx
// src/app/(frontend)/account/profile/page.tsx
import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { FormBanner } from '@/components/forms/FormBanner'
import { AccountPage } from '../AccountPage'
import { ProfileForm } from './ProfileForm'

export const metadata = { title: 'Your details — Rockbusters' }

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ ['email-changed']?: string }>
}) {
  const sp = await searchParams
  const user = (await getCurrentUser())!
  return (
    <AccountPage title="Your details">
      {/* confirm-email redirects here once the new address is confirmed. */}
      {sp['email-changed'] === '1' && (
        <FormBanner kind="success">Your sign-in email has been updated.</FormBanner>
      )}
      <ProfileForm
        initial={{ name: user.name, phone: user.phone ?? '', email: user.email }}
        pendingEmail={user.pendingEmail ?? undefined}
      />
    </AccountPage>
  )
}
```

- [ ] **Step 4: Profile form**

Keep the state logic and the props interface exactly as they are. Replace the imports and the returned JSX:

```tsx
'use client'
import React, { useActionState, useState } from 'react'
import { FormBanner } from '@/components/forms/FormBanner'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountField, AccountSubmit } from '../form-controls'
import styles from '../account.module.css'
import { updateProfileAction, cancelPendingEmailChangeAction } from './actions'
```

```tsx
  const emailError = !state.ok ? state.fieldErrors?.email : undefined
  return (
    <div className={checkout.layout}>
      <div className={checkout.stack}>
        {pendingEmail && (
          <div className={checkout.notice}>
            <p className={styles.noticeBody}>
              We sent a confirmation link to <strong>{pendingEmail}</strong>. Until you click it,
              your sign-in email stays as <strong>{initial.email}</strong>.
            </p>
            <form action={cancelPendingEmailChangeAction} className={checkout.actions}>
              <button type="submit" className={`btn-ghost ${checkout.button}`}>
                Cancel pending email change
              </button>
            </form>
          </div>
        )}
        <section className={checkout.panel}>
          <h2 data-type="card-lg">Contact details</h2>
          <p className={checkout.muted}>We use these to reach you about your trips.</p>
          {state.ok && <FormBanner kind="success">Details saved.</FormBanner>}
          {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
          <form action={formAction}>
            <div className={checkout.fields}>
              <div className={checkout.formRow}>
                <AccountField
                  name="name"
                  label="Name"
                  defaultValue={echoed?.name ?? initial.name}
                  required
                  autoComplete="name"
                  error={!state.ok ? state.fieldErrors?.name : undefined}
                />
                <AccountField
                  name="phone"
                  label="Phone"
                  type="tel"
                  defaultValue={echoed?.phone ?? initial.phone}
                  required
                  autoComplete="tel"
                  error={!state.ok ? state.fieldErrors?.phone : undefined}
                />
              </div>
              <div className={checkout.field}>
                <label htmlFor="field-email">Email</label>
                <input
                  id="field-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  autoComplete="email"
                  required
                  aria-invalid={emailError ? 'true' : undefined}
                  aria-describedby={emailError ? 'field-email-error' : undefined}
                />
                {emailError && (
                  <span id="field-email-error" role="alert" className={checkout.error}>
                    {emailError}
                  </span>
                )}
              </div>
              {emailDirty && (
                <AccountField
                  name="currentPassword"
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  helpText="Required to change your sign-in email."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  error={!state.ok ? state.fieldErrors?.currentPassword : undefined}
                />
              )}
              <AccountSubmit>Save details</AccountSubmit>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
```

- [ ] **Step 5: Security page and form**

```tsx
// src/app/(frontend)/account/security/page.tsx
import React from 'react'
import { AccountPage } from '../AccountPage'
import { SecurityForm } from './SecurityForm'

export const metadata = { title: 'Security — Rockbusters' }

export default function SecurityPage() {
  return (
    <AccountPage title="Security" lead="Change the password you use to sign in.">
      <SecurityForm />
    </AccountPage>
  )
}
```

In `SecurityForm.tsx` keep all state and the effect. Swap the `FormField` / `SubmitButton` imports for:

```tsx
import checkout from '@/components/checkout/checkout.module.css'
import { AccountField, AccountSubmit } from '../form-controls'
```

and replace the returned JSX with:

```tsx
  return (
    <div className={checkout.layout}>
      <div className={checkout.stack}>
        <section className={checkout.panel}>
          <h2 data-type="card-lg">Change password</h2>
          {state.ok && <FormBanner kind="success">Password updated.</FormBanner>}
          <form action={formAction}>
            <div className={checkout.fields}>
              <AccountField
                name="currentPassword"
                label="Current password"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={fieldErrors?.currentPassword}
              />
              <AccountField
                name="password"
                label="New password"
                type="password"
                required
                autoComplete="new-password"
                helpText="At least 8 characters."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors?.password}
              />
              <AccountField
                name="confirm"
                label="Confirm new password"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={fieldErrors?.confirm}
              />
              <AccountSubmit>Change password</AccountSubmit>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
```

React renders `autoComplete` as the lowercase `autocomplete` attribute; the test lowercases its expectation for that reason.

- [ ] **Step 6: confirm-email problem states**

Add the imports and one local component, then return it from each of the four early exits. The lookup, the expiry check, the update and the redirect stay exactly as they are.

```tsx
import checkout from '@/components/checkout/checkout.module.css'
import { AccountPage } from '../../AccountPage'
import styles from '../../account.module.css'

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <AccountPage title="Confirm email">
      <div className={checkout.notice}>
        <p className={styles.noticeBody}>{children}</p>
        <div className={checkout.actions}>
          <a className={`btn-ghost ${checkout.button}`} href="/account/profile">
            Back to your details
          </a>
        </div>
      </div>
    </AccountPage>
  )
}
```

`return <p>Missing token in URL.</p>` becomes `return <Problem>Missing token in URL.</Problem>`, and likewise for "This link is invalid.", "This link does not belong to your account." and "This link has expired.".

- [ ] **Step 7: Run the tests**

Run: `pnpm exec vitest run --config tests/unit/vitest.config.mts tests/unit/account-profile-security.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(frontend)/account/profile" "src/app/(frontend)/account/security" tests/unit/account-profile-security.test.tsx
git commit -m "feat(account): checkout styling for your details, security and confirm-email"
```

---

### Task 4: Addresses

**Files:**
- Modify: `src/app/(frontend)/account/addresses/page.tsx`
- Modify: `src/app/(frontend)/account/addresses/AddressCard.tsx`
- Modify: `src/app/(frontend)/account/addresses/AddressForm.tsx`
- Modify: `src/app/(frontend)/account/addresses/new/page.tsx`
- Modify: `src/app/(frontend)/account/addresses/[idx]/edit/page.tsx`
- Delete: `src/app/(frontend)/account/addresses/addresses.module.css`
- Test: `tests/unit/account-addresses.test.tsx`

Do not touch `actions.ts` or `schema.ts`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/account-addresses.test.tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'
import checkout from '@/components/checkout/checkout.module.css'
import forms from '@/components/forms/forms.module.css'

const fixture = vi.hoisted(() => ({ addresses: [] as unknown[] }))
vi.mock('@/lib/auth', () => ({
  getCurrentUser: async () => ({ id: 9, name: 'Test Customer', addresses: fixture.addresses }),
}))
vi.mock('next/navigation', () => ({ notFound: vi.fn(), redirect: vi.fn() }))
vi.mock('@/app/(frontend)/account/addresses/actions', () => ({
  addAddressAction: vi.fn(),
  updateAddressAction: vi.fn(),
  deleteAddressAction: vi.fn(),
  setDefaultAddressAction: vi.fn(),
}))

import AddressesPage from '@/app/(frontend)/account/addresses/page'
import AddAddressPage from '@/app/(frontend)/account/addresses/new/page'
import EditAddressPage from '@/app/(frontend)/account/addresses/[idx]/edit/page'

const home = {
  id: 'a1',
  label: 'Home',
  isDefault: true,
  firstName: 'Test',
  lastName: 'Customer',
  street: 'Main 1',
  city: 'Prague',
  postalCode: '11000',
  country: 'CZ',
}
const office = {
  id: 'a2',
  label: '',
  isDefault: false,
  firstName: 'Test',
  lastName: 'Customer',
  street: 'Work 2',
  city: 'Brno',
  postalCode: '60200',
  country: 'CZ',
  company: { companyName: 'Climb s.r.o.', ico: '12345678', dic: 'CZ12345678' },
}

beforeEach(() => {
  fixture.addresses = [home, office]
})

it('lists addresses as panels with a default badge and outline action buttons', async () => {
  const html = renderToStaticMarkup(await AddressesPage())
  expect(html).toContain('<h1>Addresses</h1>')
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/addresses\/new">Add address<\/a>/)
  expect(html.split(`<section class="${checkout.panel}">`)).toHaveLength(3)
  expect(html).toContain('data-type="card-lg">Home</h2>')
  // An empty label falls back to a numbered name instead of an empty heading.
  expect(html).toContain('data-type="card-lg">Address 2</h2>')
  expect(html.match(new RegExp(`class="${checkout.statusBadge}">Default`, 'g'))).toHaveLength(1)
  expect(html).toContain('Climb s.r.o. · IČO 12345678 · DIČ CZ12345678')
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/addresses\/1\/edit">Edit<\/a>/)
  expect(html.match(/>Set as default<\/button>/g)).toHaveLength(1)
  expect(html.match(/>Delete<\/button>/g)).toHaveLength(2)
  expect(html).not.toContain('style=')
})

it('invites the first address from a notice when none exist', async () => {
  fixture.addresses = []
  const html = renderToStaticMarkup(await AddressesPage())
  expect(html).toContain(`<div class="${checkout.notice}">`)
  expect(html).toMatch(/class="btn-primary[^"]*" href="\/account\/addresses\/new">Add your first address<\/a>/)
  // The header action would duplicate the notice button.
  expect(html.match(/href="\/account\/addresses\/new"/g)).toHaveLength(1)
})

it('the add form sits in a "Your details" panel with paired rows and checkout controls', () => {
  const html = renderToStaticMarkup(AddAddressPage())
  expect(html).toContain('<h1>Add address</h1>')
  expect(html).toContain('data-type="card-lg">Your details</h2>')
  expect(html.split(`class="${checkout.formRow}"`).length - 1).toBe(2)
  expect(html).toContain(`class="btn-primary ${checkout.button}">Add address</button>`)
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/addresses">All addresses<\/a>/)
  expect(html).not.toContain(forms.input)
  expect(html).not.toContain('style=')
})

it('the edit form prefills, shows company fields and saves with "Save details"', async () => {
  const html = renderToStaticMarkup(await EditAddressPage({ params: Promise.resolve({ idx: '1' }) }))
  expect(html).toContain('<h1>Edit address</h1>')
  expect(html).toContain('value="Work 2"')
  expect(html).toContain('value="Climb s.r.o."')
  expect(html.split(`class="${checkout.formRow}"`).length - 1).toBe(3)
  expect(html).toContain(`class="btn-primary ${checkout.button}">Save details</button>`)
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run --config tests/unit/vitest.config.mts tests/unit/account-addresses.test.tsx`
Expected: FAIL — `<h1>Addresses</h1>` is present but the panel/badge assertions fail.

- [ ] **Step 3: List page**

```tsx
// src/app/(frontend)/account/addresses/page.tsx
import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountPage } from '../AccountPage'
import styles from '../account.module.css'
import { AddressCard } from './AddressCard'

export const metadata = { title: 'Addresses — Rockbusters' }

export default async function AddressesPage() {
  const user = (await getCurrentUser())!
  const addresses = user.addresses ?? []
  return (
    <AccountPage
      title="Addresses"
      lead="Billing addresses you can reuse when you book."
      actions={
        addresses.length > 0 && (
          <a className={`btn-ghost ${checkout.button}`} href="/account/addresses/new">
            Add address
          </a>
        )
      }
    >
      {addresses.length === 0 ? (
        <div className={checkout.notice}>
          <p className={styles.noticeBody}>You haven&apos;t added an address yet.</p>
          <div className={checkout.actions}>
            <a className={`btn-primary ${checkout.button}`} href="/account/addresses/new">
              Add your first address
            </a>
          </div>
        </div>
      ) : (
        <div className={styles.panelGrid}>
          {addresses.map((a, idx) => (
            <AddressCard key={a.id ?? idx} idx={idx} address={a} />
          ))}
        </div>
      )}
    </AccountPage>
  )
}
```

`AccountPage` renders the actions row only when `actions` is truthy, so `false` from the `&&` leaves it out.

- [ ] **Step 4: Card**

Keep the two inline server functions and the bindings. Replace the imports of `styles` and the returned JSX:

```tsx
import checkout from '@/components/checkout/checkout.module.css'
import styles from '../account.module.css'
```

```tsx
  const company = address.company?.companyName
    ? [
        address.company.companyName,
        address.company.ico && `IČO ${address.company.ico}`,
        address.company.dic && `DIČ ${address.company.dic}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''
  const ghost = `btn-ghost ${checkout.button} ${styles.compactButton}`
  return (
    <section className={checkout.panel}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle} data-type="card-lg">
          {address.label || `Address ${idx + 1}`}
        </h2>
        {address.isDefault && <span className={checkout.statusBadge}>Default</span>}
      </div>
      <address className={styles.addressBody}>
        {address.firstName} {address.lastName}
        <br />
        {address.street}
        <br />
        {address.postalCode} {address.city}, {address.country}
      </address>
      {company && <p className={checkout.muted}>{company}</p>}
      <div className={styles.cardActions}>
        <a className={ghost} href={`/account/addresses/${idx}/edit`}>
          Edit
        </a>
        {!address.isDefault && (
          <form action={setDefaultBound}>
            <button type="submit" className={ghost}>
              Set as default
            </button>
          </form>
        )}
        <form action={delBound}>
          <button type="submit" className={ghost}>
            Delete
          </button>
        </form>
      </div>
    </section>
  )
```

The test matches `<section class="${checkout.panel}">` exactly, so the section carries that one class only.

- [ ] **Step 5: Form**

Keep the props, `useActionState`, `echoed`, `showCompany` and the three hidden inputs. Swap the imports:

```tsx
import { FormBanner } from '@/components/forms/FormBanner'
import { INITIAL_ACTION_STATE, type ActionResult } from '@/components/forms/action-result'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountField, AccountSubmit } from '../form-controls'
import styles from '../account.module.css'
```

and replace the returned JSX. Every field keeps its current `name`, `label`, `required`, `defaultValue` and `error`; only the wrapper elements, the component names and three `autoComplete` hints change.

```tsx
  const errors = !state.ok ? state.fieldErrors : undefined
  return (
    <div className={checkout.layout}>
      <div className={checkout.stack}>
        <section className={checkout.panel}>
          <h2 data-type="card-lg">Your details</h2>
          {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
          <form action={formAction}>
            <div className={checkout.fields}>
              <AccountField
                name="label"
                label="Label (optional)"
                defaultValue={echoed?.label ?? initial?.label ?? ''}
                helpText="Home, Work, Mom's place…"
              />
              <div className={checkout.formRow}>
                <AccountField
                  name="firstName"
                  label="First name"
                  required
                  autoComplete="given-name"
                  defaultValue={echoed?.firstName ?? initial?.firstName}
                  error={errors?.firstName}
                />
                <AccountField
                  name="lastName"
                  label="Last name"
                  required
                  autoComplete="family-name"
                  defaultValue={echoed?.lastName ?? initial?.lastName}
                  error={errors?.lastName}
                />
              </div>
              <AccountField
                name="street"
                label="Street and number"
                required
                autoComplete="street-address"
                defaultValue={echoed?.street ?? initial?.street}
                error={errors?.street}
              />
              <div className={checkout.formRow}>
                <AccountField
                  name="postalCode"
                  label="Postal code"
                  required
                  defaultValue={echoed?.postalCode ?? initial?.postalCode}
                  error={errors?.postalCode}
                />
                <AccountField
                  name="city"
                  label="City"
                  required
                  defaultValue={echoed?.city ?? initial?.city}
                  error={errors?.city}
                />
              </div>
              <AccountField
                name="country"
                label="Country"
                required
                defaultValue={echoed?.country ?? initial?.country ?? 'CZ'}
                error={errors?.country}
              />
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
                  <AccountField
                    name="companyName"
                    label="Company name"
                    defaultValue={echoed?.companyName ?? initial?.company?.companyName ?? ''}
                    error={errors?.companyName}
                  />
                  <div className={checkout.formRow}>
                    <AccountField
                      name="ico"
                      label="IČO"
                      defaultValue={echoed?.ico ?? initial?.company?.ico ?? ''}
                      error={errors?.ico}
                    />
                    <AccountField
                      name="dic"
                      label="DIČ (optional)"
                      defaultValue={echoed?.dic ?? initial?.company?.dic ?? ''}
                      error={errors?.dic}
                    />
                  </div>
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
              <AccountSubmit>{submitLabel}</AccountSubmit>
            </div>
          </form>
        </section>
        <a className={`btn-ghost ${checkout.button}`} href="/account/addresses">
          All addresses
        </a>
      </div>
    </div>
  )
```

The street label becomes "Street and number", matching the checkout billing form.

- [ ] **Step 6: New and edit pages**

```tsx
// src/app/(frontend)/account/addresses/new/page.tsx
import React from 'react'
import { AccountPage } from '../../AccountPage'
import { AddressForm } from '../AddressForm'
import { addAddressAction } from '../actions'

export const metadata = { title: 'Add address — Rockbusters' }

export default function AddAddressPage() {
  return (
    <AccountPage title="Add address">
      <AddressForm action={addAddressAction} submitLabel="Add address" />
    </AccountPage>
  )
}
```

In `[idx]/edit/page.tsx` import `AccountPage` from `'../../../AccountPage'` and replace the returned fragment:

```tsx
  return (
    <AccountPage title="Edit address">
      <AddressForm initial={address} action={action} submitLabel="Save details" />
    </AccountPage>
  )
```

- [ ] **Step 7: Delete the old stylesheet**

```bash
rm "src/app/(frontend)/account/addresses/addresses.module.css"
grep -rn "addresses.module.css" src && echo "STILL REFERENCED" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 8: Run the tests**

Run: `pnpm exec vitest run --config tests/unit/vitest.config.mts tests/unit/account-addresses.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A "src/app/(frontend)/account/addresses" tests/unit/account-addresses.test.tsx
git commit -m "feat(account): checkout styling for addresses"
```

---

### Task 5: Orders list and order detail

**Files:**
- Create: `src/app/(frontend)/account/orders/presentation.ts`
- Modify: `src/app/(frontend)/account/orders/page.tsx`
- Modify: `src/app/(frontend)/account/orders/[id]/page.tsx`
- Modify: `tests/e2e/booking.e2e.spec.ts`
- Test: `tests/unit/account-orders.test.tsx`

Do not touch `orders/[id]/actions.ts`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/account-orders.test.tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'
import checkout from '@/components/checkout/checkout.module.css'

const event = { id: 5, title: 'Europe Climbing Trip' }
const eventDate = {
  id: 9,
  event,
  dateFrom: '2030-06-01T00:00:00.000Z',
  dateTo: '2030-06-08T00:00:00.000Z',
  tripVariant: {
    id: 51,
    event: 5,
    title: 'Gorges du Tarn',
    editorial: {
      hero: {
        titleParts: [
          { text: 'ROCK & ROAD EUROPE:' },
          { text: 'GORGES DU TARN', accent: true, breakBefore: true },
        ],
      },
    },
  },
}
const baseOrder = {
  id: 456,
  orderNumber: 'RB-2030-000456',
  state: 'pending',
  user: 9,
  eventDate,
  participantCount: 1,
  participants: [
    { firstName: 'Test', lastName: 'Customer', email: 'test@example.test', phone: '+420123456789' },
  ],
  billingAddress: {
    firstName: 'Test',
    lastName: 'Customer',
    street: 'Saved street 1',
    city: 'Prague',
    postalCode: '11000',
    country: 'CZ',
  },
  unitPrice: 950,
  totalPrice: 950,
  currency: 'EUR',
  vat: 21,
}
const fixture = vi.hoisted(() => ({
  overrides: {} as Record<string, unknown>,
  docs: null as unknown[] | null,
  findByIdArgs: null as Record<string, unknown> | null,
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUser: async () => ({ id: 9, name: 'Test Customer', email: 'test@example.test' }),
}))
vi.mock('@/lib/payload', () => ({
  getPayloadClient: async () => ({
    find: async () => ({ docs: fixture.docs ?? [{ ...baseOrder, ...fixture.overrides }] }),
    findByID: async (args: Record<string, unknown>) => {
      fixture.findByIdArgs = args
      return { ...baseOrder, ...fixture.overrides }
    },
  }),
}))
vi.mock('next/navigation', () => ({ notFound: vi.fn(), redirect: vi.fn() }))
vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))
vi.mock('@/app/(frontend)/account/orders/[id]/actions', () => ({ cancelMyOrderAction: vi.fn() }))

import OrdersPage from '@/app/(frontend)/account/orders/page'
import OrderDetailPage from '@/app/(frontend)/account/orders/[id]/page'

const detail = async () =>
  renderToStaticMarkup(await OrderDetailPage({ params: Promise.resolve({ id: '456' }) }))

beforeEach(() => {
  fixture.overrides = {}
  fixture.docs = null
  fixture.findByIdArgs = null
  delete process.env.BANK_TRANSFER_DETAILS
})

it('lists orders as reservation-style cards with the authored name, a badge and one price', async () => {
  const html = renderToStaticMarkup(await OrdersPage())
  expect(html).toContain('<h1>Your orders</h1>')
  expect(html).toContain(`<section class="${checkout.panel} ${checkout.reservationCard}">`)
  expect(html).toContain('ROCK &amp; ROAD EUROPE: GORGES DU TARN')
  expect(html).not.toContain('Europe Climbing Trip')
  expect(html).toContain('1 Jun 2030 – 8 Jun 2030')
  expect(html).toContain('RB-2030-000456')
  expect(html).toContain(`<span class="${checkout.statusBadge}">Pending</span>`)
  expect(html.match(/€950\.00/g)).toHaveLength(1)
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/orders\/456">View order<\/a>/)
  expect(html).not.toContain('style=')
})

it('falls back to "Trip" when the event is not populated', async () => {
  fixture.overrides = { eventDate: { ...eventDate, event: 5 } }
  expect(renderToStaticMarkup(await OrdersPage())).toContain('>Trip</a>')
})

it('shows an empty-state notice that leads to the trips', async () => {
  fixture.docs = []
  const html = renderToStaticMarkup(await OrdersPage())
  expect(html).toContain(`<div class="${checkout.notice}">`)
  expect(html).toMatch(/class="btn-primary[^"]*" href="\/trips">Browse trips<\/a>/)
})

it('presents an order like a reservation: header, two columns, one total', async () => {
  const html = await detail()
  expect(fixture.findByIdArgs).toMatchObject({ collection: 'orders', depth: 2, overrideAccess: false })
  expect(html).toContain('>Your order</p>')
  expect(html).toContain('<h1>ROCK &amp; ROAD EUROPE: GORGES DU TARN</h1>')
  expect(html).toContain(`<span class="${checkout.statusBadge}">Pending</span>`)
  expect(html).toContain('Order number')
  expect(html).toContain('<code>RB-2030-000456</code>')
  expect(html).toContain(`<div class="${checkout.layout}">`)
  expect(html).toContain('data-type="card-lg">Participants</h2>')
  expect(html).toContain('data-type="card-lg">Your details</h2>')
  expect(html).toContain('data-type="card-lg">Your trip</h2>')
  expect(html).toContain('data-type="card-lg">Order summary</h2>')
  expect(html).toContain('1 participant')
  expect(html).toContain('VAT 21% included.')
  expect(html).not.toContain('Subtotal')
  expect(html).not.toContain('Discount')
  expect(html).not.toContain('per person')
  expect(html.match(/€950\.00/g)).toHaveLength(1)
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/orders">All orders<\/a>/)
  expect(html).not.toContain('style=')
})

it('offers an outline "Cancel booking" only while the order is pending', async () => {
  expect(await detail()).toMatch(/<button type="submit" class="btn-ghost[^"]*">Cancel booking<\/button>/)
  fixture.overrides = { state: 'paid' }
  expect(await detail()).not.toContain('Cancel booking')
})

it('shows payment instructions with the variable symbol only when confirmed', async () => {
  process.env.BANK_TRANSFER_DETAILS = 'IBAN CZ00 0000\nBeneficiary Rockbusters'
  expect(await detail()).not.toContain('Payment instructions')
  fixture.overrides = { state: 'confirmed' }
  const html = await detail()
  expect(html).toContain('data-type="card-lg">Payment instructions</h2>')
  expect(html).toContain('IBAN CZ00 0000')
  expect(html).toContain('Variable symbol: <strong>RB-2030-000456</strong>')
  expect(html.indexOf('Payment instructions')).toBeLessThan(html.indexOf('Participants'))
})

it('adds subtotal and discount rows only when a discount applied, and a per-person price for groups', async () => {
  fixture.overrides = {
    participantCount: 2,
    totalPrice: 1800,
    discountAmount: 100,
    discountCode: { id: 1, code: 'CRAG100', title: 'Crag' },
    customerNote: 'Vegetarian',
  }
  const html = await detail()
  expect(html).toContain('Subtotal')
  expect(html).toContain('€1,900.00')
  expect(html).toContain('Discount (CRAG100)')
  expect(html).toContain('−€100.00')
  expect(html).toContain('€1,800.00')
  expect(html).toContain('2 participants · €950.00 per person')
  expect(html).toContain('data-type="card-lg">Your note</h2>')
  expect(html).toContain('Vegetarian')
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run --config tests/unit/vitest.config.mts tests/unit/account-orders.test.tsx`
Expected: FAIL — authored name and panel classes missing.

- [ ] **Step 3: Shared presentation helpers**

```ts
// src/app/(frontend)/account/orders/presentation.ts
import type { Order } from '@/payload-types'
import { tripPlainTitle } from '@/lib/trip-card-content'
import { date, money } from '@/components/checkout/format'

export const ORDER_STATE_LABEL: Record<Order['state'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  paid: 'Paid',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const populatedEventDate = (order: Pick<Order, 'eventDate'>) =>
  typeof order.eventDate === 'object' && order.eventDate ? order.eventDate : null

/** The authored trip name, from the same Event → Trip Variant → Event Date chain the cart uses. */
export function orderTripTitle(order: Pick<Order, 'eventDate'>): string {
  const eventDate = populatedEventDate(order)
  const event = eventDate && typeof eventDate.event === 'object' ? eventDate.event : null
  return event && eventDate ? tripPlainTitle(event, eventDate) : 'Trip'
}

export function orderDateRange(order: Pick<Order, 'eventDate'>): string {
  const eventDate = populatedEventDate(order)
  return eventDate ? `${date(eventDate.dateFrom)} – ${date(eventDate.dateTo)}` : ''
}

/** Orders store prices in major units; the checkout formatter takes minor units. */
export const orderMoney = (major: number, currency: Order['currency']) =>
  money(Math.round(major * 100), currency)
```

If `tsc` reports that `eventDate.event` can be `null`, the `typeof … === 'object'` guard already narrows `null` in — keep the `event && eventDate` check, which handles it.

- [ ] **Step 4: Orders list**

```tsx
// src/app/(frontend)/account/orders/page.tsx
import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import type { Order } from '@/payload-types'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountPage } from '../AccountPage'
import styles from '../account.module.css'
import { ORDER_STATE_LABEL, orderDateRange, orderMoney, orderTripTitle } from './presentation'

export const metadata = { title: 'Orders — Rockbusters' }

export default async function OrdersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'orders',
    where: { user: { equals: user.id } },
    sort: '-createdAt',
    limit: 100,
    depth: 2,
    user,
    overrideAccess: false,
  })
  const orders = res.docs as Order[]
  return (
    <AccountPage title="Your orders">
      {orders.length === 0 ? (
        <div className={checkout.notice}>
          <p className={styles.noticeBody}>You haven&apos;t booked any trips yet.</p>
          <div className={checkout.actions}>
            <Link className={`btn-primary ${checkout.button}`} href="/trips">
              Browse trips
            </Link>
          </div>
        </div>
      ) : (
        <div className={checkout.stack}>
          {orders.map((o) => (
            <section key={o.id} className={`${checkout.panel} ${checkout.reservationCard}`}>
              <div>
                <h2>
                  <Link href={`/account/orders/${o.id}`}>{orderTripTitle(o)}</Link>
                </h2>
                <p>
                  {[orderDateRange(o), o.orderNumber].filter(Boolean).join(' · ')}
                </p>
                <p className={checkout.reservationMeta}>
                  <span className={checkout.statusBadge}>{ORDER_STATE_LABEL[o.state] ?? o.state}</span>
                  <span>{orderMoney(o.totalPrice, o.currency)}</span>
                </p>
              </div>
              <Link className={`btn-ghost ${checkout.button}`} href={`/account/orders/${o.id}`}>
                View order
              </Link>
            </section>
          ))}
        </div>
      )}
    </AccountPage>
  )
}
```

- [ ] **Step 5: Order detail**

```tsx
// src/app/(frontend)/account/orders/[id]/page.tsx
import React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import type { Order } from '@/payload-types'
import { ReservationHeader } from '@/components/checkout/ReservationHeader'
import checkout from '@/components/checkout/checkout.module.css'
import styles from '../../account.module.css'
import { ORDER_STATE_LABEL, orderDateRange, orderMoney, orderTripTitle } from '../presentation'
import { cancelMyOrderAction } from './actions'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Order — Rockbusters' }

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()
  let o: Order
  try {
    // Depth 2 reaches the event date's trip variant, which carries the authored trip name.
    o = (await payload.findByID({
      collection: 'orders',
      id,
      depth: 2,
      user,
      overrideAccess: false,
    })) as Order
  } catch {
    notFound()
  }
  const ownerId = typeof o.user === 'object' && o.user ? o.user.id : o.user
  if (ownerId !== user.id) notFound()

  const cancel = cancelMyOrderAction.bind(null, o.id)
  const orderNumber = o.orderNumber ?? String(o.id)
  const discount = o.discountAmount ?? 0
  const discountSource =
    typeof o.discountCode === 'object' && o.discountCode
      ? o.discountCode.code
      : typeof o.referral === 'object' && o.referral
        ? o.referral.name
        : ''
  const billing = o.billingAddress
  const billingLines = [
    billing?.company?.companyName,
    [billing?.firstName, billing?.lastName].filter(Boolean).join(' '),
    billing?.street,
    [billing?.postalCode, billing?.city].filter(Boolean).join(' '),
    billing?.country,
  ].filter(Boolean)
  const companyIds = [
    billing?.company?.ico && `IČO ${billing.company.ico}`,
    billing?.company?.dic && `DIČ ${billing.company.dic}`,
  ]
    .filter(Boolean)
    .join(' · ')
  const participantLabel = `${o.participantCount} ${o.participantCount === 1 ? 'participant' : 'participants'}`

  return (
    <div className={checkout.account}>
      <ReservationHeader
        eyebrow="Your order"
        referenceLabel="Order number"
        reference={orderNumber}
        title={orderTripTitle(o)}
        status={ORDER_STATE_LABEL[o.state] ?? o.state}
      />
      <div className={checkout.layout}>
        <div className={checkout.stack}>
          {o.state === 'confirmed' && (
            <section className={checkout.panel}>
              <h2 data-type="card-lg">Payment instructions</h2>
              <p className={styles.preLine}>
                {process.env.BANK_TRANSFER_DETAILS ??
                  'Bank transfer details will be shown here once configured.'}
              </p>
              <p>
                Variable symbol: <strong>{orderNumber}</strong>
              </p>
            </section>
          )}
          <section className={checkout.panel}>
            <h2 data-type="card-lg">Participants</h2>
            <ul className={styles.plainList}>
              {(o.participants ?? []).map((p, i) => (
                <li key={p.id ?? i}>
                  <span>{[p.firstName, p.lastName].filter(Boolean).join(' ')}</span>
                  <span className={checkout.muted}>
                    {[p.email, p.phone].filter(Boolean).join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className={checkout.panel}>
            <h2 data-type="card-lg">Your details</h2>
            <address className={styles.addressBody}>
              {billingLines.map((line, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </address>
            {companyIds && <p className={checkout.muted}>{companyIds}</p>}
          </section>
          {o.customerNote && (
            <section className={checkout.panel}>
              <h2 data-type="card-lg">Your note</h2>
              <p className={styles.preLine}>{o.customerNote}</p>
            </section>
          )}
          {o.state === 'pending' && (
            <form action={cancel} className={checkout.stack}>
              <button type="submit" className={`btn-ghost ${checkout.button}`}>
                Cancel booking
              </button>
            </form>
          )}
          <Link className={`btn-ghost ${checkout.button}`} href="/account/orders">
            All orders
          </Link>
        </div>
        <aside className={checkout.sidebar} aria-label="Order summary">
          <section className={`${checkout.panel} ${checkout.tripSummary}`}>
            <div className={checkout.tripSummaryHeading}>
              <h2 data-type="card-lg">Your trip</h2>
            </div>
            <div className={checkout.tripSummaryContent}>
              <div className={checkout.tripSummaryItem}>
                <h3 className={checkout.tripSummaryItemTitle} data-type="card-lg">
                  {orderTripTitle(o)}
                </h3>
                <p className={checkout.muted}>{orderDateRange(o)}</p>
                <p className={checkout.muted}>
                  {participantLabel}
                  {o.participantCount > 1 ? ` · ${orderMoney(o.unitPrice, o.currency)} per person` : ''}
                </p>
              </div>
            </div>
          </section>
          <section className={checkout.panel}>
            <h2 data-type="card-lg">Order summary</h2>
            {discount > 0 && (
              <>
                <div className={checkout.row}>
                  <span>Subtotal</span>
                  <strong>{orderMoney(o.totalPrice + discount, o.currency)}</strong>
                </div>
                <div className={checkout.row}>
                  <span>Discount{discountSource ? ` (${discountSource})` : ''}</span>
                  <strong>−{orderMoney(discount, o.currency)}</strong>
                </div>
              </>
            )}
            <div className={`${checkout.row} ${checkout.total}`}>
              <span>Total</span>
              <span className={checkout.totalAmount}>{orderMoney(o.totalPrice, o.currency)}</span>
            </div>
            <p className={checkout.summaryNote}>VAT {o.vat}% included.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
```

With a group the per-person line would add a second `€950.00` next to a `€950.00` total only if the group were one person, which the `> 1` guard excludes; the single-participant test asserts exactly one `€950.00`.

- [ ] **Step 6: Follow the renamed controls in the e2e spec**

In `tests/e2e/booking.e2e.spec.ts`, inside `test('user can cancel a pending order', …)`:

```ts
  await page.getByRole('link', { name: /^View →$/ }).first().click()
  await page.getByRole('button', { name: /Cancel booking/i }).click()
  await expect(page.getByText(/Status:\s*cancelled/i)).toBeVisible()
```

becomes

```ts
  await page.getByRole('link', { name: /^View order$/i }).first().click()
  await page.getByRole('button', { name: /Cancel booking/i }).click()
  await expect(page.getByText('Cancelled', { exact: true }).first()).toBeVisible()
```

The status now lives in the header badge rather than a "Status:" line.

- [ ] **Step 7: Run the tests**

Run: `pnpm exec vitest run --config tests/unit/vitest.config.mts tests/unit/account-orders.test.tsx tests/unit/trip-plain-title.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(frontend)/account/orders" tests/unit/account-orders.test.tsx tests/e2e/booking.e2e.spec.ts
git commit -m "feat(account): reservation-style orders list and order detail"
```

---

### Task 6: Overview with real counts

**Files:**
- Modify: `src/app/(frontend)/account/page.tsx`
- Test: `tests/unit/account-overview.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/account-overview.test.tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'
import checkout from '@/components/checkout/checkout.module.css'

const fixture = vi.hoisted(() => ({
  reservationsOn: true,
  counts: { orders: 3, checkouts: 1 } as Record<string, number>,
  countArgs: [] as Record<string, unknown>[],
  addresses: [{ id: 'a1' }, { id: 'a2' }] as unknown[],
}))
vi.mock('@/lib/checkout/feature', () => ({ checkoutEnabled: () => fixture.reservationsOn }))
vi.mock('@/lib/auth', () => ({
  getCurrentUser: async () => ({
    id: 9,
    name: 'Test Customer',
    email: 'test@example.test',
    phone: '+420 600 000 000',
    addresses: fixture.addresses,
  }),
}))
vi.mock('@/lib/payload', () => ({
  getPayloadClient: async () => ({
    count: async (args: Record<string, unknown>) => {
      fixture.countArgs.push(args)
      return { totalDocs: fixture.counts[args.collection as string] }
    },
  }),
}))

import AccountOverviewPage from '@/app/(frontend)/account/page'

const render = async (sp: Record<string, string> = {}) =>
  renderToStaticMarkup(await AccountOverviewPage({ searchParams: Promise.resolve(sp) }))

beforeEach(() => {
  fixture.reservationsOn = true
  fixture.counts = { orders: 3, checkouts: 1 }
  fixture.countArgs = []
  fixture.addresses = [{ id: 'a1' }, { id: 'a2' }]
})

it('greets by first name and links every section from a panel with real counts', async () => {
  const html = await render()
  expect(html).toContain('<h1>Welcome back, Test</h1>')
  expect(html.split(`class="${checkout.panel} `).length - 1).toBe(4)
  expect(html).toContain('1 reservation')
  expect(html).not.toContain('1 reservations')
  expect(html).toContain('3 orders')
  expect(html).toContain('2 addresses on file')
  expect(html).toContain('test@example.test')
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/checkouts">View reservations<\/a>/)
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/orders">View orders<\/a>/)
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/profile">Edit details<\/a>/)
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/addresses">Manage addresses<\/a>/)
  expect(html).not.toContain('style=')
})

it('counts only the signed-in customer\'s records, through access control', async () => {
  await render()
  expect(fixture.countArgs).toHaveLength(2)
  for (const args of fixture.countArgs) {
    expect(args).toMatchObject({ where: { user: { equals: 9 } }, overrideAccess: false })
    expect(args.user).toMatchObject({ id: 9 })
  }
})

it('hides reservations and skips their count when grouped checkout is off', async () => {
  fixture.reservationsOn = false
  const html = await render()
  expect(html).not.toContain('/account/checkouts')
  expect(fixture.countArgs.map((args) => args.collection)).toEqual(['orders'])
})

it('words empty sections plainly', async () => {
  fixture.counts = { orders: 0, checkouts: 0 }
  fixture.addresses = []
  const html = await render()
  expect(html).toContain('No orders yet.')
  expect(html).toContain('No reservations yet.')
  expect(html).toContain('No addresses on file.')
})

it('keeps the password-reset and email-changed confirmations', async () => {
  expect(await render({ 'password-reset': '1' })).toContain('Password changed.')
  expect(await render({ 'email-changed': '1' })).toContain('Your sign-in email has been updated.')
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run --config tests/unit/vitest.config.mts tests/unit/account-overview.test.tsx`
Expected: FAIL — the current page never calls `payload.count`.

- [ ] **Step 3: Implement**

```tsx
// src/app/(frontend)/account/page.tsx
import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { checkoutEnabled } from '@/lib/checkout/feature'
import { FormBanner } from '@/components/forms/FormBanner'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountPage } from './AccountPage'
import styles from './account.module.css'

export const metadata = { title: 'Account — Rockbusters' }

const counted = (count: number, one: string, many: string, none: string) =>
  count === 0 ? none : `${count} ${count === 1 ? one : many}`

function LinkPanel({
  title,
  href,
  action,
  children,
}: {
  title: string
  href: string
  action: string
  children: React.ReactNode
}) {
  return (
    <section className={`${checkout.panel} ${styles.linkPanel}`}>
      <h2 data-type="card-lg">{title}</h2>
      {children}
      <a className={`btn-ghost ${checkout.button} ${styles.panelAction}`} href={href}>
        {action}
      </a>
    </section>
  )
}

export default async function AccountOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ ['password-reset']?: string; ['email-changed']?: string }>
}) {
  const sp = await searchParams
  const user = (await getCurrentUser())!
  const payload = await getPayloadClient()
  const reservationsOn = checkoutEnabled()
  const mine = { where: { user: { equals: user.id } }, user, overrideAccess: false }
  const [orders, reservations] = await Promise.all([
    payload.count({ collection: 'orders', ...mine }),
    reservationsOn ? payload.count({ collection: 'checkouts', ...mine }) : null,
  ])
  const addressCount = user.addresses?.length ?? 0
  return (
    <AccountPage
      title={`Welcome back, ${user.name.split(' ')[0]}`}
      lead="Your trips, orders and details in one place."
    >
      {sp['password-reset'] === '1' && (
        <FormBanner kind="success">Password changed. You&apos;re signed in.</FormBanner>
      )}
      {sp['email-changed'] === '1' && (
        <FormBanner kind="success">Your sign-in email has been updated.</FormBanner>
      )}
      <div className={styles.panelGrid}>
        {reservations && (
          <LinkPanel title="Trip reservations" href="/account/checkouts" action="View reservations">
            <p className={checkout.muted}>
              {counted(reservations.totalDocs, 'reservation', 'reservations', 'No reservations yet.')}
            </p>
          </LinkPanel>
        )}
        <LinkPanel title="Orders" href="/account/orders" action="View orders">
          <p className={checkout.muted}>
            {counted(orders.totalDocs, 'order', 'orders', 'No orders yet.')}
          </p>
        </LinkPanel>
        <LinkPanel title="Your details" href="/account/profile" action="Edit details">
          <p>{user.name}</p>
          <p className={checkout.muted}>{[user.email, user.phone].filter(Boolean).join(' · ')}</p>
        </LinkPanel>
        <LinkPanel title="Addresses" href="/account/addresses" action="Manage addresses">
          <p className={checkout.muted}>
            {counted(addressCount, 'address on file', 'addresses on file', 'No addresses on file.')}
          </p>
        </LinkPanel>
      </div>
    </AccountPage>
  )
}
```

The `linkPanel` heading keeps the checkout `.panel h2` bottom margin, so every panel on the site spaces its title the same way.

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run --config tests/unit/vitest.config.mts tests/unit/account-overview.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(frontend)/account/page.tsx" tests/unit/account-overview.test.tsx
git commit -m "feat(account): overview panels with real order and reservation counts"
```

---

### Task 7: Sweep and verify

- [ ] **Step 1: No leftovers**

```bash
grep -rnE "#[0-9a-fA-F]{3,6}\b|border-radius|style=\{\{" "src/app/(frontend)/account" --include=*.tsx --include=*.css | grep -v "/checkouts/"
```

Expected: no output.

- [ ] **Step 2: Every referenced class exists**

```bash
for pair in "checkout:src/components/checkout/checkout.module.css" "styles:src/app/(frontend)/account/account.module.css"; do
  alias="${pair%%:*}"; css="${pair#*:}"
  grep -rhoE "\b$alias\.[A-Za-z][A-Za-z0-9]*" "src/app/(frontend)/account" --include=*.tsx --exclude-dir=checkouts \
    | sort -u | sed "s/^$alias\.//" | while read -r name; do
      grep -qE "^\.$name\b|[ ,]\.$name\b" "$css" || echo "MISSING .$name in $css"
    done
done
```

Expected: no `MISSING` lines.

- [ ] **Step 3: Types, lint, full unit suite**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm exec vitest run --config tests/unit/vitest.config.mts
```

Expected: all clean, all passing.

- [ ] **Step 4: Visual pass**

Start this worktree's dev server on a free port with the placeholder env vars stripped:

```bash
env -u DATABASE_URL -u PAYLOAD_SECRET -u R2_ACCESS_KEY_ID -u R2_BUCKET -u R2_ENDPOINT -u R2_SECRET_ACCESS_KEY pnpm dev --webpack -p 3010
```

Sign in, then compare each of `/account`, `/account/profile`, `/account/security`, `/account/addresses`, `/account/addresses/new`, `/account/orders`, `/account/orders/<id>` against `/account/checkouts/<id>` at desktop and 375px widths: header inset and eyebrow, panel borders, input height, button casing, and that panels line up when switching tabs.
