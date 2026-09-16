# ADR-0014: Grouped checkout reservations and allocated payments

- Status: Accepted
- Date: 2026-09-13
- Owners: Engineering

## Context
The existing Order belongs to one Event Date and requires an account and full participant profiles. A multi-item cart must support first-time customers who verify contact details, reserve seats and receive personal follow-up, alongside self-service returning purchasers and partial payments.

## Decision
A Checkout groups existing per-Event-Date Orders. Quantity reserves capacity independently of participant profile completion. Guest user/billing fields may be absent until account activation/payment. Legacy booking validation remains intact. New grouped writes are private server operations, with one Payload transaction for all bookings and transaction-bound Postgres advisory locks in stable Event Date order. Checkout operations serialize on a checkout lock; idempotency keys serialize on a separate namespace.

Public registration cannot assign an administrator role; role creation and changes are admin-only. A signed-out guest provides a name and email, while phone is optional; the registration form continues to require phone. Guest-created accounts therefore permit a missing phone until the customer supplies one. A signed-out guest receives a six-digit, short-lived email verification code and submits it inside the checkout flow. The code is stored only as a keyed hash, is single-use, and the verification POST performs the fresh availability check and reservation; no seats are held beforehand. The former verification-link pages remain for one release only to redeem already-issued links; new verification emails never link to them. A signed-in verified account does not repeat email verification: its first reservation goes directly to staff review, while returning purchasers continue to self-service reservation and payment. Verified new reservations and staff-approved guest reservations hold until staff cancellation. Approval invitations remain fragment-token links that connect the verified email's account; a typed email never authenticates its owner. Paid customers use password login.

Staff review, cancellation, reconciliation and refund-receipt controls live in Payload Admin on each Checkout's Operations tab. Customer invitation acceptance, account connection, billing and payment remain on authenticated frontend routes.

Checkout item monetary snapshots and payment allocations use integer minor units. Deposits are 25%, balances due 30 calendar days before each departure; near-departure items require full payment. One checkout has one catalogue currency; Benefit+ uses authored CZK snapshots only when every item is eligible. Successful first payment locks the payment method. Partial settlement does not mark a booking fully paid. Gateway cancellation is distinct from booking cancellation; late/uncertain money goes to staff reconciliation. Refund execution is manual with recorded amounts.

The default-off CHECKOUT_ENABLED flag gates public entrypoints; migration and legacy payment compatibility are retained. Operational records and tokens are not seed data or MCP authoring content. Feature enablement requires email delivery, gateway verification and scheduled reconciliation. Broader form-abuse hardening, including durable failed-attempt counters, resend limits and lockout fields, is deferred from the OTP delivery and remains separate follow-up work.

## Alternatives Considered
- Replacing Orders with arrays of trips would disrupt existing capacity, administration and history. Retain one booking per dated trip instead.
- Making every guest an account before verification would introduce unwanted accounts and password friction. Invite after staff approval.
- Browser-held prices and process-local locks cannot protect concurrent bookings or payment accounting.

## Consequences
Schema, auth and lifecycle changes require disposable-database and concurrency checks. New monetary arithmetic uses exact cents; legacy snapshots remain unchanged. Staff owns indefinitely held first-time reservations and overdue balances. Automated refunds/reminder campaigns and cross-method partial settlement are deferred.

## References
- docs/superpowers/plans/2026-09-13-multi-item-checkout.md
