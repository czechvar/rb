# Event Date Booking — Design

**Date:** 2026-05-31
**Status:** Draft — pending user review
**Scope:** MVP of the booking lifecycle: a logged-in user books an event date, receives confirmation, and tracks the order in their account; an admin confirms it, records payment, and adds notes — all through the Payload admin UI. **Online payment is out of scope** for this iteration; payment is handled offline (bank transfer) and admin marks the order as paid.

## Goals

- A logged-in user can book any active event date that still has capacity.
- The user can list and view their own orders from `/account/orders`, and cancel a still-pending order.
- An admin can see all orders in `/admin/collections/orders`, advance the order state, and append timestamped notes.
- Capacity is enforced atomically — concurrent bookings can't oversell.
- The system sends the four lifecycle emails required (booking received → user + admin; confirmed → user; cancelled → user).

## Non-goals (deferred)

- Online payment via a gateway (MuzaPay/Comgate/etc.). The draft code in `src/payments/` is unaffected.
- Refunds, partial cancellations, waitlists.
- Per-participant pricing (child rate, etc.).
- Auto-expiring stale `pending` orders.
- Invoices / PDFs / iCal attachments.
- Editing participants after submit. Cancel and re-book instead.

## Architecture

One new Payload collection: **`orders`**. Each order is **one booking for one event-date**, with an embedded `participants` array. There is no cart and no `order-items` collection — a booking targets a single date.

The user-facing flow lives under three new routes in the `(frontend)` group; the admin-facing flow is the stock Payload admin UI with no custom screens.

**New routes:**
- `/book/[eventDateId]` — booking form (protected; redirects to login).
- `/book/[eventDateId]/confirmation/[orderId]` — post-submit thank-you.
- `/account/orders/[id]` — order detail (existing `/account/orders` list replaces today's stub).

**Capacity model:** derived, not cached. A helper `getRemainingCapacity(eventDateId)` queries orders for that date in non-terminal states (`pending`, `confirmed`, `paid`) and sums `participantCount`. Authoritative inside the create transaction; list views may show slightly stale numbers, which is acceptable for browse contexts.

**State enforcement:** a `beforeChange` hook validates the state transition against a transitions matrix. Disallowed transitions throw a Payload validation error. Field-level access on `state` prevents non-admin clients from setting anything except `pending → cancelled` on their own order.

**Snapshots:** billing address and price fields are copied to the order at create time and made read-only thereafter. Edits to the user's address book or admin tweaks to an event-date price do not mutate historical orders.

## Data model

### `orders` collection

| Field             | Type                 | Notes |
|-------------------|----------------------|-------|
| `orderNumber`     | text (unique, index) | `RB-YYYY-NNNNNN`; allocated in `beforeChange` on create; readOnly. |
| `user`            | rel → users          | Set from `req.user`; readOnly. |
| `eventDate`       | rel → event-dates    | Immutable after create; readOnly. |
| `participants`    | array (minRows: 1)   | Embedded: `firstName`, `lastName`, `email`, `phone` (all required). |
| `participantCount`| number               | Denormalised `participants.length`; readOnly; indexed for capacity sum. |
| `billingAddress`  | group                | Snapshot of the chosen `users.addresses` entry; readOnly. Same shape (firstName, lastName, street, city, postalCode, country, company.{companyName, ico, dic}). |
| `unitPrice`       | number               | Snapshot of `eventDate.price`; readOnly. |
| `vat`             | number               | Snapshot of `eventDate.vat`; readOnly. |
| `currency`        | select EUR/CZK       | Snapshot of `eventDate.currency`; readOnly. |
| `totalPrice`      | number               | `unitPrice * participantCount`; computed in `beforeChange`; readOnly. |
| `state`           | select               | `pending` \| `confirmed` \| `paid` \| `completed` \| `cancelled`; sidebar position. |
| `notes`           | array                | Append-only timeline. Each entry: `author` (rel → users, readOnly), `createdAt` (date, readOnly), `body` (textarea). Field access: admin read/create only; update returns `false` (immutable entries). |
| `customerNote`    | textarea             | Optional, from booker at submit. |

### Access control

```ts
access: {
  read:   isAdminOrOwner,         // admin sees all; user sees only own
  create: isAuthenticated,        // any logged-in user
  update: isAdminOrOwnerLimited,  // user limited to {state: 'cancelled'} when current state is 'pending'
  delete: isAdmin,
}
```

Field-level access on `state` rejects user-initiated transitions other than `pending → cancelled`. Field-level access on `notes` hides admin notes from the user entirely.

### Hooks

- `beforeValidate` (create): snapshot `user`, `eventDate`, `unitPrice`, `vat`, `currency`, `billingAddress` from request; compute `participantCount` and `totalPrice`.
- `beforeChange` (create): allocate `orderNumber`; run capacity check inside the active transaction; reject with validation error if insufficient.
- `beforeChange` (update): validate state transition against the matrix below; reject if disallowed.
- `afterChange`: dispatch lifecycle emails; stamp `notes[].createdAt` + `notes[].author` on new entries.

## State machine

```
                    ┌──────────────────────────────┐
                    │                              ▼
  (create) ──▶ pending ──▶ confirmed ──▶ paid ──▶ completed
                  │            │           │
                  ▼            ▼           ▼
              cancelled ◀── cancelled ◀── cancelled
```

| From → To       | pending | confirmed | paid | completed | cancelled |
|-----------------|:-------:|:---------:|:----:|:---------:|:---------:|
| **pending**     |    —    |    ✅     |  —   |     —     |    ✅     |
| **confirmed**   |    —    |     —     |  ✅  |     —     |    ✅     |
| **paid**        |    —    |     —     |  —   |    ✅     |    ✅     |
| **completed**   |    —    |     —     |  —   |     —     |     —     |
| **cancelled**   |    —    |     —     |  —   |     —     |     —     |

- `completed` and `cancelled` are terminal.
- No skipping along the forward path — admin must move `pending → confirmed → paid → completed` step by step. (Cancellation is the only "shortcut" and is allowed from any non-terminal state.)

**Who can trigger what:**

- **User:** only `pending → cancelled`, only on their own order, only via the account UI's Cancel button.
- **Admin:** any allowed transition, from the Payload admin UI.

**Capacity interaction:**

- Non-terminal states (`pending`, `confirmed`, `paid`) count against capacity.
- `cancelled` and `completed` do not. (`completed` releases capacity because the trip already ran.)
- Capacity check runs in `beforeChange` inside the active transaction on create. State changes after create never transition *into* a counted-but-previously-uncounted state, so no extra capacity check is needed on update.

**Side effects on transition** (in `afterChange`):

| Transition                  | Side effect                                       |
|-----------------------------|---------------------------------------------------|
| (create) → `pending`        | Email user "Booking received"; email admin.       |
| `pending` → `confirmed`     | Email user "Booking confirmed" + payment details. |
| `confirmed` → `paid`        | No email (admin can follow up manually).          |
| `paid` → `completed`        | No email.                                         |
| anything → `cancelled`      | Email user "Booking cancelled".                   |

Email-send failures log and swallow; the order is the source of truth.

## User-facing flow

### Entry point — trip-detail dates sub-page

Existing `/trips/[slug]/dates` page. Each date row gains a **"Book this date"** button (disabled with "Sold out" when `remainingCapacity === 0` or `eventDate.active === false`). Links to `/book/[eventDateId]`.

### Booking page — `/book/[eventDateId]`

Server component.

- If no `req.user`: `redirect('/login?next=/book/[eventDateId]')`.
- If event-date not found / inactive / sold out: render a "Not available" panel with a link back to the trip.
- Otherwise renders a header (trip title, dates, location, price, seats remaining) and the form (client component wrapping a Server Action):
  - **Participant 1** = booker — fields prefilled from the user profile, editable.
  - **"Add participant"** button toggles additional rows (firstName, lastName, email, phone).
  - **Billing address** picker — dropdown of `user.addresses`, default = `isDefault: true` entry. Inline preview of the selected address. If user has no addresses, link to `/account/addresses` and disable submit.
  - **Customer note** textarea (optional).
  - **Order summary** sidebar updates live with participant count: `unitPrice × N = total` plus VAT line.
  - **Submit** button → Server Action.

### Server Action — `createBooking`

1. Re-read `req.user`. Open a Payload transaction.
2. Re-fetch event-date inside the transaction. Reject if inactive.
3. Recompute capacity inside the transaction. Reject with field error if insufficient.
4. Snapshot price + chosen address. Build participants array. Call `payload.create({ collection: 'orders', data, req })`.
5. On success: `redirect('/book/[eventDateId]/confirmation/[newOrderId]')`.
6. On failure: return `{ error }` to the form via React 19 `useActionState`; preserve submitted values per the existing form-action pattern ([[react19-form-action-pattern]]).

### Confirmation page — `/book/[eventDateId]/confirmation/[orderId]`

Server component. 404 if the order isn't the user's. Renders order summary, order number, and copy: "We've sent a confirmation email to X. Admin will confirm shortly." Links to `/account/orders/[orderId]` and `/programs`.

### Account orders list — `/account/orders`

Replaces the existing stub. Server component. Lists `user.orders` newest first as cards: order number, trip title, dates, state badge, total, "View" link. Empty state keeps the current copy.

### Account order detail — `/account/orders/[id]`

Server component. 404 if order isn't the user's. Shows state badge, order number, trip + dates + location, participants list, billing address, price breakdown, customer note. State-dependent UI:

- `pending` → **Cancel booking** button (Server Action `cancelMyOrder`).
- `confirmed` → payment instructions panel (bank details from env, variable symbol = orderNumber).
- `paid` / `completed` → confirmation message.
- `cancelled` → "Cancelled on …" timestamp.

The admin `notes` array is never rendered to the user (field-level read access already hides it).

## Admin-facing flow

All in `/admin/collections/orders` — no custom admin pages.

- **List view**: columns `orderNumber`, `state`, `eventDate`, `user`, `totalPrice`, `createdAt`. Payload's built-in filters handle pending-only / per-event-date views.
- **Detail view**: sidebar shows `orderNumber`, `state` dropdown, `createdAt`. Main column shows the rest. Admin changes state → Save → `beforeChange` validates, `afterChange` dispatches email.
- **Adding a note**: scroll to `notes`, click "Add", type body, save. `author` + `createdAt` stamped automatically; existing entries render read-only.
- **Capacity visibility**: event-dates list gains two virtual columns (`bookedSeats`, `remainingSeats`) via `afterRead` hook on the existing `event-dates` collection.

### Admin notification email

Sent on order creation to `process.env.ADMIN_ORDER_NOTIFICATIONS_EMAIL` (falls back to `EMAIL_FROM_ADDRESS` if unset). Plaintext-ish HTML: "New booking RB-2026-000123 from {user.email} for {event-date} ({N} participants). Open in admin: {url}".

### What admin cannot do (intentional)

- Edit `user`, `eventDate`, `billingAddress`, price snapshots, `participantCount` after create. To correct, cancel + recreate.
- Edit or delete existing note entries. Soft-corrections happen via a new note.

## Emails

All four templates live under `src/lib/email/templates/` next to the existing `verifyEmailTemplate` / `resetPasswordTemplate`. They go through the same `@payloadcms/email-resend` adapter — local dev with `RESEND_API_KEY` unset prints to stdout via the console fallback.

| Template                  | Trigger                       | To             |
|---------------------------|-------------------------------|----------------|
| `bookingReceivedToUser`   | order create                  | `user.email`   |
| `bookingReceivedToAdmin`  | order create                  | env var        |
| `bookingConfirmedToUser`  | `pending → confirmed`         | `user.email`   |
| `bookingCancelledToUser`  | `* → cancelled`               | `user.email`   |

`bookingConfirmedToUser` injects `process.env.BANK_TRANSFER_DETAILS` (multi-line text block) plus the order number as variable symbol.

### New env vars

| Var                                 | Purpose                                                       | Fallback                          |
|-------------------------------------|---------------------------------------------------------------|-----------------------------------|
| `ADMIN_ORDER_NOTIFICATIONS_EMAIL`   | Recipient of "Booking received (admin)" email.                | `EMAIL_FROM_ADDRESS`              |
| `BANK_TRANSFER_DETAILS`             | Multi-line text injected into "Booking confirmed" email.      | Hardcoded placeholder in template |

Update `CLAUDE.md` deployment section after implementation.

## Edge cases

- **Race on last seat** — capacity SUM runs inside the same Payload transaction as the insert. One submit wins, the other gets a "Sold out" validation error returned to the form.
- **Stale event-date in form** — Server Action re-fetches inside the transaction; rejects with a friendly error if deactivated or filled between render and submit.
- **User edits address after order** — billing snapshot is immutable; historical orders are untouched.
- **User deletes the saved address used on an order** — no effect (we stored the values, not a relation).
- **Admin edits event-date price after orders exist** — orders untouched (price snapshotted).
- **User changes email mid-flow** (pending email-change via [[payload-verification-token-write-quirk]]) — participants' booker email is captured on the order at submit; `user` relation still points to the same record.
- **`getRemainingCapacity` and stale data on browse views** — acceptable to show "3 seats left" when actually 2; corrected at submit.
- **User cancels then re-books** — cancellation frees seats immediately; re-booking permitted.
- **`completed` releases capacity** — intentional. Helper only sums non-terminal states.
- **Order-number collision under extreme concurrency** — `unique` index catches it; user retries. Not engineered for high contention.
- **Email send fails** — log + swallow; order remains.
- **No saved addresses** — submit disabled; link to `/account/addresses`.

## Testing strategy

- **Pure unit** — state-machine transition validator (transitions matrix) tested as a pure function with the table from the design.
- **Integration (DB)** — capacity helper tested with seeded DB; concurrent-create race test for the last-seat scenario.
- **Playwright (golden path)** — login → trips → dates → book → confirmation → /account/orders → /account/orders/[id].
- **Playwright (negative paths)** — cancel-while-pending, sold-out submit, missing-address gate, unauthenticated booking redirect.
- **Admin** — Playwright or manual checklist: admin views order, advances state (emails intercepted via Resend test mode or console-adapter fallback), appends note with author/timestamp, disallowed transition rejected.
- **Schema/types** — Payload type generation passes; TS build passes.

## Migration

Run `payload migrate:create` after all collection changes are in place — per [[payload-migrations-require-json-snapshot]], the generated `.ts` + `.json` snapshot pair is the only safe way to land schema changes. The migration covers:

1. New `orders` collection (table + indexes for `orderNumber` unique, `eventDate` FK, `participantCount`).
2. Any column changes implied by the virtual-field additions on `event-dates` (in practice none, since virtual fields with `afterRead` don't create columns — but always let `migrate:create` decide).

## Files to add / change

**New collection:**
- `src/collections/Orders.ts`

**Wire-up:**
- `src/payload.config.ts` — register `Orders` collection.

**Access helpers:**
- `src/access/index.ts` — add `isAuthenticated`, `isAdminOrOwner`, `isAdminOrOwnerLimited` (the last validates `{state: 'cancelled'}` + current `pending` for non-admin updates).

**Capacity:**
- `src/lib/capacity.ts` — `getRemainingCapacity(eventDateId, { req })`.
- `src/collections/EventDates.ts` — add `bookedSeats` + `remainingSeats` virtual fields via `afterRead`.

**Routes & components:**
- `src/app/(frontend)/book/[eventDateId]/page.tsx`
- `src/app/(frontend)/book/[eventDateId]/actions.ts` (Server Action `createBooking`)
- `src/app/(frontend)/book/[eventDateId]/BookingForm.tsx` (client component)
- `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/page.tsx`
- `src/app/(frontend)/account/orders/page.tsx` — replace stub.
- `src/app/(frontend)/account/orders/[id]/page.tsx`
- `src/app/(frontend)/account/orders/[id]/actions.ts` (Server Action `cancelMyOrder`)
- `src/components/trip/DateRowBookButton.tsx` (or inline edit to the existing dates sub-page renderer).

**Emails:**
- `src/lib/email/templates/bookingReceivedToUser.ts`
- `src/lib/email/templates/bookingReceivedToAdmin.ts`
- `src/lib/email/templates/bookingConfirmedToUser.ts`
- `src/lib/email/templates/bookingCancelledToUser.ts`

**Migration:**
- `src/migrations/<timestamp>_orders.ts` + `.json` snapshot (generated via `payload migrate:create`).

**Docs:**
- `CLAUDE.md` — add `ADMIN_ORDER_NOTIFICATIONS_EMAIL` and `BANK_TRANSFER_DETAILS` to the env-var list; add a short "User section → Orders" paragraph.

## Open items confirmed during brainstorming

- **Payment scope:** No online payment in this iteration. Bank transfer, admin marks paid.
- **Auth:** Logged-in only. No guest checkout.
- **Participants:** Multi-participant per booking; fields = first/last name, email, phone.
- **Address at checkout:** Picker from saved addresses, snapshotted onto order.
- **States:** `pending → confirmed → paid → completed` + `cancelled` from any non-terminal state.
- **Notes:** Append-only timeline with author + timestamp; immutable entries; admin-only visible.
- **Capacity timing:** Soft-hold at submission; no auto-expire of pending orders.
- **User cancellation:** Allowed only while `pending`.
- **Emails:** All four (user received, admin received, user confirmed, user cancelled).
- **Booking entry:** Trip-detail dates sub-page only.
- **Bank details delivery:** `BANK_TRANSFER_DETAILS` env var.
- **Admin notification recipient:** `ADMIN_ORDER_NOTIFICATIONS_EMAIL` env var.
