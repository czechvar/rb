# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Greenfield rebuild — no application code exists yet. This file captures project context and decisions so far; build/test/architecture sections will be added as the stack is scaffolded.

## What this project is

A from-scratch rebuild of **rockbusters.net**, a course-management / e-commerce site for an existing client. The same client also runs **snowbusters.eu**, which was built earlier; that codebase is the primary reference for this rebuild.

### Primary goal

Significantly better **on-site user handling** — account area, order history, etc. This already exists in the snowbusters codebase and should be matched or improved upon.

## Reference project: snowbusters

Source code: `/Users/janantl/Sites/snowbusters/` (also has its own `CLAUDE.md` worth reading).

Snowbusters stack: PHP 8.4 / Nette + Doctrine ORM backend (`api/`), Vue 3 + TypeScript + Vite SPA (`frontend/`), MySQL/MariaDB. Organized into mirrored domain modules (CourseMgmt, Course, Orders, Payments, UserMgmt, PageMgmt, etc.).

### What to reuse / take inspiration from

- **Payment gateways** — port the integrations and gateway abstraction to TypeScript. Confirmed feasible: the snowbusters gateway layer is ~1,900 LOC of HTTP API clients + a transaction state machine, with only shallow Nette/Doctrine coupling. This is a **rewrite, not a code copy** — the value is the proven API flows, signing, and callback edge cases. Snowbusters reference files:
  - `api/app/PaymentsModule/service/PaymentGateway.php` — gateway interface/base
  - `api/app/PaymentsModule/service/PaymentGatewayFactory.php` — gateway selection
  - Concrete gateways: `ComgateGateway.php`, `MuzaPayGateway.php` (+ `MuzaPay/` client), `PayPalGateway.php`, `AutopayGateway.php` (bank transfer)
  - `api/app/PaymentsModule/service/PaymentService.php`, `PaymentPresenter.php`
  - `api/app/model/Transaction/` — `Transaction` entity + `TransactionState` enum (the state machine to copy exactly)
  - Docs: `api/MUZAPAY_README.md`
  - Port care points: MuzaPay request **signing/crypto** must be byte-exact; webhooks must run server-side with stable public URLs; the `TransactionState` transitions are the subtle part.
- **Design** — get inspired by the snowbusters frontend; reuse/adapt rather than copy verbatim.
- **User handling & orders** — study `api/app/UserMgmtModule/` and `api/app/OrdersModule/` (+ `api/app/model/Order/`, `api/app/schema/order/`) as the functional spec for this rebuild's account area.

## User section

Self-registration with email verification, login (with lockout + verify-required panel), forgot/reset password, account profile (with pessimistic email-change flow), address management with Czech B2B fields (IČO/DIČ), change-password, and an `/account/orders` stub are live.

- Spec: `docs/superpowers/specs/2026-05-26-user-section-design.md`
- Plan: `docs/superpowers/plans/2026-05-26-user-section.md`
- Email goes through `@payloadcms/email-resend` with a console-adapter fallback when `RESEND_API_KEY` is unset (mirrors the R2 fallback pattern).
- Auth pages are under route group `(auth)`; account pages under `(account)` with a shared sidebar layout.
- All forms submit to Next.js Server Actions that call Payload's local API directly.
- Booking lives at `/book/[eventDateId]` (logged-in only) → confirmation at `/book/[eventDateId]/confirmation/[orderId]`. Users see their orders at `/account/orders` and detail + cancel-while-pending at `/account/orders/[id]`. Admin manages orders in `/admin/collections/orders` (state transitions enforced by hook; notes are append-only with author + timestamp). Capacity is derived from non-terminal orders and protected by a Postgres advisory lock at create time. Online payment is deferred — confirmed orders show bank-transfer instructions, admin marks paid manually.

## Code so far

- `src/payments/gateway.ts` — **draft** TypeScript port of the payment gateway abstraction: domain types (`Transaction`, `TransactionState`, `Money`), the `PaymentGateway` contract, and the factory config shape. No concrete gateways yet. Has a "DRAFT — open questions" block at the bottom to resolve before implementation. Unlike the PHP original, gateway methods return result objects instead of mutating the transaction; the (future) PaymentService owns persistence and state transitions.
- `src/payments/muzapay/` — **draft** port of the MuzaPay signing/auth primitives:
  - `signature-builder.ts` — builds the plaintext (ordered, trimmed, empties skipped) to be signed.
  - `signer.ts` — RSA-SHA256 (PKCS#1 v1.5) sign → base64 → `rawurlencode`. Header comment pins the byte-exactness details.
  - `token-provider.ts` — bearer token from `POST /v2/auth/token`, in-memory cached with a 30s margin.
  - All three are **unverified** — they must be checked against the MuzaPay sandbox, and `signature-builder`/`signer` need unit tests with test vectors once a test runner exists. The concrete `MuzaPayGateway` and HTTP client are not ported yet.

## Proposed stack (tentative — not final)

- Backend: **Payload CMS**
- Frontend: **Next.js**

This is a starting direction, not a commitment — revisit before scaffolding. Confirm with the user before locking in stack choices or generating boilerplate.

## Deployment

Hosted on **Vercel**. Required environment variables in the Vercel project settings:

- `DATABASE_URL` — Neon Postgres connection string. **In Vercel only** this is the **production branch** (`ep-weathered-pine-alvc3sdj`). See the database-branches warning below — local `.env` must never use this value.
- `PAYLOAD_SECRET` — long random string for Payload's auth
- `R2_BUCKET` — Cloudflare R2 bucket name (e.g. `rockbusters-media`)
- `R2_ENDPOINT` — `https://<account-id>.r2.cloudflarestorage.com`
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — R2 S3-API credentials
- `HOMEPAGE_HERO_MEDIA_ID` — Payload Media ID of the homepage hero background image. Optional; if unset, the hero renders without a background image.
- `NEXT_PUBLIC_SITE_URL` — public base URL used in email templates (e.g. `https://rockbusters.net`)
- `RESEND_API_KEY` — Resend transactional-email API key. If unset, Payload falls back to its console adapter (logs emails) — same defensive pattern as the R2 fallback.
- `EMAIL_FROM_ADDRESS` — sender address (e.g. `hello@rockbusters.net` in prod, `onboarding@resend.dev` in dev). Domain must be verified in Resend for prod.
- `EMAIL_FROM_NAME` — sender display name (e.g. `Rockbusters`).
- `EMAIL_REPLY_TO` — optional reply-to address.
- `ADMIN_ORDER_NOTIFICATIONS_EMAIL` — recipient of the "new booking" admin notification email. Falls back to `EMAIL_FROM_ADDRESS` if unset.
- `BANK_TRANSFER_DETAILS` — multi-line text (IBAN, beneficiary, etc.) injected into the "Booking confirmed" email. The order number is used as the variable symbol.

If any of the four `R2_*` vars is unset, Payload falls back to local-disk storage (useful for tests, broken for production).

> **⛔ Database branches — local `.env` must NEVER point at the production branch.** The production branch is `ep-weathered-pine-alvc3sdj`; it is set only in the Vercel project settings. On 2026-06-12, local `.env` and the Playwright e2e suite shared that host, leaking 421 test fixtures into production data (purged via `scripts/e2e-fixture-cleanup.ts`). To prevent recurrence:
> - **Local dev + e2e (`.env`)** → use the Neon **`dev`** branch connection string (a copy of production, so seeded demo data carries over). Never the production host.
> - **Integration tests (`.env.test`, loaded by `vitest.setup.ts` with `override: true`)** → use the dedicated Neon **`test`** branch. This DB is wiped/reseeded by tests, so it must be isolated from both dev and production.
> - Before pasting any `DATABASE_URL` into a local env file, check the host: if it is `ep-weathered-pine-alvc3sdj`, **stop** — that is production.

> **Dev gotcha — Resend sandbox sender.** `onboarding@resend.dev` only delivers to the verified email of the Resend account owner. Registering any other address locally makes the auto-fired verify email 403 from Resend, which Payload re-throws as a 403 APIError out of `payload.create` (`[register] payload.create failed: …` in the dev log). For local dev, **leave `RESEND_API_KEY` unset** (or comment it out in `.env`) so the console adapter is used and the verify link prints to stdout. Only re-enable Resend locally once you've verified a real sender domain.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (`czechvar/rb`) via the `gh` CLI; external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical defaults: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root (created lazily by /domain-modeling). See `docs/agents/domain.md`.
