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

- `DATABASE_URL` — Neon Postgres connection string (production branch)
- `PAYLOAD_SECRET` — long random string for Payload's auth
- `R2_BUCKET` — Cloudflare R2 bucket name (e.g. `rockbusters-media`)
- `R2_ENDPOINT` — `https://<account-id>.r2.cloudflarestorage.com`
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — R2 S3-API credentials

If any of the four `R2_*` vars is unset, Payload falls back to local-disk storage (useful for tests, broken for production).
