# Discount codes + referral codes (with commissions) — design

**Date:** 2026-06-13
**Status:** APPROVED for implementation — design approved by Jan 2026-06-13 after brainstorming.
**Scope:** Port the two snowbusters concepts — **DiscountCode** (customer-typed promo, time-windowed, percent off) and **BookingReference** (URL-captured referral, percent off + percent commission) — to v3 as two Payload collections, wire them into the existing booking/order flow, and snapshot the resulting discount + commission amounts on each Order.

## Reference

Snowbusters source:
- `api/app/CourseMgmtModule/services/CourseDiscountCodeService.php` and `BookingReferenceService.php`
- `api/app/CourseMgmtModule/schema/DiscountCodeDto.php`, `CreateDiscountCodeDto.php`, `BookingReferenceDto.php`, `CreateBookingReferenceDto.php`
- `api/app/OrdersModule/services/OrderFactory.php` — the discount+referral stacking rule (DC wins; referral code still recorded for commission)

v3 anchors (where this work lands):
- `src/collections/Orders.ts` and `src/collections/orders/hooks.ts::deriveCountsAndTotal` — price math today
- `src/app/(frontend)/book/[eventDateId]/{BookingForm.tsx,actions.ts,schema.ts}` — booking flow
- `src/app/(frontend)/book/[eventDateId]/confirmation/` and `src/app/(frontend)/account/orders/[id]/` — customer-facing order views

## Decisions confirmed in brainstorming

| Decision | Choice |
|---|---|
| Provisioning depth | Per-order field only — commission amounts stored on each Order. No ledger, no payouts UI. |
| Stacking | Snowbusters rule — if both a discount code and a referral are present, the discount code's percent wins on price reduction; the referral code is still recorded on the Order so the referrer's commission is still tracked. |
| Scoping | Global only — codes apply to every event date. No per-event / per-program / per-location restrictions. |
| Usage limits | None — codes are valid for unlimited redemptions while active and (for discount codes) inside the validity window. |
| Data migration | None — Jan re-enters active codes manually in the new admin after launch; snowbusters stays the historical record. |
| Data model | Two separate Payload collections (snowbusters parity), not a unified `Codes` collection with a `kind` discriminator. |

## Data model

### `DiscountCodes` (new collection, `slug: 'discount-codes'`, admin group: `Sales`)

| Field | Type | Notes |
|---|---|---|
| `code` | text | required, unique, indexed; normalized to uppercase via a field-level `beforeValidate` hook on the `code` field |
| `title` | text | required; admin-facing label, not shown to customer |
| `description` | textarea | optional; shown to the customer when the code is applied |
| `discountPercent` | number | required, integer **1–99** |
| `validFrom` | date | required |
| `validUntil` | date | required, must be `> validFrom` (validated at write time) |
| `commissionEmail` | email | optional — recipient of a future redemption notice (no email sent at MVP) |
| `commissionPercent` | number | optional, integer **0–100**, default 0; commission as percent of order subtotal |
| `active` | checkbox | default `true`; soft-disable lever |

**Access:** `read: anyone`, `create/update/delete: isAdmin`.

### `Referrals` (new collection, `slug: 'referrals'`, admin group: `Sales`)

| Field | Type | Notes |
|---|---|---|
| `code` | text | required, unique, indexed; normalized to uppercase via a field-level `beforeValidate` hook on the `code` field |
| `name` | text | required; referrer/partner display name |
| `email` | email | required; recipient of a future redemption notice |
| `discountPercent` | number | required, integer **0–100** (0 = referral with commission only, no customer discount) |
| `commissionPercent` | number | required, integer **0–100** |
| `active` | checkbox | default `true` |

**Access:** same as `DiscountCodes`. No validity window — referrals are long-lived; `active: false` is the off switch.

### Two design choices that differ from snowbusters

1. **Discount-code commission is a percent of order subtotal, not an absolute amount.** Snowbusters stored `commissionValue` as a unit-less int, which is ambiguous in a multi-currency (EUR + CZK) order book. Percent eliminates the unit dimension and matches the referral shape.
2. **Explicit `active` boolean on both collections.** Snowbusters relied on the discount-code validity window alone. v3 adds `active` so a leaked or misused code can be killed without rewriting its dates.

### Extensions on `Orders` (`src/collections/Orders.ts`)

New fields, all **snapshot at create time and never recomputed** (so editing or deleting the source code later does not rewrite the historical money owed):

| Field | Type | Source |
|---|---|---|
| `discountCode` | relationship → `discount-codes` (optional) | Customer-typed input |
| `referral` | relationship → `referrals` (optional) | Cookie set from `?ref=` URL |
| `discountAmount` | number, readOnly | Computed in `deriveCountsAndTotal` |
| `discountCommission` | number, readOnly | Computed; commission accrued for the discount-code partner |
| `referralCommission` | number, readOnly | Computed; commission accrued for the referral partner |

All three amount fields are in the order's currency. They are `0` when no relevant code is applied.

## Behavior & data flow

### Discount code (customer-typed at checkout)

1. `BookingForm.tsx` renders a collapsible "Have a discount code?" panel containing `<input name="discountCode">` + an "Apply" button.
2. Clicking Apply triggers a new server action `validateDiscountCodeAction({ code, eventDateId })`:
   - Normalize: `code.trim().toUpperCase()`
   - Look up `discount-codes` where `code = X AND active = true`
   - Check `validFrom ≤ today ≤ validUntil` (UTC dates, day-granularity)
   - Returns `{ ok: true, id, code, title, description, discountPercent }` or `{ ok: false, message }`
3. On success, the UI:
   - Shows the discount in the price summary ("Discount HOLIDAY10 — 10% off — −90 €")
   - Renders a hidden `<input name="discountCodeId" value="…">` for the form submit
   - Replaces the Apply button with a "Remove" link that clears state
4. `createBookingAction` **re-validates the code server-side** (defense in depth — never trust the hidden id). If the code became invalid between Apply and Submit, return a field error and abort the create.

### Referral (URL → cookie → applied automatically)

1. Site-wide proxy (`src/proxy.ts`) intercepts any request with a `?ref=CODE` query string:
   - Normalize and look up `referrals` where `code = X AND active = true`
   - If found, set cookie `rb_ref=CODE` — `HttpOnly`, `Secure` only when `process.env.NODE_ENV === 'production'` (local dev runs HTTP), `SameSite=Lax`, `Max-Age=30d`
   - 302-redirect to the same URL without the `ref` param so the link is shareable / cacheable
   - If not found, silently strip the param (no cookie, no error) — bad codes don't pollute the URL or surface UX noise
2. `BookingForm` server-side reads the cookie via `cookies()`; if a matching active referral exists, render an above-form notice ("🎟 You're booking via Petra Nováková — 10% off applied automatically.") and pass nothing through the form — the cookie is the source of truth.
3. `createBookingAction` re-reads the cookie at submit (not a hidden form field — customer can't swap referrals mid-flow).

### Price computation (extends `deriveCountsAndTotal` in `src/collections/orders/hooks.ts`)

The existing hook is sync and `create`-only; computing the discount needs the related records, so it becomes **async** and uses `req.payload.findByID` to load the discount-code and referral docs from the IDs already on `data`. One extra DB roundtrip per order create — not a hot path.

```
basePrice = unitPrice * participantCount   // existing logic

dc  = data.discountCode ? await req.payload.findByID({ collection: 'discount-codes', id: data.discountCode, depth: 0 }) : null
ref = data.referral     ? await req.payload.findByID({ collection: 'referrals',     id: data.referral,     depth: 0 }) : null

// Snowbusters stacking rule: DC discount wins; referral commission always tracked.
discountPercent =
    dc  ? dc.discountPercent
  : ref ? ref.discountPercent
  :       0

discountAmount     = round(basePrice * discountPercent / 100)
totalPrice         = basePrice - discountAmount

discountCommission = dc  ? round(basePrice * (dc.commissionPercent ?? 0) / 100) : 0
referralCommission = ref ? round(basePrice * ref.commissionPercent / 100)       : 0
```

Rounding: standard `Math.round` to whole units in the order's currency (matches existing `unitPrice` storage). VAT handling is unchanged — the `vat` field stays the per-unit VAT percent stored alongside `unitPrice`; discount applies to the gross subtotal, same as snowbusters.

The server action validates and looks up the same records too, but the hook's lookup is the source of truth — the action can't be trusted to forward correct percent values (defense in depth, same posture as re-validating the discount code itself in step 4 of the discount-code flow).

### No automatic commission emails at MVP

`commissionEmail` and referral `email` are stored for a later enhancement (redemption notice). For now, the admin computes payouts from the orders list. Adding a notice email later is a single addition to the `dispatchLifecycleEmails` order hook.

## UX

### Admin (Payload)

- `/admin/collections/discount-codes` — list columns: `code`, `title`, `discountPercent`, `validFrom`, `validUntil`, `active`. Default sort: `-createdAt`.
- `/admin/collections/referrals` — list columns: `code`, `name`, `discountPercent`, `commissionPercent`, `active`. Default sort: `-createdAt`.
- **Order detail panel** shows: applied discount code (relation link), applied referral (relation link), `discountAmount`, `discountCommission`, `referralCommission` — all read-only.
- Orders list columns unchanged at MVP (avoid widening the table). Filters on the relation fields make ad-hoc reporting possible.

### Customer — `/book/[eventDateId]`

- Below "Participants" / above "Billing address": the collapsible "Have a discount code?" panel.
- If a referral cookie is present and active: a non-dismissible info row above the form ("You're booking via … — X% off applied automatically.").
- **Price summary** updates: `Subtotal`, `Discount (HOLIDAY10) − 90 €` (only when applied), `Total`. Re-rendered server-side after the Apply action.

### Confirmation + `/account/orders/[id]`

- Show the same breakdown (subtotal, discount line if non-zero, total).
- Show the applied code/referral as plain text (no live state to query — they are snapshots).

### Emails

- The existing "Booking confirmed" email's price block gains two optional lines: `Discount: −90 € (HOLIDAY10)` and `Total: 810 €`. All other lifecycle emails unchanged.

## Out of scope (explicit)

- Multi-use / total-redemption caps on codes.
- Once-per-user limits.
- Per-event / per-program / per-location code scoping.
- Discount-code commission as a fixed cash amount (we use percent).
- Automatic "redemption notice" email to `commissionEmail` / referral `email` on redemption.
- Provision ledger / payout state UI.
- Data migration from snowbusters (admin re-enters active codes after launch).
- Stacking discount-code AND referral discounts on the price.
- Discount-code capture from URL (only referral codes get URL capture; promo codes must be typed).

## Testing

### int (vitest, `tests/int/**/*.int.spec.ts`)

- **`discount-codes.int.spec.ts`** — collection CRUD; `code` unique constraint; `validUntil > validFrom` validator; uppercase normalization on write.
- **`referrals.int.spec.ts`** — collection CRUD; `code` unique constraint; uppercase normalization.
- **`validate-discount-code.int.spec.ts`** — covers `validateDiscountCodeAction`: valid / expired / not-yet-valid / inactive / unknown / wrong-case (normalization round-trip).
- **`order-pricing.int.spec.ts`** (or extends existing pricing spec): the stacking rule — DC only, referral only, both (DC wins on price + referralCommission still recorded), neither.
- **`order-create-with-codes.int.spec.ts`** — order create snapshots `discountAmount`, `discountCommission`, `referralCommission` correctly; deleting the source code afterwards does not zero out the snapshots.

### e2e (playwright, `tests/e2e/**/*.e2e.spec.ts`)

- **Book with a discount code** — Apply → submit → confirmation shows discount line; order in admin has `discountCode` + `discountAmount` set.
- **Book via referral URL** — visit `?ref=PETRA` → cookie set → 302 to clean URL → booking page renders referral notice → submit → order has `referral` + `referralCommission` set.
- **Book with both** — discount-code price reduction wins, referral discount suppressed, `referralCommission` still recorded.
- **Invalid discount code** — Apply shows error message; form cannot be submitted with a stale hidden id.
- **Expired discount code** — Apply succeeds at time T but expires at T+1; submit at T+1 rejects cleanly with a field error (mock clock or pre-expired fixture).

## Open implementation notes (for the plan)

- **Cookie name** `rb_ref` is namespaced so it doesn't collide with anything generic.
- **Proxy vs middleware:** Next 16 renamed the convention from `middleware.ts` to `proxy.ts` (see the deprecation warning in `pnpm build` output). Use `src/proxy.ts` for the referral URL handler.
- **Currency on commission amounts:** the snapshot is in the order's currency, which is set per `EventDate`. Cross-currency partner payouts (a partner that earns CZK from a CZK order and EUR from a EUR order) are an admin's manual problem and out of scope for this work.
- **Cache tag coverage:** discount-codes and referrals are admin-only data; they do not need to be added to `src/lib/cache.ts` `TAGS`. They are read via direct `payload.find` calls from inside the validation action and the booking flow, which already bypasses the cache.
