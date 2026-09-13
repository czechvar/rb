# Checkout payments

Grouped checkouts use `checkout-payment-service.ts`. Amounts and immutable
per-Event-Date allocations are integer minor units. Gateway calls occur outside
SQL transactions; preparing attempts, applying outcomes and recording manual
refund receipts use checkout locks and transaction-bound Payload writes.
A provider timeout leaves a reconciliation record and keeps the reservation.
Paid allocations are applied once, including late receipts; late or excess money
requires staff reconciliation and never silently restores released seats.

`recordCheckoutRefund` records an already performed provider refund. It does not
issue one. Provider refund references are idempotent per payment transaction and
cannot exceed that transaction's original item allocations. `cancelPaidCheckout`
is staff-only and retains the financial ledger for manual reconciliation.

Both payment methods support full, deposit and selected-item balance payments.
The initial amount uses the immutable quote's 25% rounded deposit; items already
at their 30-day balance deadline require their full outstanding amount. Benefit+
requires authored CZK prices for the whole basket. The first settled payment
fixes the checkout method. No recurring or automatic charges are issued.

Comgate implementation reference checked against the primary provider API:
https://apidoc.comgate.cz/en/api/post/ (create, status and cancel), and
https://apidoc.comgate.cz/en/metody-platebni-brany/ (CARD_ALL).
Status is read using the provider transaction ID and checked against the local
reference, exact minor amount and currency. Cancellation only concerns pending
payments; its response is followed by another status query because settlement
can race cancellation. Neither a browser return nor a cancellation request is
proof of a settled outcome. Credential fields are excluded from persisted Comgate
callback data.

The authenticated reconciliation endpoint is the existing
`/api/payments/muzapay/reconcile`; it now sweeps both grouped payment methods and
expired unpaid holds as well as legacy Benefit+ attempts. Daily Vercel Hobby
scheduling is not an exact 24-hour expiry guarantee. Production enablement needs
an appropriately frequent configured scheduler plus its secret. Uncertain
provider state retains seats in the staff reconciliation queue.

Verification: `tests/unit/checkout-payments.test.ts`,
`tests/unit/checkout-comgate.test.ts`, existing transport/signing tests, and
`scripts/checkout/verify-payments.ts` (coordinator's disposable DB runner).
All gateway transport in these checks is mocked. No live provider approval is
implied: before enabling checkout, verify both providers' test credentials,
merchant-enabled currencies/methods, Comgate IP/callback portal configuration,
public HTTPS return URLs, payment/cancel/status callbacks and benefit cancellation
against the approved sandbox. Confirm settlement and manual-refund procedures
with the merchant. Never log configuration values or real provider responses.
