# ADR-0014: Grouped checkout reservations and allocated payments

- Status: Accepted
- Date: 2026-09-13
- Owners: Engineering

## Context
The existing Order belongs to one Event Date and requires an account and full participant profiles. A multi-item cart must support first-time customers who verify contact details, reserve seats and receive personal follow-up, alongside self-service returning purchasers and partial payments.

## Decision
A Checkout groups existing per-Event-Date Orders. Quantity reserves capacity independently of participant profile completion. Guest user/billing fields may be absent until account activation/payment. Legacy booking validation remains intact. New grouped writes are private server operations, with one Payload transaction for all bookings and transaction-bound Postgres advisory locks in stable Event Date order. Checkout operations serialize on a checkout lock; idempotency keys serialize on a separate namespace.

Public registration cannot assign an administrator role; role creation and changes are admin-only. The cart presents two explicit intents. **Pay now** reserves for 24 hours and continues to payment; **Reserve now** creates an indefinitely held request for staff review. Both signed-out journeys start with email lookup and a six-digit, short-lived verification code before collecting further details. The code is stored only as a keyed hash and is consumed by the final reservation transaction; no seats are held beforehand. For Pay now, a new customer supplies name, required phone and password after verification; account creation, account linkage and reservation happen atomically before sign-in and payment. For Reserve now, a new customer supplies name and optional phone after verification, then reserves for review without creating an account. A known email signs in before either intent continues.

A signed-in verified account does not repeat email verification, contact entry or saved billing entry. Pay now reuses its account data, reserves for 24 hours and continues directly to payment. Reserve now instead remains in staff review, including for an existing account. Purchase history still classifies the Checkout as new or returning but does not choose the intent. If no saved billing address exists, it is completed on the payment page. Approval invitations remain fragment-token links; known accounts sign in and continue to payment, while a new Reserve now customer creates an account from the valid invitation. A typed email never authenticates its owner. The former verification-link pages remain for one release only to redeem already-issued links; new verification emails never link to them. Paid customers use password login.

Staff review, cancellation, reconciliation and refund-receipt controls live in Payload Admin on each Checkout's Operations tab. Customer invitation acceptance, account connection, billing and payment remain on authenticated frontend routes.

Checkout item monetary snapshots and payment allocations use integer minor units. Deposits are 25%, balances due 30 calendar days before each departure; near-departure items require full payment. One checkout has one catalogue currency; Benefit+ uses authored CZK snapshots only when every item is eligible. Successful first payment locks the payment method. Partial settlement does not mark a booking fully paid. Gateway cancellation is distinct from booking cancellation; late/uncertain money goes to staff reconciliation. Refund execution is manual with recorded amounts.

The grouped checkout is the default public strategy. `CHECKOUT_ENABLED=false` is retained as an explicit emergency fallback to the legacy booking flow while migration and legacy payment compatibility remain. All public booking links use the same rollout decision, and payment initiation uses that decision too. Operational records and tokens are not seed data or MCP authoring content. Production operation requires email delivery, gateway verification and scheduled reconciliation. Broader form-abuse hardening, including durable failed-attempt counters, resend limits and lockout fields, is deferred from the OTP delivery and remains separate follow-up work.

## Alternatives Considered
- Replacing Orders with arrays of trips would disrupt existing capacity, administration and history. Retain one booking per dated trip instead.
- Making every guest an account before verification would introduce unwanted accounts and password friction. Invite after staff approval.
- Browser-held prices and process-local locks cannot protect concurrent bookings or payment accounting.

## Consequences
Schema, auth and lifecycle changes require disposable-database and concurrency checks. New monetary arithmetic uses exact cents; legacy snapshots remain unchanged. Staff owns indefinitely held guest-review reservations and overdue balances. Automated refunds/reminder campaigns and cross-method partial settlement are deferred.

## References
- docs/superpowers/plans/2026-09-13-multi-item-checkout.md
