# Multi-item checkout delivery

Status: implemented, reviewed and locally verified; enablement gated.

## Accepted behaviour

- The cart contains dated trips and seat quantities. Each Checkout groups one Order per Event Date, with one catalogue currency and immutable commercial snapshots.
- Email-first checkout directs previous purchasers to password login. An existing account without a purchase follows the first-time journey.
- First-time visitors supply name, email and phone. A deliberate confirmation POST verifies their email and reserves the whole basket. No account, billing address or participant profiles are required at this stage.
- Staff approves or declines verified requests. Approval invites account setup or links the authenticated existing account; the customer supplies billing details before payment. These reservations remain held until staff cancellation.
- Returning purchasers reuse/edit saved payer details and reserve atomically. Their unpaid holds expire after 24 hours only after payment reconciliation.
- Initial payment covers every active trip's obligation: 25% deposit, or full payment when within 30 calendar days of departure. The remaining balance is due 30 days before each trip; individual balances can be paid separately.
- Card and Benefit+ are supported. Benefit+ requires authored CZK prices for every active item. The first successful payment locks the method; no cross-method partial settlement or live currency conversion.
- Staff manages review, unpaid reservations, due balances and reconciliation through `/checkout/operations`. Individual trips can be cancelled without releasing others. Provider refund receipts are recorded against their original transaction allocations; recording does not issue a provider refund.
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

All public entrypoints enforce `CHECKOUT_ENABLED`; callbacks for existing transactions continue processing. Verification/invitation tokens use URL fragments, are removed after client capture, and are never sent to analytics or placed in login return URLs. Public registration cannot assign an admin role. Checkout financial mutations are private server operations.

## Verification and release

Completed locally: 149 unit/component tests, 35 disposable-database checks, TypeScript, lint with no errors, theme checks, desktop/mobile browser journeys, and the normal production `pnpm build` from an isolated source copy. Browser checks recorded zero page/console errors; temporary databases and source copies were cleaned. Final spec readback found no remaining blockers in the corrected booking/payment flows. Real provider and email delivery remain unverified.

- `pnpm test:checkout`: disposable localhost database, migration up/down, whole-basket rollback, last-seat concurrency, identity/ownership, idempotent allocations/refunds, selective cancellation and uncertain/late payment handling. Teardown drops the fixture database.
- `pnpm exec vitest run --config tests/unit/vitest.config.mts`: unit and component checks, including feature gates and staff operation controls.
- `pnpm seed:sandbox`: fresh and repeated canonical seed imports. Verified 15 collections, 11,505 records and 26 enriched occurrences, excluding operational data.
- `node scripts/checkout/browser-sandbox.mjs`: isolated source copy/database, real Next routes in Playwright, then production build. No real emails/payments or production database access.
- Local additive migration applied after an archive-validated backup. Existing content counts remain unchanged; the regular local database contains no test checkout records.

The checkout remains disabled until real email delivery, both gateway sandbox journeys and an authenticated ten-minute reconciliation schedule are verified. Local credentials are absent; mocked tests do not satisfy these external release gates. The current daily Vercel cron is insufficient for prompt 24-hour expiry. Do not replace production data or enable checkout merely because the code builds.

Detailed operational instructions: `scripts/checkout/README.md`. Durable decisions: ADR-0014. Evidence is retained under `.scratch/checkout-delivery/` and `.scratch/checkout-browser/`; local backup under `.scratch/checkout-local/`. These private artifacts are excluded from Git and deployment.
