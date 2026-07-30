# rockbusters.net rebuild — design

**Date:** 2026-05-22
**Status:** Approved design — Phase 1 proceeds to an implementation plan.

## 1. Overview

A from-scratch rebuild of **rockbusters.net**, a course/event e-commerce site
for an existing client. The client also runs **snowbusters.eu**, whose codebase
(`/Users/janantl/Sites/snowbusters/`) is the primary reference — snowbusters is
PHP 8.4 / Nette + Doctrine with a Vue 3 SPA.

The rebuild is a **fresh start**: no data migration. Content is re-created and
customers re-register.

### Goals

- Deploy and host on **Vercel** — the decisive driver for the stack change
  (PHP/Nette does not fit Vercel).
- Significantly better **on-site user handling** — account area, order history,
  profile. This is the headline goal.
- Reuse snowbusters' proven domain logic — payment gateways, course/event
  modelling, referral program — ported to TypeScript.
- Build the storefront UI to the rockbusters **Figma** design files — the
  visual source of truth (pending delivery). snowbusters is a structural/code
  reference, not a visual one.

### Non-goals (this design)

- **Blog** — deferred to post-launch.
- Data migration from the current rockbusters.net — out of scope (fresh start).

## 2. Stack & hosting

| Concern | Choice |
|---|---|
| Backend + frontend | **Payload 3 + Next.js** as a single app (Payload installs into a Next.js app) |
| Hosting | **Vercel** |
| Database | **Neon** (serverless Postgres), via Payload's Postgres adapter |
| File storage | **Cloudflare R2** via `@payloadcms/storage-s3` (R2 is S3-compatible; zero egress fees — chosen for an image-heavy public site) |
| Scheduled work | **Vercel Cron** |
| Language | **TypeScript** throughout |
| Storefront styling | **CSS Modules** (component-scoped) |
| Localization | **English only** — no Payload localization |

Payload provides the admin panel, authentication, collections, access control,
and APIs — replacing the hand-built `*-mgmt` modules of snowbusters. Next.js
renders the public storefront with SSR (real SEO, unlike snowbusters' Vue SPA).

**Vercel implications:** the database and file storage are external managed
services; scheduled jobs run as Vercel Cron rather than a long-running process;
the Payload admin may have minor cold-start latency (acceptable).

## 3. Data model

The content layer (Event / Event Date) feeds the commerce layer
(Order → Order Item → Participant). Diagram:
[`2026-05-22-rockbusters-data-model.html`](./2026-05-22-rockbusters-data-model.html).

### Content & catalogue

**Event** — the course/trip *concept* and its marketing content. Mirrors
snowbusters' `Course`.
- `title`, `slug`
- `shortDescription`
- `content` (rich text — Payload Lexical)
- `additionalInfo` (Payload blocks)
- `mainPicture` → Media, `gallery` → Media[]
- `vimeoId` (video)
- `categories` → Category[], `difficulties` → Difficulty[], `types` → Type[]
- `featured` (bool), `state` (draft · published)
- `seoTitle`, `seoKeywords`, `seoDescription`
- The location/guide list shown on an Event page is **derived** by aggregating
  across its Event Dates — not stored on the Event.

**Event Date** — a specific dated occurrence; **this is the purchasable unit**.
This merges snowbusters' separate `CourseDate` (dates) and `CoursePrice`
(prices), which were not linked to each other.
- `event` → Event
- `dateFrom`, `dateTo`
- `locations` → Location[], `guides` → Guide[], `airportFrom`/`airportTo` → Airport
  (occurrence-specific — the same Event can run at different crags/with different
  guides/from different airports on different dates)
- `price`, `vat`, `currency`
- `capacity` (max spots), `minParticipants` (date runs only if met)
- `extraContent` (rich text — date-specific info)
- `active`
- Availability = `capacity` − booked participants (see §5 for hold rules).

**Media** — Payload upload collection; files on Cloudflare R2; `alt`, auto `sizes`.

### Taxonomy & people

- **Category** — `name`, `slug`, `text`, `position`, `active`. Own landing page.
- **Difficulty** — `name`, `active`. Simple label.
- **Type** — `name`, `active`. Simple label.
- **Guide** (instructor) — `name`, `slug`, `bio`/`content` (rich), `photo`,
  `vimeoId`, `email`, `phone`, `featured`, SEO fields. Own page.
- **Location** — `name`, `slug`, `content` (rich), `address`, `city`, `country`,
  `lat`/`lng`, SEO fields. Own page + map.
- **Airport** — `name`, `iata`, `country`, `continent`, `lat`/`lon`, `size`.
  For fly-out trips.
- **Partner** — `name`, `slug`, `link` (external URL), `description` (rich),
  `logo` → Media, `featured`, `active`. Powers the public partner directory.
  Separate from BookingReference.

### Customers & orders

**User** — Payload auth collection. `email`, `password`, `name`, `addresses[]`,
`role` (customer · admin).

**Order** — belongs to a User.
- `orderNumber`
- `user` → User
- `state` — `created` → `pending` → `paid` / `cancelled` / `expired`
- `holdExpiresAt` (timestamp — see §5)
- `billingAddress`, `paymentMethod`
- `subtotal`, `discountTotal`, `total`, `totalVat`
- `discountCode` → DiscountCode (optional)
- `bookingReference` → BookingReference (optional)
- `commissionOwed` (snapshot — frozen at checkout)
- `transaction` → Transaction (one-to-one)

**Order Item** — a line in an Order.
- `order` → Order
- `eventDate` → Event Date
- `quantity` (number of participants)
- `unitPrice`, `lineTotal` — **price snapshot** at purchase time, so later price
  edits do not rewrite order history.

**Participant** — one row per booked spot.
- `orderItem` → Order Item
- `fullName`, `note`/`details`

**Cart** — no Cart table. The cart lives in browser state while shopping;
checkout creates Order + Order Items + Participants in a single transaction.
Discount/referral codes are validated and snapshotted onto the Order at checkout.

### Promotions, referral & payment

**DiscountCode** — generic promo code. `title`, `code`, `discount` (amount/%),
`description`, `start`/`end` (validity), optional `commissionEmail` /
`commissionValue`.

**BookingReference** — the partner **referral program**. `name` (partner),
`code`, `email` (where commission is paid), `discount` (customer receives),
`commission` (partner earns). A `BookingReferenceCommissionMail` is sent when a
referral order is paid.

**Transaction** — payment record; one-to-one with an Order. Matches the draft in
`src/payments/gateway.ts`.
- `uuid`, `order` → Order
- `price`, `priceWoVat`, `vat`, `currency`
- `state` — `created` · `begun` · `pending` · `paid` · `cancelled` · `failed`
- `paymentMethod` — `paypal` · `muzapay` · `comgate-card` · `comgate-transfer` ·
  `bank-transfer`
- `payload`, `callbackPayload` — gateway data

## 4. Payments architecture

Port of the snowbusters PHP gateway layer to TypeScript. This is a **rewrite**,
not a code copy — the value is the proven API flows, signing, and callback
edge cases. Draft work already exists in `src/payments/`.

### Layers

- **Gateways** — `ComGate`, `MuzaPay`, `PayPal`, `BankTransfer`, behind the
  `PaymentGateway` interface (`begin` / `handleWebhook` / `handleReturn` /
  `checkStatus` / `cancel`). A factory selects by payment method. Gateways are
  pure-ish: they talk to the provider and return result objects; they do not
  touch the database. (PHP gateways mutated the entity in place — the TS port
  returns results instead.)
- **PaymentService** — orchestration. Creates the Transaction, persists it, owns
  state transitions, updates the Order, triggers confirmation and commission
  emails. The only payment layer that knows about Payload.
- **Payload collections** — Transaction and Order are plain records.

### Flow

1. Checkout → PaymentService creates Order (`created`) + Transaction (`created`).
2. `begin()` → call the gateway, get a redirect URL, persist it
   (Transaction → `begun`), redirect the customer to the gateway.
3. The customer pays. Resolution arrives from **three sources, all idempotent**
   (the `isPaymentResult()` guard makes finishing a transaction safe to repeat):
   - **Webhook** — gateway POSTs server-to-server to
     `/api/payments/[gateway]/webhook` (Next.js route handler — public, stable
     URL); verify signature, resolve.
   - **Return** — customer redirected to `/payment/return`; check status, show
     result.
   - **Cron** — Vercel Cron hits `/api/payments/poll-status`; calls
     `checkStatus()` on still-pending transactions. Catches missed webhooks;
     replaces snowbusters' long-running cron.
4. On `paid`: Order → `paid`, capacity committed, confirmation email sent, and
   commission email sent if a BookingReference/commission applies.

### Secrets

Gateway credentials, the MuzaPay PEM private key, ComGate/PayPal credentials all
live in Vercel environment variables. The MuzaPay signer draft already takes the
key as a value, not a file path.

### MuzaPay signing — verification requirement

The MuzaPay signing primitives (`src/payments/muzapay/`) are **drafted but
unverified**. Before they can be relied on:
- `signature-builder` and `signer` need unit tests with MuzaPay's documented
  test vectors;
- the RSA-SHA256 (PKCS#1 v1.5) signature output must be confirmed byte-exact
  against the MuzaPay sandbox.

## 5. Capacity & order holds

A participant's spot is **reserved at checkout**, with a time-limited hold.

- An Order gets `holdExpiresAt` ≈ 30 minutes from creation (covers checkout +
  the payment window).
- Order states: `created` → `pending` (payment begun) → `paid` / `cancelled` /
  `expired`.
- A **Vercel Cron** job (`/api/orders/release-holds`) marks unpaid orders past
  `holdExpiresAt` as `expired` and frees their spots.
- **Availability** = `capacity` − participants in orders that are either `paid`,
  or unpaid with a live hold (`holdExpiresAt` in the future).
- **Edge case:** if a webhook reports `paid` for an order whose hold has already
  expired, PaymentService re-checks capacity. If the date is now full, the order
  is flagged for manual handling/refund rather than silently overselling.

Total scheduled jobs: two Vercel Cron jobs — payment-status polling and hold
release.

## 6. Frontend & SEO

### Architecture

- Next.js App Router in the same app as Payload.
- **Public storefront** — Server Components with SSR for SEO.
- **Admin** — Payload admin at `/admin`, replacing snowbusters' `*-mgmt` modules.
- **Visual** — built to the rockbusters Figma designs (see below). Rich content
  authored in Payload's Lexical editor (snowbusters used EditorJS).

### Visual design

The rockbusters **Figma** file is the source of truth for the storefront's
visual design — layout, palette, typography, components. File: **RB-website-2025**
— https://www.figma.com/design/ch2aIrEQMWVr6Q1uGorVoV/RB-website-2025
(fileKey `ch2aIrEQMWVr6Q1uGorVoV`). The storefront visual build (Phase 2)
consumes it.

snowbusters is a **structural and code reference only** — component
decomposition, domain-driven page structure, and the patterns worth keeping
(header, footer, page layout, featured categories/guides, contact form, maps,
cookie consent). Its visual look — including the blue palette — does not carry
over; the Figma design defines the look.

The Figma design is translated to React + CSS Modules using the Figma MCP
integration (`get_design_context`, `/figma-use`, `/figma-generate-design`).

### Page & URL inventory

New URL structure. Diagram:
[`2026-05-22-rockbusters-page-inventory.html`](./2026-05-22-rockbusters-page-inventory.html).

**Public storefront (SSR):**
`/`, `/events`, `/events/[slug]`, `/categories/[slug]`, `/locations`,
`/locations/[slug]`, `/guides`, `/guides/[slug]`, `/partners`,
`/partners/[slug]`, `/[slug]` (CMS content pages — about, FAQ, terms, contact).

**Checkout:** `/cart`, `/checkout`, `/payment/return`.

**Customer account (login required):** `/account`, `/account/orders`,
`/account/orders/[id]`, `/account/profile`, plus `/login`, `/register`,
`/forgot-password`, `/reset-password/[token]`.

**System:** `/admin/*` (Payload), `/api/payments/[gateway]/webhook`,
`/api/payments/poll-status`, `/api/orders/release-holds`.

### SEO redirect map

Preserving SEO is a **hard requirement**. Every URL on the current live
rockbusters.net must be mapped to its new equivalent, with **301 redirects** for
any changed path. The redirect map is built by crawling the current live site
and is a first-class deliverable of Phase 2. Redirects are implemented in
`next.config` / `vercel.json` / middleware (not nginx). Reference: snowbusters'
own `redirects.md`.

## 7. Delivery phases

The design above is the full architecture. It is built and shipped in phases;
**each phase gets its own implementation plan**.

1. **Foundation** — scaffold Payload 3 + Next.js, Neon, Vercel, Cloudflare R2.
   Users/auth + all content collections (Event, Event Date, Media, Category,
   Difficulty, Type, Guide, Location, Airport, Partner). Admin panel fully
   usable; no storefront.
2. **Storefront** — public SSR pages built to the Figma design (CSS Modules),
   SEO redirect map.
3. **Commerce** — cart, checkout, Order/Order Item/Participant, capacity +
   holds, discount + referral codes.
4. **Payments** — port the gateways (MuzaPay signing already drafted),
   Transaction collection, webhook/return routes, both cron jobs.
5. **Customer account** — dashboard, order history, profile/addresses.

**The implementation plan that follows this design covers Phase 1 only.**

## 8. Existing draft code

`src/payments/` already contains draft TypeScript:
- `gateway.ts` — domain types and the `PaymentGateway` contract.
- `muzapay/signature-builder.ts`, `signer.ts`, `token-provider.ts` — MuzaPay
  signing/auth primitives (drafted, unverified — see §4).

These drafts predate the scaffolded project; they will be folded into the real
project structure during Phase 4 and must compile/test against the actual stack
before being trusted.
