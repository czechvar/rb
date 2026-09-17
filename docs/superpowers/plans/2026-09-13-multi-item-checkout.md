# Multi-item checkout delivery

Status: implemented, reviewed and locally verified; enablement gated.

## Accepted behaviour

- The cart contains dated trips and seat quantities. Each Checkout groups one Order per Event Date, with one catalogue currency and immutable commercial snapshots.
- Email-first checkout directs known accounts to password login. Every signed-in verified account is welcomed by name and reuses server-side account contact and saved billing details. In the Pay now journey it skips email verification and staff review, reserves for 24 hours and continues directly to payment; purchase history only classifies the Checkout as new or returning. Missing billing details are completed on the payment page.
- The cart now makes the customer's intent explicit: Pay now is primary and Reserve now is secondary. Both use email-first identity. Pay now sends a known account through sign-in and payment, while a verified new email completes inline registration before payment. Reserve now sends both known and new customers through staff review; new emails verify before the contact form, and approval sends known accounts to sign-in rather than registration.
- Signed-out first-time visitors supply name and email, with an optional phone number. A deliberate confirmation POST verifies their email and reserves the whole basket for staff review. No billing address or participant profiles are required at this stage.
- Staff approves or declines verified requests. Approval invites account setup or links the authenticated existing account. Invitation account creation signs the customer in and continues directly to the Checkout's amount-due payment; the customer supplies billing details before opening the provider. These reservations remain held until staff cancellation.
- Returning purchasers reuse/edit saved payer details and reserve atomically. Their unpaid holds expire after 24 hours only after payment reconciliation.
- Initial payment covers every active trip's obligation: 25% deposit, or full payment when within 30 calendar days of departure. The remaining balance is due 30 days before each trip; individual balances can be paid separately.
- Card and Benefit+ are supported. Benefit+ requires authored CZK prices for every active item. The first successful payment locks the method; no cross-method partial settlement or live currency conversion.
- Staff manages review, unpaid reservations, due balances and reconciliation from each Checkout's Operations tab in Payload Admin. Individual trips can be cancelled without releasing others. Provider refund receipts are recorded against their original transaction allocations; recording does not issue a provider refund.
- No automatic charging, reminder campaign or participant-profile completion is included. Canonical content seeds exclude all operational checkout data.

## Implementation ownership and shared contracts

| Owner | Delivered scope |
| --- | --- |
| Coordinator | Checkout schema, Orders compatibility, migration, transaction locks, pricing, reservations, integration tests and release gates |
| UI agent | Cart, checkout, trip links, account payment screens, saved billing, staff operations and semantic theme styling |
| Identity agent | Email classification, rate limits, guest verification, account invitations, staff review and isolated browser/build harness |
| Payment agent | Allocated transactions, deposits/balances, gateway status/cancellation, expiry, manual refunds and payment regressions |

Contracts live in `src/lib/checkout/types.ts`. `quoteCart` owns authoritative eligibility and prices. `reserveCheckout` and `activateGuestReservation` allocate capacity; all writes and advisory locks share the same Payload transaction through `withCheckoutTransaction`. Event Date locks use sorted IDs. Checkout and submission locks serialize retries, review and settlement.

`createCheckoutPaymentService` is the injected test seam for provider behaviour. Production wrappers construct the real adapters. Initial payments cannot select only part of a basket; later balances can. Callback and polling retries compare allocations semantically across PostgreSQL JSONB round trips. Late payment against a released trip records the money and enters reconciliation without restoring seats.

All public entrypoints enforce `CHECKOUT_ENABLED`; callbacks for existing transactions continue processing. Guest email verification happens inline with a six-digit, short-lived, single-use code stored only as a keyed hash. A validation POST unlocks the appropriate inline details form; the final reservation POST revalidates and consumes the code while performing the fresh availability check and reservation. The former verification-link routes remain for one release only to redeem already-issued links, but new verification emails do not use them. Account invitations continue to use URL-fragment tokens, which are removed after client capture and are never sent to analytics or placed in login return URLs. Public registration cannot assign an admin role. Checkout financial mutations are private server operations. Durable failed-attempt counters, resend limits and lockout fields are deferred to overall form hardening.

## Verification and release

Completed locally: 149 unit/component tests, 35 disposable-database checks, TypeScript, lint with no errors, theme checks, desktop/mobile browser journeys, and the normal production `pnpm build` from an isolated source copy. Browser checks recorded zero page/console errors; temporary databases and source copies were cleaned. Final spec readback found no remaining blockers in the corrected booking/payment flows. Real provider and email delivery remain unverified.

- `pnpm test:checkout`: disposable localhost database, migration up/down, whole-basket rollback, last-seat concurrency, identity/ownership, idempotent allocations/refunds, selective cancellation and uncertain/late payment handling. Teardown drops the fixture database.
- `pnpm exec vitest run --config tests/unit/vitest.config.mts`: unit and component checks, including feature gates and staff operation controls.
- `pnpm seed:sandbox`: fresh and repeated canonical seed imports. Verified 15 collections, 11,505 records and 26 enriched occurrences, excluding operational data.
- `node scripts/checkout/browser-sandbox.mjs`: isolated source copy/database, real Next routes in Playwright, then production build. No real emails/payments or production database access.
- Local additive migration applied after an archive-validated backup. Existing content counts remain unchanged; the regular local database contains no test checkout records.

At implementation completion, checkout remained disabled pending real email delivery, both gateway sandbox journeys and an authenticated ten-minute reconciliation schedule; mocked tests did not satisfy those external release gates. On 2026-09-16 the operator promoted grouped checkout to the default strategy, retaining `CHECKOUT_ENABLED=false` as the emergency legacy fallback. The daily Vercel cron remains insufficient for prompt 24-hour expiry, so production still requires the authenticated frequent reconciliation schedule.

Detailed operational instructions: `scripts/checkout/README.md`. Durable decisions: ADR-0014. Evidence is retained under `.scratch/checkout-delivery/` and `.scratch/checkout-browser/`; local backup under `.scratch/checkout-local/`. These private artifacts are excluded from Git and deployment.
