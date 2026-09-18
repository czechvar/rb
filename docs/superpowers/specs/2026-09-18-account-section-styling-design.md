# Account section styling — design

Status: approved by Jan on 2026-09-18.

## Goal

Make every `/account/*` page look like the checkout process. Michal's 17-09 review
(`docs/feedback_michal/`, gitignored) covered the two checkout routes and the account
reservation pages; it shipped in PR #32. The rest of the account area — Overview,
Profile, Addresses, Security, Orders, Order detail, confirm-email — never received the
design system and still renders bare `<h1>`s, rounded inputs and hardcoded light-theme
colours on a dark site.

## Scope

In scope: everything under `src/app/(frontend)/account/` except `checkouts/`, which is
already done and is the visual reference.

Out of scope, by decision:

- The `(auth)` pages (login, register, forgot/reset password, verify email).
- The default look of the shared form primitives in `src/components/forms/`. The contact
  form, the legacy `/book` form, the auth pages and the checkout identity step must
  render exactly as they do today.
- Server actions, schemas, access control and data flow. This is presentation and copy.
  The one exception is the Overview page, which currently hardcodes "You have 0 orders"
  and gets real counts.

## The feedback that carries over

Michal's notes were written against checkout screens. These are the ones that
generalise to the rest of the account area:

1. Eyebrow text stays on one line, above a large H1.
2. Copy: "Your details" for the customer's own data, "Save details" for its button.
3. Secondary and destructive actions are buttons — capitals, white text, centred, white
   outline (`btn-ghost`) — never bare text links.
4. Content sits in square, 1px-bordered panels with `card-lg` headings.
5. One price indication is enough; extra price rows appear only when they say something
   the total does not.
6. A trip is named exactly as authored (Event → Trip Variant → Event Date), not by its
   bare event title.

## Approach

Reuse `src/components/checkout/checkout.module.css` directly, exactly as
`account/checkouts/*` already does (`account`, `header`, `eyebrow`, `panel`, `stack`,
`layout`, `sidebar`, `fields`, `field`, `formRow`, `helper`, `error`, `notice`, `row`,
`total`, `totalAmount`, `muted`, `button`, `actions`, `statusBadge`, `reservationCard`,
`tripSummary*`), plus the global `btn-primary` / `btn-ghost` classes. No checkout rule is
duplicated into a second stylesheet.

The shared form primitives gain opt-in overrides and nothing else:

- `FormField` accepts `classNames?: { field?, label?, input?, help?, error? }`. Each key
  replaces the matching default class. When `classNames.help` is given, the inline
  `#666` help-text style is dropped so the class can colour it.
- `SubmitButton` accepts `className?`, replacing the default `submit` class.

With neither prop passed, both components produce byte-identical markup. Rejected
alternatives: an account-local copy of `FormField` (duplicates the label /
`aria-describedby` / error wiring, and will drift), and descendant-selector overrides
from the account stylesheet (needs `!important` against the inline help colour and
re-declares all of `.btn-primary`).

`FormBanner` is unchanged: the checkout identity step already uses it as is.

## Components

### `AccountPage` (new, `src/app/(frontend)/account/AccountPage.tsx`)

Server component. Props: `title: string`, `eyebrow?: string` (default `"My account"`),
`lead?: ReactNode`, `actions?: ReactNode`, `children`.

Renders the checkout `account` padding wrapper, then a `header` holding the one-line
eyebrow (`data-eyebrow="section"`), the `<h1>`, an optional `lead` paragraph and an
optional actions row, then the children. Putting the wrapper here fixes today's
misalignment, where Reservations is inset 28px and every other tab is not.

### `AccountField` / `AccountSubmit` (new, `src/app/(frontend)/account/form-controls.tsx`)

Thin wrappers that pass the checkout classes to `FormField` and `SubmitButton`, so the
account forms do not repeat the class map. `AccountSubmit` renders
`btn-primary` + checkout `button`.

### `ReservationHeader` (existing, checkout)

Two optional props, defaults unchanged: `eyebrow` (default `"Your reservation"`) and
`referenceLabel` (default `"Reservation reference"`). The copied-announcement text
derives from the label. Order detail reuses it so the order number — the bank-transfer
variable symbol — gets the copy button.

### `account.module.css`

Keeps the shell and sidebar rules. Gains only what the checkout stylesheet does not
have: the address-card grid, the button row inside a card, the checkbox toggle row, the
company-fields box and the Overview panel grid. `addresses.module.css` is folded into it
and deleted. All values come from theme tokens.

## Pages

| Page | Result |
| --- | --- |
| Overview | `AccountPage` titled "Welcome back, {first name}". A grid of link panels: Trip reservations (only when `checkoutEnabled()`), Orders, Your details, Addresses. Each shows a real count or summary and a `btn-ghost` link. Counts come from `payload.count` with `overrideAccess: false`. Success banners for `password-reset` and `email-changed` stay. |
| Profile | Title "Your details". The form sits in a `panel` with checkout fields; submit reads "Save details". "Cancel pending email change" becomes a `btn-ghost` button. The `?email-changed=1` redirect target keeps working. |
| Security | Title "Security", lead sentence kept. A "Change password" panel with checkout fields and `btn-primary`. |
| Addresses | "Add address" is a `btn-ghost` in the header actions. Cards are square panels: label as a `card-lg` heading, "Default" as a `statusBadge`, company line in `muted`. Edit / Set as default / Delete are `btn-ghost` buttons. The empty state is a `notice` with a `btn-primary` "Add address". |
| Address new / edit | `AccountPage` plus the form in a `panel`. First/last name and postal code/city share `formRow`s. Checkbox toggles use the account toggle row. |
| Orders | Title "Your orders". Rows are `reservationCard` panels matching the reservations list: authored trip name via `tripPlainTitle`, dates, order number, status `statusBadge`, one price, and a `btn-ghost` "View order". Empty state is a `notice` with a `btn-primary` "Browse trips". |
| Order detail | `ReservationHeader` (eyebrow "Your order", title = authored trip name, status badge, "Order number" reference row). Two-column `layout`. Left `stack`: Participants panel, Your details (billing address) panel, a "Payment instructions" panel first when confirmed, Your note panel when present, "Cancel booking" `btn-ghost` when pending, "All orders" `btn-ghost`. Right `sidebar`: "Your trip" (`tripSummary`: name, dates, participant count) and "Order summary" with a single Total row; Subtotal and Discount rows render only when a discount exists; the VAT line stays as `muted` small print. |
| confirm-email | The four error states render inside `AccountPage` as a `notice` with a `btn-ghost` back to Your details. The success path still redirects. |

`tripPlainTitle(event, eventDate)` needs the event and the date's trip variant populated,
so the order-detail query moves from `depth: 1` to `depth: 2` (the list already uses 2).
When the event is not populated the title falls back to "Trip", as today.

Status labels for orders stay as they are (`Pending`, `Confirmed`, `Paid`, `Completed`,
`Cancelled`); only their presentation changes. Dates use the checkout `date()` formatter
and prices the checkout `money()` formatter where the value is available in minor units;
order totals are stored in major units, so they are converted at the call site.

## Constraints

- "Cancel booking" keeps its accessible name; `tests/e2e/booking.e2e.spec.ts` clicks it
  by role and name.
- No hex colours, no `border-radius` and no inline `style` objects remain under
  `src/app/(frontend)/account/` outside `checkouts/`.
- Sidebar navigation is unchanged. It appears on Michal's board and drew no comment.

## Testing

New unit tests, rendered with `renderToStaticMarkup` like
`tests/unit/checkout-detail-page.test.tsx`, named `account-*.test.tsx` and added to the
include list in `tests/unit/vitest.config.mts`:

- `FormField` and `SubmitButton`: default markup unchanged; overrides replace classes and
  drop the inline help colour.
- `AccountPage`: eyebrow, H1, lead and actions render; eyebrow defaults to "My account".
- `ReservationHeader`: defaults unchanged; custom eyebrow and label render.
- Orders list: authored name, status badge, one price, empty state.
- Order detail: single Total without a discount; Subtotal and Discount with one;
  "Cancel booking" only when pending; payment instructions only when confirmed.
- Overview: real counts; the reservations panel follows the feature flag.
- Addresses: default badge, company line, action buttons, empty state.

Then `pnpm exec tsc --noEmit`, `pnpm lint`, the full unit suite, and a visual pass of
each page next to the reservation detail page.
