# Benefit+ (MuzaPay) Payment Gateway (Design Spec)

Status: ready-for-agent
Date: 2026-09-02

## Problem Statement

Rockbusters accepts online card payment through Comgate: the booking
confirmation page shows a "Pay by card" button while the order is `pending`,
and a Comgate webhook chains the order `pending → confirmed → paid`. Czech
customers frequently hold an employee benefit account with Benefit+, which
settles through the MuzaPay gateway, and cannot use it here.

This spec adds a second button — "Pay with Benefit+" — next to the card button,
backed by a MuzaPay gateway implementation.

Two properties of MuzaPay make this more than a copy of the Comgate work:

1. **There is no webhook.** `MuzaPayGateway::handle()` throws "Not implemented"
   in the snowbusters original, and the Benefit+ documentation is explicit that
   the payment result must always be read from the status-check endpoint and
   never inferred from the browser redirect. Every piece of order-state
   chaining we have today lives inside `applyComgateWebhook`.
2. **MuzaPay settles in CZK.** Rockbusters event dates default to `EUR`. The
   snowbusters README carries this as an unresolved TODO: *"Gateway is in CZK
   but eshop in EUR"*.

## Research Summary

Primary references:

- Benefit+ gateway documentation:
  https://benefitplus.atlassian.net/wiki/spaces/BP2/pages/753665/Platebn+br+na
- snowbusters `api/app/PaymentsModule/service/MuzaPayGateway.php`
- snowbusters `api/app/PaymentsModule/service/MuzaPay/MuzaPayClient.php`
- snowbusters `api/MUZAPAY_README.md`
- Existing Comgate work: `docs/superpowers/plans/2026-08-28-comgate-payment-gateway.md`

Facts established from those sources:

- Endpoints: sandbox `https://api.gate.int.pay.muza.cz`, production
  `https://api.gate.pay.muza.cz`. The legacy `api.gate.muzapay.cz` and
  `gate.pay.muza.app` hosts are deprecated.
- REST/JSON, UTF-8, HTTPS only, RFC 3339 UTC timestamps.
- Auth is a bearer token from `POST /v2/auth/token` (HTTP Basic with eshop
  credentials), plus a per-request RSA signature passed as a `?signature=`
  query parameter.
- Payments carry a product category. Benefit+ **forbids a single payment
  covering a cart with mixed categories**. A Rockbusters order is always one
  trip, so `LEISURE` always applies and no split-payment logic is needed.
- The documentation requires attempting cancellation for payments left in an
  uncertain state, with at most three retries at progressive intervals.
- Order discounts in this codebase are whole-number **percentages**
  (`DiscountCodes.discountPercent`, 1–99), applied in
  `src/collections/orders/hooks.ts` as
  `discountAmount = round(basePrice × discountPercent / 100)`. A CZK total
  therefore derives from a CZK unit price with the identical formula — no
  currency-conversion logic is implied by discounts.

Three MuzaPay primitives were ported earlier and are already in the repo, but
have **never been run against a live gateway**: `signature-builder.ts`,
`signer.ts`, `token-provider.ts`.

## Decisions

Settled with the user during design:

| Question | Decision |
|---|---|
| Which orders can pay with Benefit+? | Those whose event date has a CZK price. A CZK price is added to event dates as a prerequisite. |
| How far does CZK reach? | Benefit+ only. The order stays EUR everywhere else. No storefront currency switcher, no FX conversion. |
| How is the payment result resolved? | Status check on the return URL, plus a Vercel Cron sweep for abandoned sessions. |
| Credentials | Sandbox credentials are in hand; the flow is verified end to end against the sandbox before merge. |
| Button placement | Booking confirmation page only. `/account/orders/[id]` is unchanged. |
| Env var prefix | `MUZAPAY_*`, matching the `src/payments/muzapay/` namespace and the actual API vendor, even though the button reads "Benefit+". |
| Cron cadence | Every 10 minutes. |

## Design

### 1. Prerequisite — CZK pricing

| Collection | Field | Notes |
|---|---|---|
| `EventDates` | `priceCzk` — optional `number`, `min: 0` | Admin description: "CZK price per person, used only for Benefit+ payments. Leave empty to disable Benefit+ for this trip." |
| `Orders` | `unitPriceCzk`, `totalPriceCzk` — `number`, `readOnly` | Snapshotted on create, mirroring the existing `unitPrice`/`totalPrice` pair. Both null when the event date has no CZK price. |

`src/collections/orders/hooks.ts` already computes, on create only:

```
basePrice      = unitPrice × participantCount
discountAmount = round(basePrice × discountPercent / 100)
totalPrice     = basePrice − discountAmount
```

The CZK total runs those same three lines against `unitPriceCzk`, guarded so
that a missing `priceCzk` leaves both new fields null rather than zero. Zero is
a legitimate price and must not be confused with "Benefit+ unavailable".

Nothing else changes: order currency stays `EUR`, and the storefront, emails,
admin columns, and accounting exports are untouched.

Schema change lands through `pnpm payload migrate:create` so the Drizzle
snapshot is generated alongside the migration — never a hand-written migration.

**Accepted consequence:** a EUR order can be settled by a CZK transaction. The
two amounts are independent admin-set numbers, not an FX conversion, so they
will drift from the spot rate over time. This is the deliberate trade for
carrying no FX logic, and it is the reason the CZK amount is shown on the
button (see §5).

### 2. Module structure

`src/payments/order-payment-service.ts` is Comgate-shaped today: transaction
store, domain mapping, `begin`, and webhook handling in one file. Benefit+
resolves by polling rather than webhook, so the shared part — the order-state
chain — must come out of the webhook handler.

New layout:

- **`src/payments/transaction-store.ts`** — `PayloadTransactionStore`,
  `toGatewayTransaction`, and the `OrderDoc`/`TransactionDoc` narrowings. Used
  by both gateways.
- **`src/payments/order-transitions.ts`** — `applyOutcome(txnDoc, outcome)`:
  the idempotency guard, the `pending → confirmed → paid` two-step, the
  cancelled path, and the deliberate write ordering (order transitions first,
  transaction marked terminal last) that is currently reasoned about in
  comments inside `applyComgateWebhook`. One function, both gateways, one place
  where that reasoning lives.
- **`src/payments/order-payment-service.ts`** — public API only:
  `beginComgatePayment`, `beginBenefitPlusPayment`, `applyComgateWebhook`,
  `resolveBenefitPlusPayment(uuid)`, `sweepBenefitPlusPayments()`.
- **`src/payments/money.ts`** — `toMinorUnits`, lifted verbatim from
  `comgate/gateway.ts`. Both gateways need decimal-string → integer minor
  units, and the string-based implementation must not be replaced by float
  multiplication.

*Alternative considered and rejected:* add the Benefit+ functions to the
existing file. It reaches roughly 450 lines mixing two gateways with different
resolution models, and the order-state chain ends up either duplicated or
shared through an awkward internal export.

### 3. The gateway — `src/payments/muzapay/`

Three new files join the three existing primitives.

**`config.ts`** — `muzapayConfigFromEnv()` fails fast on missing credentials,
matching `comgateConfigFromEnv()`. Also exports `isBenefitPlusConfigured()`,
which returns a boolean without throwing, so the UI can hide the button in
environments with no credentials.

**`client.ts`** — port of `MuzaPayClient.php`: `postJson`, `getJson`, `put`,
each asserting an expected HTTP status and translating transport and parse
failures into `PaymentGatewayError`.

**`gateway.ts`** — `MuzaPayGateway implements PaymentGateway`.

`begin()` — the field order is signature-critical and must not be reordered:

```
signature = signer.signToUrlEncoded(builder.build([
  correlationId, amount, productCode, orderReferenceCode,
  orderDescription, merchantData, returnUrl, language,
]))

POST /v2/payments/init?signature=…
  Authorization: Bearer <token>
  x-correlation-id: <transaction uuid>
  body: { amount, productCode, orderReferenceCode,
          orderDescription, merchantData, returnUrl, language }

→ { paymentId, gatewayUrl, currency, beneficiaryId }
```

Field derivation:

- `correlationId` — the transaction UUID.
- `amount` — `toMinorUnits(transaction.money.amount)`, i.e. haléře.
- `productCode` — `LEISURE` (see Research Summary).
- `orderReferenceCode` — **`order.orderNumber`**. The snowbusters original
  sent the numeric database id; the order number is the human identifier
  Benefit+ support will quote back at us. This is a deliberate divergence and
  should be commented as one.
- `orderDescription` — the event title, truncated to 255 characters.
- `merchantData` — `base64(transaction.uuid)`.
- `returnUrl` — `` `${backendBaseUrl}/api/payments/muzapay/return?refId=${uuid}` ``.
  As with `ComgateGateway`, `backendBaseUrl` is passed into the gateway's
  config by `order-payment-service.ts` (which sources it from `siteUrl()`)
  rather than read from the environment inside the gateway, so the gateway
  stays testable without env setup.
- `language` — `cs`.

Returns `BeginResult` with `redirectUrl: gatewayUrl` and
`gatewayTransactionId: paymentId`; the caller persists the payload and moves
the transaction to `begun`, exactly as the Comgate path does.

`checkStatus()` — sign `[paymentId]`, `GET /v2/payments/{id}/state?signature=…`,
then map `paymentState` (upper-cased):

| MuzaPay `paymentState` | Our `TransactionState` |
|---|---|
| `PAID` | `paid` |
| `CANCELED` (single L) | `cancelled` |
| `DECLINED`, `EXPIRED` | `failed` |
| `IN_PROGRESS_UNPAID`, `PENDING_INFO` | `null` — still pending |
| anything else | `null` — still pending |

`handleReturn()` delegates to `checkStatus()`; the documentation is explicit
that the redirect alone proves nothing.

`handleWebhook()` throws `PaymentGatewayError('Benefit+ does not send
webhooks — resolve via checkStatus.')`, mirroring the PHP original. No webhook
route is created for this gateway.

`cancel()` — sign `[paymentId]`, `PUT /v2/payments/{id}/cancel?signature=…`
expecting HTTP 202, then re-run the state check and apply any terminal result.
Retries are not implemented as an inner loop; the cron sweep re-attempts on
each pass, which satisfies the documented "progressive intervals" guidance
without a bespoke retry ladder.

### 4. Routes

**`GET /api/payments/muzapay/return?refId=<uuid>`** — looks up the
transaction, calls `resolveBenefitPlusPayment(uuid)`, then redirects to
`/account/orders/{orderId}`. It never surfaces a 500 to the payer: a gateway
error is logged and the redirect happens anyway, because the sweep in the next
section is the safety net. A missing or unknown `refId` redirects to `/`,
matching the existing Comgate return route.

**`GET /api/payments/muzapay/reconcile`** — the cron endpoint. Authenticated
with `Authorization: Bearer ${CRON_SECRET}`, the header Vercel sends
automatically for scheduled invocations; any other caller gets a 401. It finds
transactions where `paymentMethod = 'muzapay'` and `state = 'begun'`, oldest
first, capped at 50 per run, and for each one calls `checkStatus()` and applies
any outcome through `applyOutcome`. A transaction still unresolved more than 60
minutes after creation additionally gets a `cancel()` attempt. One failing
transaction must not abort the sweep — failures are logged per transaction and
the loop continues.

`vercel.json` gains:

```json
"crons": [{ "path": "/api/payments/muzapay/reconcile", "schedule": "*/10 * * * *" }]
```

**Plan requirement:** sub-daily cron schedules need the Vercel Pro plan. On
Hobby, crons run at most once per day, which would leave abandoned payments
unresolved for up to 24 hours.

### 5. UI — booking confirmation page

`src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/actions.ts` gains
`payWithBenefitPlusAction(orderId)`, mirroring `payByCardAction`: require the
user, begin the payment, redirect to the gateway.

The page renders, while `order.state === 'pending'`:

- the existing "Pay by card" button, unchanged;
- a "Pay with Benefit+" button, rendered only when
  `totalPriceCzk != null && isBenefitPlusConfigured()`.

**The Benefit+ button shows its CZK amount** — e.g. `Pay with Benefit+ — 2 490
Kč`. The EUR total is displayed directly above it, and the gateway will ask for
a different-looking number; showing the CZK figure on the button prevents that
surprise.

`beginBenefitPlusPayment` re-checks server-side and throws if `totalPriceCzk`
is null, so a stale page cannot start an unpriced payment.

The transaction is created with `currency: 'CZK'`, `amount: order.totalPriceCzk`,
`paymentMethod: 'muzapay'`, and `amountWithoutVat` derived with the order's VAT
rate exactly as the Comgate path does. The `muzapay` option already exists in
both `PaymentMethod` and the `transactions` collection; its admin label is
updated to "Benefit+ (MuzaPay)".

### 6. Failure handling

- A `failed` outcome (`DECLINED`, `EXPIRED`) leaves the order in `pending`, so
  both buttons stay live and the customer can retry with either method.
  `applyOutcome` must not touch the order for `failed`. Multiple transactions
  per order is already supported — `transactions.order` is a plain
  relationship, and nothing assumes one transaction per order.
- The idempotency guard carries over from the Comgate path: if the transaction
  is already in the outcome state, the order transition is skipped.
- `begin()` keeps the existing `state !== 'created'` guard.
- As on the Comgate path, a `created` transaction left behind by a failing
  `begin()` is accepted orphan debris; no cleanup is implemented.

### 7. Tests

Vitest, `tests/int/**/*.int.spec.ts`:

- **Signature builder** — ordering preserved, values trimmed, null/undefined/
  empty-after-trim values skipped entirely (no empty delimiter segments).
- **Signer** — deterministic RSA-SHA256 over a fixture private key, verified
  with `crypto.verify` against the matching public key; UTF-8 plaintext with
  diacritics; `rawUrlEncode` output compared against known PHP `rawurlencode`
  vectors, including `+`, `/`, `=`, and the `!*'()` set.
- **State mapping** — the full table in §3, including the unknown-state → null
  fallback and the single-L `CANCELED` spelling.
- **`applyOutcome`** — paid chain from `pending`, paid chain from `confirmed`,
  cancelled, failed leaves the order untouched, and a duplicate outcome is a
  no-op. These also back-cover the Comgate path, which has no such test today.

Then a manual sandbox run: begin → gateway UI → confirm in the Benefit+ app →
return URL → order reaches `paid`. Plus one deliberately abandoned session to
prove the cron sweep resolves it.

### 8. Environment variables

Added to the deployment section of `CLAUDE.md`:

| Variable | Notes |
|---|---|
| `MUZAPAY_BASE_URL` | Sandbox `https://api.gate.int.pay.muza.cz`, production `https://api.gate.pay.muza.cz`. |
| `MUZAPAY_ESHOP_ID` | Eshop identifier for HTTP Basic auth. |
| `MUZAPAY_ESHOP_PASSWORD` | Eshop password for HTTP Basic auth. |
| `MUZAPAY_PRIVATE_KEY` | RSA private key, **base64-encoded PEM**, decoded in `config.ts`. Multi-line values are awkward in `.env` files and in `vercel env pull`. |
| `MUZAPAY_PRIVATE_KEY_PASSPHRASE` | Optional. |
| `MUZAPAY_PRODUCT_CODE` | Defaults to `LEISURE`. |
| `MUZAPAY_LANGUAGE` | Defaults to `cs`. |
| `MUZAPAY_COUNTRY` | Defaults to `CZ`; passed to the token endpoint. |
| `MUZAPAY_TOKEN_SCOPE` | Defaults to `SINGLE_PAYMENT`; passed to the token endpoint. |
| `CRON_SECRET` | Shared secret for the reconcile endpoint; Vercel sends it as a bearer token on scheduled invocations. |

If credentials are absent, `isBenefitPlusConfigured()` returns false and the
button does not render — the same defensive fallback pattern as the R2 and
Resend configuration.

## Risks and Open Questions

Risks 1-3 below were **resolved on 2026-09-04 against Benefit+'s own published
documentation**, without needing sandbox credentials. Sources:

- Security / signing rules: https://benefitplus.atlassian.net/wiki/spaces/BP2/pages/87818393/Security
- Parameters: https://benefitplus.atlassian.net/wiki/spaces/BP2/pages/87818435/Parameters
- Codebooks (enumerations): https://benefitplus.atlassian.net/wiki/spaces/BP2/pages/87818481/Codebooks

1. **Signature field order — RESOLVED, matches.** The Security page specifies
   `initPayment()` as `x-correlation-id, amount, productCode, orderReferenceCode,
   orderDescription, merchantData, returnUrl, language`, and both
   `getPaymentState()` and `cancelPayment()` as `paymentId` alone. That is
   exactly what `MuzaPayGateway` builds. The same page confirms the rest of the
   scheme: RSASSA-PKCS1-v1_5 with SHA-256 (RFC 8017 §8.2), `|` delimiter,
   absent optional fields omitted *along with their delimiters*, zero-length
   text treated as absent, Base64 then URL-encoding, and the signature passed
   as a query parameter that is never itself part of the signed string. Every
   one of those matches `signature-builder.ts` / `signer.ts`, which
   `tests/int/muzapay-signing.int.spec.ts` pins.
2. **Amount units — RESOLVED, matches.** Parameters defines `amount` as
   `integer int64` in "cents/pennies", with the example `1350 (= 13.50 CZK or
   EUR)`. `toMinorUnits` produces exactly that.
3. **`paymentState` vocabulary — RESOLVED, complete.** Codebooks enumerates
   exactly six values: `PAID`, `CANCELED` (one L), `DECLINED`, `EXPIRED`,
   `IN_PROGRESS_UNPAID`, `PENDING_INFO`. The gateway maps all six, so the
   "unknown falls through to still-pending" branch is now a safety net rather
   than an expected path.
4. **Token response shape — still unverified.** `token-provider.ts` expects
   `accessToken` and `validTo`. Not covered by the pages above; needs the
   sandbox.
5. **Cron plan level — still to confirm.** A sub-daily schedule requires
   Vercel Pro. As of 2026-09-04 the `rockbusters` project has no `MUZAPAY_*`
   or `CRON_SECRET` variables set in Production.

## Sandbox Verification (2026-09-08) — PASSED

Run against the live sandbox (`https://api.gate.int.pay.muza.cz`) with the
Rockbusters test-gateway credentials and a freshly generated RSA 2048 keypair.
**Every remaining assumption held; nothing had to be changed.**

| Step | Result |
|---|---|
| `POST /v2/auth/token` | HTTP 200, fields exactly `accessToken` + `validTo` — resolves risk 4, `token-provider.ts` parses it unchanged |
| `POST /v2/payments/init` | **Signature accepted on the first attempt.** Returned `paymentId` (`^[A-F0-9]{32}$` as documented), `gatewayUrl`, `currency: CZK`, `beneficiaryId` |
| Amount encoding | `2490.00 CZK` sent as `249000` and accepted — haléře confirmed |
| Diacritics | `orderDescription` "Vysoké Tatry — zimní přechod" accepted; UTF-8 signing is correct |
| `GET /v2/payments/{id}/state` | `IN_PROGRESS_UNPAID` → `null`, then `PAID` → `paid`. Mapping confirmed against live values |
| `PUT /v2/payments/{id}/cancel` | HTTP 202 accepted |
| Full order chain | Order `RB-2026-000709`: EUR 100 order with a CZK 2490 transaction, `begun` → gateway → `pending` → `confirmed` → `paid`, driven entirely by `resolveBenefitPlusPayment` |

### What the run taught us

- **The `cancel()` design decision was vindicated immediately.** The sandbox
  settles a payment on its own within seconds. A cancel issued against a
  payment that had just been paid returned HTTP 202 (accepted) and then the
  state read came back `PAID`. Because `cancel()` re-reads state and reports
  the outcome instead of assuming cancellation, it correctly reported `paid`.
  An implementation that treated the 202 as "cancelled" would have marked a
  **paid** order cancelled and lost the money — on the first real call.
- **Key format gap that testing had missed.** Benefit+'s documented
  `openssl genrsa` command produces a **PKCS#1** key (`BEGIN RSA PRIVATE
  KEY`), while every unit test used PKCS#8 (`BEGIN PRIVATE KEY`). The format
  their docs tell you to generate was the one never covered. Node's
  `createPrivateKey` accepts both, so it works — but that was luck, not
  coverage.
- **Local-dev gotcha:** the order-created email fires during this flow, so
  `RESEND_API_KEY` must be unset locally or `payload.create` throws a 403 out
  of the Resend sandbox sender. Already documented in `CLAUDE.md`.

Still outstanding: nothing technical. Production go-live needs the Benefit+
production credentials, `MUZAPAY_BASE_URL` switched to
`https://api.gate.pay.muza.cz`, and a Vercel Pro plan for the 10-minute cron.

### Found while reading the documentation

- **Return URL contract.** Parameters states the e-shop "must implement an
  endpoint accepting the GET method with the `paymentId` query parameter" —
  the gateway supplies its own identifier, and the docs do not say whether an
  existing query string survives. Our return URL carries `refId`. The route
  now accepts either, falling back to `paymentId`, so a replaced query string
  cannot strand the payer on the homepage.
- **`orderReferenceCode` is capped at 40 characters** and Benefit+ enforces
  duplicate prevention on it: a second *successful* payment for the same code
  is rejected with `responseCode 94`. Our order numbers (`RB-2026-000001`, 14
  characters) fit, and the duplicate rule is desirable — but note the
  consequence for a retry after a payment that succeeded and was never
  recorded on our side: the retry is rejected rather than double-charging, and
  currently surfaces as a generic init failure rather than a specific message.
- **`merchantData` is capped at 255 characters** and must be Base64. Ours is
  Base64 of a UUID (48 characters).

## Out of Scope

- Storefront currency switching, dual-currency display, and FX conversion.
- A Benefit+ button on `/account/orders/[id]`.
- Partial or split payments (Benefit+ covering part of an order, or mixed
  product categories).
- Refunds. `cancel()` is implemented for uncertain in-flight payments only, not
  for reversing a completed payment.
- Comgate `checkStatus()`/`cancel()`, which remain stubs.
