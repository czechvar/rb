# User section — design

**Date:** 2026-05-26
**Status:** Approved design — proceeds to implementation plan.
**Phase:** Maps to **Phase 5 (Customer account)** of `2026-05-22-rockbusters-rebuild-design.md`, brought forward ahead of Phase 3 (Commerce) because the booking process depends on a working customer-auth UX.

## 1. Overview

Build the customer-facing user section end to end: self-registration with email
verification, login, forgot-password, password reset, account profile/addresses
editing, and a stub for order history. Introduces transactional email
(Resend) for the first time in this project.

### Goals

- **Smooth registration** — minimal friction, clear verification flow, no
  dead-ends when something goes wrong.
- **Working forgot-password** — end to end including the actual outbound mail.
- **Editable account data** — name, phone, email, addresses (with Czech-market
  B2B fields), password.
- **Lay groundwork for booking** — `/account/orders` route exists as a stub so
  the booking spec can fill it in without re-architecting the account shell.

### Non-goals

- Order history rendering (booking spec).
- Account deletion / GDPR data export (deferred).
- "Have I been pwned" password check (deferred).
- Other-session invalidation on password change (Payload uses stateless JWTs;
  needs a deny-list — deferred).
- React Email templates (only two emails right now; YAGNI — revisit when
  booking confirmations land).

## 2. Architecture

**Shape A — Server Actions calling Payload local API; multi-route account.**

- Forms (`/login`, `/register`, `/forgot-password`, `/reset-password/[token]`,
  profile-edit, address CRUD, change-password) submit to **Next.js Server
  Actions**.
- Actions call Payload's **local API** via `getPayload({ config })` — no HTTP
  hop, type-safe.
- Auth cookie (`payload-token`) written via Next.js `cookies().set()` using the
  token returned by `payload.login()` / `payload.resetPassword()`.
- Account UI under a route group `(account)` with a shared sidebar layout. Each
  subpage is a real SSR route (`/account`, `/account/profile`,
  `/account/addresses`, `/account/security`, `/account/orders`).
- Public auth pages under a route group `(auth)` without the account shell.

This matches the Payload-on-Next.js consensus pattern, gives real SSR + working
back/forward, and avoids hand-rolled REST glue.

## 3. Users collection — schema changes

Extend `src/collections/Users.ts`:

### Auth options

- `auth.verify: true` — enables Payload's built-in email verification. Blocks
  login until the verify link is clicked.
- `auth.forgotPassword: { generateEmailSubject, generateEmailHTML }` — branded
  reset email (see §4 for templates).
- `auth.verify: { generateEmailSubject, generateEmailHTML }` — branded verify
  email.
- `auth.maxLoginAttempts: 5`, `auth.lockTime: 600` (10 min) — Payload-native
  lockout.
- `auth.tokenExpiration: 60 * 60 * 24 * 30` — 30-day login sessions. Deliberate
  choice for an e-commerce site; documented in code.

### Access

- `access.create: anyone` — opens self-registration (was `isAdmin`).
- `access.read: isAdminOrSelf` (unchanged).
- `access.update: isAdminOrSelf` (unchanged).
- `access.delete: isAdmin` (unchanged — no self-delete in this spec).
- **Field-level access** on `role`: `field.access.update = isAdmin` so customers
  cannot promote themselves.

### Fields

| Field | Type | Notes |
|---|---|---|
| `name` | text, required | unchanged |
| `phone` | text, required | regex `^\+?[\d\s\-()]{6,20}$` |
| `role` | select (`customer` \| `admin`), required, default `customer` | field-level admin-only update |
| `addresses[]` | array | see below |
| `pendingEmail` | text, nullable, hidden | for pessimistic email-change flow |
| `pendingEmailToken` | text, nullable, hidden, admin-read-only | |
| `pendingEmailExpiresAt` | date, nullable, hidden | |
| `lastVerifyEmailSentAt` | date, nullable, hidden | throttle for resend-verification |

**`addresses[]` row fields:**

- `label` — text, optional ("Home", "Work")
- `isDefault` — checkbox, optional (mutual exclusion enforced in Server Actions)
- `firstName`, `lastName` — text, both required
- `street`, `city`, `postalCode`, `country` — text, all required
- Company block (group, all optional; block is "filled in" iff `companyName` is
  non-empty):
  - `companyName` — text
  - `ico` — text, validated `/^\d{8}$/`
  - `dic` — text, validated `/^CZ\d{8,10}$/`

Greenfield Postgres: no migration script needed beyond Payload's auto-migrate.

## 4. Mailer (Resend)

- **Adapter:** `@payloadcms/email-resend`, configured on `payload.config.ts` as
  `email: resendAdapter({ apiKey, defaultFromAddress, defaultFromName })`.
- **Fallback:** if `RESEND_API_KEY` is unset, Payload falls back to its console
  adapter (logs emails) — same defensive pattern as the R2 fallback in
  `payload.config.ts`. Tests rely on this.

### Env vars

| Var | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | prod/preview | secret |
| `EMAIL_FROM_ADDRESS` | yes | `hello@rockbusters.net` (prod) / `onboarding@resend.dev` (dev) |
| `EMAIL_FROM_NAME` | yes | `Rockbusters` |
| `EMAIL_REPLY_TO` | optional | `info@rockbusters.net` |
| `NEXT_PUBLIC_SITE_URL` | yes | base URL used in mail templates |

**Domain verification** in Resend (SPF + DKIM DNS records for
`rockbusters.net`) is a deploy step, documented here but not built by code.

### Templates

Inline branded HTML strings in two helpers (`src/lib/email/templates/`):

- `verifyEmail({ token, name })` — subject `"Welcome to Rockbusters — please verify your email"`, CTA button to `${siteUrl()}/verify-email?token=${token}`.
- `resetPassword({ token, name })` — subject `"Reset your Rockbusters password"`, CTA button to `${siteUrl()}/reset-password/${token}`.
- `confirmEmailChange({ token, name })` — subject `"Confirm your new Rockbusters email"`, CTA button to `${siteUrl()}/account/profile/confirm-email?token=${token}`. Used by the email-change flow (§7).

Both Payload built-ins (`auth.verify`, `auth.forgotPassword`) accept
`generateEmailSubject` / `generateEmailHTML` callbacks that call these helpers.

### Base URL helper

`src/lib/url.ts` exports `siteUrl()` reading `NEXT_PUBLIC_SITE_URL`. Used by
templates so links point at the right env.

## 5. Routes & URL inventory

### Public auth (`src/app/(frontend)/(auth)/…`)

| Path | Description |
|---|---|
| `/login` | Email + password. `?from=…` for post-login redirect. `?verified=1` and `?password-reset=1` show success banners. |
| `/register` | Email, password, name, phone. Redirects to `/verify-email/pending` on success. |
| `/forgot-password` | Single email field. Always renders the same success state — no enumeration. |
| `/reset-password/[token]` | New-password form. Auto-logs in on success. |
| `/verify-email` | Server component; reads `?token=…`, verifies, redirects to `/login?verified=1` or renders error + Request-new-link form. |
| `/verify-email/pending` | Post-registration page: "Check your inbox" + Resend button. |
| `/logout` | Server Action only — clears cookie, redirects to `/`. |

### Authenticated (`src/app/(frontend)/(account)/…`)

| Path | Description |
|---|---|
| `/account` | Dashboard — greeting, profile-completeness card, "0 orders" card. |
| `/account/profile` | Edit name, phone, email. Email change triggers pessimistic re-verify flow (§7). |
| `/account/profile/confirm-email` | Confirms a pending email change via token. |
| `/account/addresses` | List addresses with Edit / Delete / Set-default actions. |
| `/account/addresses/new` | Add-address form. |
| `/account/addresses/[idx]/edit` | Edit by index in the array. |
| `/account/security` | Change password (current + new + confirm). |
| `/account/orders` | Stub: "no orders yet" empty state. Booking spec fills in the list. |

### Middleware (`src/middleware.ts`)

- On `/account/**`: if `payload-token` cookie missing/invalid (shallow JWT check
  with `PAYLOAD_SECRET`), redirect to `/login?from=<path>`.
- On `/login`, `/register`: if cookie is valid, redirect to `/account`.
- Authoritative auth still happens in Server Components via
  `payload.auth({ headers })`; middleware is a cheap pre-filter only.

### Server Action layout

Colocated with their forms: `…/(auth)/login/actions.ts`,
`…/(account)/profile/actions.ts`, etc. Each action:

1. zod-parses the FormData.
2. Calls Payload local API.
3. Sets/clears cookies via `cookies()` as needed.
4. Returns `{ ok: true, redirect?: string } | { ok: false, fieldErrors?: Record<string, string>, formError?: string }`.

Caller — a Client Component using `useActionState` — renders `fieldErrors`
inline and `formError` as a top-of-form banner.

## 6. Auth flow

### Registration

1. `/register` form (email, password, name, phone).
2. Action zod-validates (email format, password ≥ 8 chars, name non-empty,
   phone regex).
3. `payload.create({ collection: 'users', data: { …, role: 'customer' } })`.
4. Payload creates user with `_verified: false`, generates `_verificationToken`,
   sends verify email (rendered via `verifyEmail` template).
5. Action **does not log in** (verify gate). Redirects to
   `/verify-email/pending?email=…`.

**Edges:** email already in use → `fieldErrors.email`. Send failure → user
lands on pending page anyway; Resend button is the recovery.

### Verification

1. User clicks email link → `/verify-email?token=…`.
2. Server component calls `payload.verifyEmail({ collection: 'users', token })`.
3. Success → `redirect('/login?verified=1')`.
4. Bad/expired → error UI with a single-input "Resend verification" form.

### Resend verification

Server Action used by `/verify-email/pending` and the error page above:

1. zod-validate email.
2. Lookup; if missing or already verified → return success silently.
3. Throttle by `lastVerifyEmailSentAt` (60 s). If under threshold → success
   message but no send.
4. Otherwise generate fresh `_verificationToken`, update user (sets
   `lastVerifyEmailSentAt`), send verify email.

### Login

1. `/login` form. `?from=` carries post-login redirect (sanitized).
2. `payload.login({ collection: 'users', data: { email, password } })`.
3. **Success** → set `payload-token` cookie, `redirect(sanitizeRedirect(from) ?? '/account')`.
4. **Not verified** → `{ ok: false, formError: 'verify_required', email }`. Login page renders an inline verify panel with Resend button.
5. **Bad credentials** → `{ ok: false, formError: 'Invalid email or password.' }`. Same message for unknown email and wrong password.
6. **Locked** → `{ ok: false, formError: 'Account temporarily locked. Try again in ~10 minutes or reset your password.' }`.

### Cookie

- Name: `payload-token` (Payload default).
- `httpOnly`, `sameSite: 'lax'`, `path: '/'`, `secure` in prod, `maxAge` matches `auth.tokenExpiration` (30 days).

### Logout

Server Action: clears cookie, redirects to `/`. Triggered from the account
shell's "Sign out" button.

### Password rules

≥ 8 chars, no complexity requirement. zod-enforced on both client (display)
and server (action).

### Rate limiting

`src/lib/rate-limit.ts` — in-memory token bucket keyed by IP+route. 5 requests
/ 10 min for `register`, `forgot-password`, `resend-verification`. Documented
limitation: best-effort across serverless instances; production-grade would use
Vercel KV — listed as future work.

## 7. Password reset, profile edit, addresses, change password

### Forgot password (`/forgot-password`)

Throttled. Action calls `payload.forgotPassword`; all errors swallowed; renders
the same success state regardless: *"If an account exists for that address, we
sent a reset link."*

### Reset password (`/reset-password/[token]`)

Form unconditionally renders (no pre-validation of token).
`payload.resetPassword({ data: { token, password } })` → on success, set auth
cookie (auto-login), redirect to `/account?password-reset=1`. Bad/expired
token → form error + link to `/forgot-password`.

### Profile edit (`/account/profile`)

Fields: name, phone, email. A `currentPassword` field appears (required) iff
the email field is dirty.

- **Name/phone change only** → simple `payload.update`.
- **Email change** (pessimistic flow — keeps user logged-in-able with the old
  email until the new one is confirmed):
  1. Re-auth via `payload.login` with current email + provided current password.
  2. Reject if the new email belongs to another user.
  3. Set `pendingEmail`, `pendingEmailToken`, `pendingEmailExpiresAt` on the
     user. **`email` is unchanged.**
  4. Send `confirmEmailChange` email to the new address.
  5. Profile page shows a banner with the pending address + a "Cancel pending
     change" Server Action (clears the three fields).
- **Confirming** (`/account/profile/confirm-email?token=…`, auth required):
  - Lookup user by `pendingEmailToken`. **Verify the looked-up user id matches
    the logged-in user id** — reject otherwise (defense in depth: prevents a
    logged-in attacker from completing someone else's pending change if they
    somehow obtained the token).
  - Check expiry. Swap `email = pendingEmail`, clear all three pending fields,
    redirect to `/account/profile?email-changed=1`.

### Addresses (`/account/addresses`, `/new`, `/[idx]/edit`)

List page: cards per address (label, name line, formatted address lines,
"Default" badge, Edit / Delete / Set-default actions, plus an "Add address"
button).

Form (shared between `new` and `edit`): label, firstName, lastName, street,
city, postalCode, country, plus a "Use as a company invoice address" checkbox
that reveals `companyName` / `ico` / `dic`.

Actions: `addAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`.
Each reads the current user, mutates the addresses array immutably, calls
`payload.update({ id: user.id, data: { addresses: newArray } })`.

**Default exclusivity** enforced at the action layer (simpler than a collection
hook and easier to test, since addresses are only ever mutated through these
actions).

Row addressing by index in URL, validated `0 ≤ idx < addresses.length`.

### Change password (`/account/security`)

Form: current password, new password, confirm. Action:

1. zod (new ≥ 8 chars, matches confirm, not equal to current).
2. Re-auth via `payload.login` with current credentials. Fail →
   `fieldErrors.currentPassword`.
3. `payload.update({ id, data: { password } })`.
4. Success toast. Other-session invalidation: future work (see §1 non-goals).

## 8. UI shell + visual design

- **Auth pages**: centered card, ~440 px max-width, on the existing marketing
  background. Uses the existing design-system primitives from round 1; no new
  typography or palette.
- **Account shell** (`src/app/(frontend)/(account)/layout.tsx`):
  - Two-column on ≥ 900 px: 240 px sidebar (nav + "Signed in as <email>"
    footer), right content area.
  - Single-column stacked below 900 px (sidebar → horizontal pill nav).
  - Sidebar items: Overview, Profile, Addresses, Security, Orders, then a
    divider, then Sign out.
  - Active-route highlight via `usePathname` (Client Component for the sidebar
    only; pages stay server).
- **Forms**: label above input, inline field errors below, full-width primary
  button; non-field errors as a banner at top. Buttons disable during pending
  state via a `useFormStatus` wrapper.
- **No new design tokens.** All red, spacing, type pulled from design-system
  round 1.
- **A11y**: every input has a real `<label htmlFor>`, errors via
  `aria-describedby`, primary buttons have visible focus rings, banners use
  `role="status"` (success) or `role="alert"` (error).

## 9. Validation, errors, security

- **zod schemas** colocated with actions (`…/login/schema.ts`, etc.). One
  source of truth per form.
- **Uniform action return shape** (defined in §5).
- **CSRF**: Server Actions are immune (origin-checked + same-site cookie). No
  extra token needed.
- **Open-redirect protection**: `sanitizeRedirect(from)` accepts only strings
  that start with a single `/` and contain no `\\`, `//`, or `:`. Else fallback
  to `/account`.
- **Email enumeration policy**:
  - **No leak**: `/forgot-password`, resend-verification.
  - **Leak**: `/register` (returns "email already in use"); `/login`
    verify-required branch (returns the email back). Both are intentional and
    consistent with snowbusters.
- **Rate limiting** as in §6.
- **Hidden fields** on Users (`pendingEmail*`, `lastVerifyEmailSentAt`): admin
  `hidden: true`, field-level read access admin-only so REST/GraphQL strip
  them.

## 10. Testing

- **Vitest unit** — every zod schema (happy + bad inputs), `sanitizeRedirect`,
  `rate-limit` math, `siteUrl()`.
- **Payload integration** (match existing pattern):
  - `auth.verify: true` produces `_verified: false` on create.
  - `forgotPassword` → `resetPassword` succeeds; reused token fails.
  - Email-change pessimistic flow: pending fields populated; `email` unchanged
    until confirm token applied; expired pending token rejected.
  - Default-address exclusivity: setting `isDefault: true` on row B clears row
    A.
  - Field access: a customer cannot update their own `role`.
- **Playwright smoke**:
  - `/register` happy path → success page → email captured in test transport.
  - `/login` (unverified) → renders verify panel.
  - `/login` (verified) → lands on `/account`.
  - `/forgot-password` → submits → success message regardless of email
    validity.
  - `/account` redirects to `/login` when unauthenticated.
- **Email transport in tests**: a test-only Payload email adapter (the same
  fallback path as missing `RESEND_API_KEY`, but capturing into an array
  instead of logging). Tests assert on `to` / `subject` / `html`.

## 11. Deliverables checklist

- [ ] Users collection extended (§3) + Payload typegen regenerated.
- [ ] Resend adapter wired in `payload.config.ts` with env-aware fallback (§4).
- [ ] `src/lib/url.ts`, `src/lib/email/templates/*`, `src/lib/rate-limit.ts`,
      `src/lib/redirect.ts` (sanitize helper).
- [ ] Public auth routes + Server Actions (§5, §6).
- [ ] Authenticated account routes + Server Actions (§5, §7).
- [ ] Middleware for cookie pre-check (§5).
- [ ] Account shell layout + sidebar (§8).
- [ ] Vitest + Playwright suites (§10).
- [ ] `.env.example` updated with new vars; `CLAUDE.md` deployment section
      updated to list Resend env vars.

## 12. Open questions for implementation plan

- Confirm the exact import path/API of `@payloadcms/email-resend` against the
  installed Payload version before locking the wiring (§4).
- Choose the test email-adapter approach (custom adapter vs. mocking
  `payload.sendEmail` per test). Decide in the plan; default to a custom
  adapter for one consistent test path (§10).
