# Benefit+ (MuzaPay) — status and next steps

Date: 2026-09-08
Spec: `docs/superpowers/specs/2026-09-02-benefit-plus-gateway-design.md`
Plan: `docs/superpowers/plans/2026-09-02-benefit-plus-gateway.md`

## Where it got to

**Working end to end on beta, against the Benefit+ sandbox.** A booking with a
CZK price shows a second "Pay with Benefit+" button, and clicking it reaches a
real MuzaPay payment page with the right amount, order reference and trip name.

Verified earlier by script against the live sandbox: token, init, status and
cancel all behave, and an order went `pending → confirmed → paid` driven purely
by `resolveBenefitPlusPayment`.

Merged: #22 (the gateway), #26 (button styling), #27 (admin-panel gating +
`scripts/promote-admin.ts`).

Live config on the `rockbusters` Vercel project (Production): all ten
`MUZAPAY_*`/`CRON_SECRET` variables set, `MUZAPAY_BASE_URL` pointed at the
**sandbox** (`https://api.gate.int.pay.muza.cz`), `MUZAPAY_API_VERSION=v4`.
Event date 3 (*DEEP BLUE — The Psicobloc Camp*) has `priceCzk = 26500`.

## Open items, most important first

### 1. The gateway page says "Snowbusters.eu", not Rockbusters

The MuzaPay payment page shows **Obchodník: Snowbusters.eu** and "Váš nákup u
Snowbusters.eu". The eshop credentials Benefit+ issued appear to be attached to
the Snowbusters merchant profile rather than a Rockbusters one.

This is nothing in our code — the merchant name comes from their side, keyed to
`MUZAPAY_ESHOP_ID`. But a customer paying for a Rockbusters trip would see the
wrong brand, so **raise it with Benefit+ before go-live**. Ask whether the
eshopId is registered to the right merchant, or whether a separate Rockbusters
eshop needs creating.

### 2. Payer email shows `payerEmail-placeholder`

The gateway page displays that literal string where the payer's email should
be. We do not send a payer email: it is not among the documented `initPayment`
fields (`amount, productCode, orderReferenceCode, orderDescription,
merchantData, returnUrl, language`), and the signature is built over exactly
those in that order.

Worth asking Benefit+ whether v4 accepts a payer email and, if so, where it
sits in the signature field order — adding a field changes the signed string,
so this cannot be guessed.

### 3. The test payment failed ("Platba selhala")

"Z účtu nebyly strženy žádné prostředky" — no funds taken. Expected without a
funded sandbox payer: completing a payment needs the Benefit+ mobile app with a
test account holding a balance. Ask Benefit+ for sandbox payer credentials, or
whether their auto-settling test flow can be used instead (the earlier
script-driven runs did auto-settle, which is how `cancel()` was observed
landing on an already-paid payment).

### 4. Still to do before production

- Swap `MUZAPAY_BASE_URL` to `https://api.gate.pay.muza.cz` and load production
  eshop credentials. The key currently registered is the 2048-bit RSA pair in
  `muzapay-keys/` (public half already sent to Benefit+ for the test gateway);
  production may need its own.
- The reconcile cron runs **daily** (`0 3 * * *`) because the Vercel plan is
  Hobby. On Pro, raise it to `*/10 * * * *`. While daily, a payer who completes
  at the gateway but never returns can sit `pending` for up to 24 hours; the
  return URL handles the normal case.
- Benefit+ publish a 30-case integration-test suite (specific amounts and
  paymentIds triggering each error and state). Not run. Worth doing before
  production if they require it for sign-off.

## Things worth knowing before changing this code

- **The CZK amount is snapshotted onto the order at creation.** Setting
  `priceCzk` on an event date does nothing for orders that already exist —
  they keep a null snapshot and never show the button. This caused real
  confusion during testing; orders 1 and 2 will never offer Benefit+.
- **`applyOutcome` narrows but does not close a concurrent-caller window.**
  The return URL and the cron sweep overlap by design. Order and money state
  converge correctly; the residual risk is a duplicate "Booking confirmed"
  email. Closing it properly needs locking.
- **`cancel()` deliberately reports its outcome rather than assuming
  cancellation.** MuzaPay answers the cancel with 202 (accepted, not done), and
  the payment may already be paid. Trusting the 202 would mark a paid order
  cancelled.
- **The signature field order is load-bearing** and is built from the same
  object literal that becomes the JSON body, so a reorder breaks payments. The
  exact-body assertion in `tests/int/muzapay-gateway.int.spec.ts` guards it.
- **Sweep specs depend on database hygiene.** The sweep queries every `begun`
  muzapay transaction, capped at 50; leftovers past that push fixtures out of
  the window. `benefit-plus-sweep.int.spec.ts` retires them in a `beforeAll`.

## Known-failing tests (pre-existing, not this work)

Seven failures across `block-registry`, `domain-block-resolvers`,
`homepage-generic-layout`, `render-blocks` and `program-layout-blocks` — all
fail identically on a clean checkout of `devel`.
