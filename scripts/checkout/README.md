# Checkout verification and rollout

`pnpm test:checkout` migrates a fresh disposable localhost database and exercises
real Payload writes, seat locks, identity linking, allocated deposits/balances,
refund receipts and gateway reconciliation using in-memory email/provider adapters.
The database is always dropped. Fixtures are marked `[Checkout test]`; none are
persistent seed data. Safe results go to `.scratch/checkout-delivery/`.

`node scripts/checkout/browser-sandbox.mjs` copies source into an isolated checkout,
creates a separate fixture database, verifies actual Next routes with Playwright,
and builds that copy. It never uses production database or provider credentials;
its `finally` block stops the app and removes the fixture database. Public-page
screenshots and a sanitized report remain under `.scratch/checkout-browser/`.

Pure/UI tests run through `pnpm exec vitest run --config tests/unit/vitest.config.mts`.
Canonical content remains covered by `pnpm seed:sandbox`. Checkouts, verification
links, reservations and payments are deliberately excluded from the seed.

## Release gates

- Apply `20260913_150000_grouped_checkout` before deploying code. Existing order
  and transaction records remain readable; older gateway callbacks stay supported.
- Leave `CHECKOUT_ENABLED` unset until verified email/invitation delivery and both
  gateway sandbox journeys pass. Tests use fake adapters and do not establish real
  external delivery or settlement.
- Configure an authenticated ten-minute reconciliation schedule. The existing
  daily Vercel schedule cannot provide timely 24-hour unpaid-hold expiry.
- Rehearse full/deposit/balance payment, payment cancellation, delayed confirmation
  and an abandoned browser with real provider sandbox credentials before enablement.
- Staff handles first-time reservations, overdue balances and provider refunds;
  recording a refund receipt does not issue money through a provider.
- Rollback code/disable new checkout admission without deleting operational records.
  Migration down refuses to discard nonempty checkouts.

Design references are the original `CHECK OUT/rockbusters_checkout.html`,
`CHECK OUT/checkout.html`, and `CHECK OUT/checkout-status.html` in the local
`NEW ROCKBUSTERS WEBSITE - HTML ` folder. ADR-0014 and the implementation plan
are the authoritative customer, reservation and payment rules where designs differ.
