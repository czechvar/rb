# Discount + Referral Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new Payload collections (`DiscountCodes`, `Referrals`), wire them into the existing booking + order flow, and snapshot the resulting discount + commission amounts on each Order. Reproduces the snowbusters discount-code + booking-reference behavior (customer types in the discount code, referral is captured from `?ref=` URL via cookie, discount-code's percent wins on price when both are present, referral commission is always recorded).

**Architecture:** Two thin Payload collections with field-level access (`anyone` read, `isAdmin` write). Pricing math centralized in the existing `deriveCountsAndTotal` Order hook (extended to async, looks up the related code records, applies snowbusters stacking rule). A new server action `validateDiscountCodeAction` validates the customer-typed code from the booking form (using `useTransition` from a client component — no nested forms). A new `src/proxy.ts` (Next 16's renamed middleware) intercepts `?ref=CODE`, sets an HTTP-only cookie, and 302s to a clean URL. Snapshots are computed at create only and never recomputed — editing a code afterwards does not rewrite history.

**Tech Stack:** Payload CMS 3.84.1 (embedded in Next.js 16.2.6), TypeScript, React 19 + `useTransition`, vitest int suite, Playwright e2e.

**Source spec:** `docs/superpowers/specs/2026-06-13-discount-referral-codes-design.md`

---

## Prerequisites & ordering notes

- Tasks **T1–T7** are isolated work — each can be implemented and verified without the others landing first. **T8 depends on T6, T7;** **T9 depends on T8;** **T10–T11 depend on T4.** **T3 must run after T1 + T2** (`payload.config.ts` import the new collections). **T4 needs the migration from T3 to be in place** so the new Orders fields can reference `discount-codes` / `referrals` collection slugs.
- **Two migrations get generated** (one after T3, one after T4). Use `pnpm payload migrate:create <name>` per [[payload-migrations-require-json-snapshot]] — never hand-write the `.ts` file; the `.json` snapshot Drizzle needs lands at the same time.
- The full int suite and `pnpm build` use `.env` (dev branch) / `.env.test` (test branch). Both are already pointed at the right Neon branches as of 2026-06-13.

## File structure

| File | Responsibility | Action |
|---|---|---|
| `src/collections/DiscountCodes.ts` | Collection schema: code, title, %, validity window, commission %, active | Create |
| `src/collections/Referrals.ts` | Collection schema: code, name, email, %, commission %, active | Create |
| `src/payload.config.ts` | Register the two new collections | Modify |
| `src/migrations/<ts>_add_discount_referral_collections.{ts,json}` | New collections | Generated |
| `src/collections/Orders.ts` | Add `discountCode`, `referral`, `discountAmount`, `discountCommission`, `referralCommission` fields | Modify |
| `src/migrations/<ts>_orders_discount_referral_fields.{ts,json}` | Order column additions | Generated |
| `src/collections/orders/hooks.ts` | Extend `deriveCountsAndTotal` — async, load related, apply stacking | Modify |
| `src/app/(frontend)/book/[eventDateId]/validate-discount.ts` | Server action `validateDiscountCodeAction` | Create |
| `src/lib/referral.ts` | Pure helper `resolveReferralFromQuery` (URL → maybe-cookie) — keeps `proxy.ts` thin and testable | Create |
| `src/proxy.ts` | Next proxy that calls the helper and sets/strips cookies | Create |
| `src/app/(frontend)/book/[eventDateId]/schema.ts` | Add optional `discountCodeId` to booking schema | Modify |
| `src/app/(frontend)/book/[eventDateId]/actions.ts` | Re-validate code + read referral cookie + pass through to `payload.create` | Modify |
| `src/app/(frontend)/book/[eventDateId]/page.tsx` | Read referral cookie server-side; pass `referral` info into `<BookingForm>` | Modify |
| `src/app/(frontend)/book/[eventDateId]/BookingForm.tsx` | Discount-code panel + referral notice + extended price summary | Modify |
| `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/page.tsx` | Show discount line in summary | Modify |
| `src/app/(frontend)/account/orders/[id]/page.tsx` | Show discount line + applied code/referral | Modify |
| `src/lib/email/templates.ts` | Extend `BookingCtx` and `orderSummary` to include the discount line | Modify |
| `src/collections/orders/emails-hook.ts` | Pass the new fields through to `BookingCtx` | Modify |
| `tests/int/discount-codes.int.spec.ts` | Collection CRUD + validation + normalization | Create |
| `tests/int/referrals.int.spec.ts` | Collection CRUD + uniqueness + normalization | Create |
| `tests/int/order-pricing.int.spec.ts` | Stacking-rule pricing tests (extends or complements `orders.int.spec.ts`) | Create |
| `tests/int/validate-discount-code.int.spec.ts` | Server-action validation matrix | Create |
| `tests/int/referral-helper.int.spec.ts` | `resolveReferralFromQuery` unit tests | Create |
| `tests/e2e/discount-referral.e2e.spec.ts` | End-to-end: book with discount, via referral, both, invalid, expired | Create |

---

## Task 1: `DiscountCodes` collection

**Files:**
- Create: `src/collections/DiscountCodes.ts`
- Test: `tests/int/discount-codes.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/discount-codes.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from './harness.int.spec'

describe('discount-codes collection', () => {
  it('creates a code with required fields and snapshots them', async () => {
    const payload = await getTestPayload()
    const code = await payload.create({
      collection: 'discount-codes',
      data: {
        code: 'spring25',
        title: 'Spring 25',
        discountPercent: 25,
        validFrom: '2026-03-01',
        validUntil: '2026-05-31',
        commissionPercent: 10,
      } as never,
      overrideAccess: true,
    })
    expect(code.code).toBe('SPRING25') // normalized uppercase
    expect(code.discountPercent).toBe(25)
    expect(code.active).toBe(true)
  })

  it('rejects discountPercent outside 1..99', async () => {
    const payload = await getTestPayload()
    await expect(
      payload.create({
        collection: 'discount-codes',
        data: {
          code: 'BAD1',
          title: 'Bad 1',
          discountPercent: 100,
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'discount-codes',
        data: {
          code: 'BAD2',
          title: 'Bad 2',
          discountPercent: 0,
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('rejects validUntil <= validFrom', async () => {
    const payload = await getTestPayload()
    await expect(
      payload.create({
        collection: 'discount-codes',
        data: {
          code: 'BAD3',
          title: 'Bad 3',
          discountPercent: 10,
          validFrom: '2026-06-01',
          validUntil: '2026-05-01',
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('rejects duplicate codes (case-insensitive via normalization)', async () => {
    const payload = await getTestPayload()
    await payload.create({
      collection: 'discount-codes',
      data: {
        code: 'DUPE',
        title: 'First',
        discountPercent: 10,
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
      } as never,
      overrideAccess: true,
    })
    await expect(
      payload.create({
        collection: 'discount-codes',
        data: {
          code: 'dupe',
          title: 'Second',
          discountPercent: 10,
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/int/discount-codes.int.spec.ts`
Expected: FAIL — collection `discount-codes` does not exist (Payload throws "Collection not found").

- [ ] **Step 3: Write the implementation**

Create `src/collections/DiscountCodes.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const DiscountCodes: CollectionConfig = {
  slug: 'discount-codes',
  labels: { singular: 'Discount Code', plural: 'Discount Codes' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'code',
    group: 'Sales',
    defaultColumns: ['code', 'title', 'discountPercent', 'validFrom', 'validUntil', 'active'],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeValidate: [
          ({ value }) =>
            typeof value === 'string' ? value.trim().toUpperCase() : value,
        ],
      },
    },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'discountPercent',
      type: 'number',
      required: true,
      min: 1,
      max: 99,
      admin: { description: 'Whole-number percent (1–99).' },
    },
    { name: 'validFrom', type: 'date', required: true },
    { name: 'validUntil', type: 'date', required: true },
    { name: 'commissionEmail', type: 'email' },
    {
      name: 'commissionPercent',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 0,
      admin: { description: 'Commission paid out per redemption, as % of order subtotal.' },
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data?.validFrom || !data?.validUntil) return data
        if (new Date(data.validUntil as string) <= new Date(data.validFrom as string)) {
          throw new Error('validUntil must be later than validFrom.')
        }
        return data
      },
    ],
  },
  timestamps: true,
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/int/discount-codes.int.spec.ts`
Expected: PASS (4 tests). If "Collection not found" still appears, T3 (registering in `payload.config.ts`) is needed first — but the test file alone should fail at the harness level until T3 lands. For now, leave the test file in place; it will be unblocked by T3.

> **If Step 4 still fails because the collection is not registered:** that is expected at this stage. Skip ahead and complete T2 + T3, then come back to confirm all four tests pass. Do not "fix" by registering the collection in this task — that's T3's responsibility.

- [ ] **Step 5: Commit**

```bash
git add src/collections/DiscountCodes.ts tests/int/discount-codes.int.spec.ts
git commit -m "$(cat <<'EOF'
feat(sales): DiscountCodes collection schema

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `Referrals` collection

**Files:**
- Create: `src/collections/Referrals.ts`
- Test: `tests/int/referrals.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/referrals.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from './harness.int.spec'

describe('referrals collection', () => {
  it('creates a referral with required fields and normalizes the code', async () => {
    const payload = await getTestPayload()
    const ref = await payload.create({
      collection: 'referrals',
      data: {
        code: 'petra',
        name: 'Petra Nováková',
        email: 'petra@example.com',
        discountPercent: 10,
        commissionPercent: 15,
      } as never,
      overrideAccess: true,
    })
    expect(ref.code).toBe('PETRA')
    expect(ref.active).toBe(true)
  })

  it('rejects duplicate codes (case-insensitive)', async () => {
    const payload = await getTestPayload()
    await payload.create({
      collection: 'referrals',
      data: {
        code: 'DUPE',
        name: 'First',
        email: 'first@example.com',
        discountPercent: 0,
        commissionPercent: 5,
      } as never,
      overrideAccess: true,
    })
    await expect(
      payload.create({
        collection: 'referrals',
        data: {
          code: 'dupe',
          name: 'Second',
          email: 'second@example.com',
          discountPercent: 0,
          commissionPercent: 5,
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('allows discountPercent=0 (commission-only referral)', async () => {
    const payload = await getTestPayload()
    const ref = await payload.create({
      collection: 'referrals',
      data: {
        code: 'COMMONLY',
        name: 'Only Commission',
        email: 'only@example.com',
        discountPercent: 0,
        commissionPercent: 20,
      } as never,
      overrideAccess: true,
    })
    expect(ref.discountPercent).toBe(0)
    expect(ref.commissionPercent).toBe(20)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/int/referrals.int.spec.ts`
Expected: FAIL — Collection not found.

- [ ] **Step 3: Write the implementation**

Create `src/collections/Referrals.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Referrals: CollectionConfig = {
  slug: 'referrals',
  labels: { singular: 'Referral', plural: 'Referrals' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'code',
    group: 'Sales',
    defaultColumns: ['code', 'name', 'discountPercent', 'commissionPercent', 'active'],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeValidate: [
          ({ value }) =>
            typeof value === 'string' ? value.trim().toUpperCase() : value,
        ],
      },
    },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    {
      name: 'discountPercent',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      admin: { description: 'Discount given to the customer using this referral (0 = commission only).' },
    },
    {
      name: 'commissionPercent',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      admin: { description: 'Commission paid to the referrer, as % of order subtotal.' },
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
  timestamps: true,
}
```

- [ ] **Step 4: Verify it passes (after T3 lands)**

Same caveat as T1 Step 4 — this test will only fully pass after the collection is registered in T3. Move on.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Referrals.ts tests/int/referrals.int.spec.ts
git commit -m "$(cat <<'EOF'
feat(sales): Referrals collection schema

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Register new collections + generate migration

**Files:**
- Modify: `src/payload.config.ts`
- Generated: `src/migrations/<timestamp>_add_discount_referral_collections.{ts,json}`

- [ ] **Step 1: Edit `src/payload.config.ts`**

Add two imports after the existing `Orders` import:

```ts
import { DiscountCodes } from './collections/DiscountCodes'
import { Referrals } from './collections/Referrals'
```

Add `DiscountCodes` and `Referrals` to the `collections` array in `buildConfig({...})` — slot them next to `Orders` so they're grouped logically. Locate the array (which already includes `Users`, `Media`, …, `Orders`, `PostCategories`, `Posts`) and append the two new entries adjacent to `Orders`:

```ts
collections: [
  Users,
  Media,
  Difficulties,
  Types,
  Categories,
  Guides,
  Locations,
  Airports,
  Partners,
  Events,
  EventDates,
  FAQs,
  Reviews,
  Orders,
  DiscountCodes,
  Referrals,
  PostCategories,
  Posts,
],
```

(If the exact array is differently shaped, just append `DiscountCodes` and `Referrals` adjacent to `Orders`. Do not reorder anything else.)

- [ ] **Step 2: Regenerate Payload types**

Run: `pnpm payload generate:types`
Expected: `src/payload-types.ts` now exports `DiscountCode` and `Referral` interfaces.

- [ ] **Step 3: Run the T1 + T2 tests, expect PASS**

Run: `pnpm vitest run tests/int/discount-codes.int.spec.ts tests/int/referrals.int.spec.ts`
Expected: 7/7 tests pass.

- [ ] **Step 4: Generate the migration**

Run: `pnpm payload migrate:create add_discount_referral_collections`
Expected: two new files in `src/migrations/`: a `.ts` and matching `.json` snapshot. Per [[payload-migrations-require-json-snapshot]], never hand-write these — the CLI is the only correct path.

- [ ] **Step 5: Apply the migration to the dev branch**

Run: `pnpm payload migrate`
Expected: migration applied, exit 0. (`.env` `DATABASE_URL` points at the Neon `dev` branch.)

- [ ] **Step 6: Commit**

```bash
git add src/payload.config.ts src/payload-types.ts src/migrations/*_add_discount_referral_collections.*
git commit -m "$(cat <<'EOF'
feat(sales): register DiscountCodes + Referrals collections + migration

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Extend `Orders` schema + generate migration

**Files:**
- Modify: `src/collections/Orders.ts`
- Generated: `src/migrations/<timestamp>_orders_discount_referral_fields.{ts,json}`

- [ ] **Step 1: Edit `src/collections/Orders.ts`** — add five new fields immediately after `totalPrice` (line ~106). All five are `admin: { readOnly: true }` (snapshots, never edited after create — matches existing `user`, `eventDate`, `unitPrice` pattern):

```ts
    {
      name: 'discountCode',
      type: 'relationship',
      relationTo: 'discount-codes',
      admin: { readOnly: true, description: 'Discount code applied at booking time (snapshot).' },
    },
    {
      name: 'referral',
      type: 'relationship',
      relationTo: 'referrals',
      admin: { readOnly: true, description: 'Referral source captured from URL at booking time (snapshot).' },
    },
    {
      name: 'discountAmount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, description: 'How much the order was reduced by the applied discount, in the order currency.' },
    },
    {
      name: 'discountCommission',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, description: 'Commission accrued for the discount-code partner, in the order currency.' },
    },
    {
      name: 'referralCommission',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, description: 'Commission accrued for the referral partner, in the order currency.' },
    },
```

- [ ] **Step 2: Regenerate Payload types**

Run: `pnpm payload generate:types`
Expected: `Order` interface in `src/payload-types.ts` now has `discountCode`, `referral`, `discountAmount`, `discountCommission`, `referralCommission` (the last three are number; first two are `number | DiscountCode` / `number | Referral` style relations).

- [ ] **Step 3: Generate the migration**

Run: `pnpm payload migrate:create orders_discount_referral_fields`
Expected: two new files in `src/migrations/`.

- [ ] **Step 4: Apply the migration**

Run: `pnpm payload migrate`
Expected: exit 0.

- [ ] **Step 5: Sanity-run the existing orders int spec**

Run: `pnpm vitest run tests/int/orders.int.spec.ts`
Expected: all existing tests still pass (the new fields are optional and default to 0 / null, so no existing test should regress).

- [ ] **Step 6: Commit**

```bash
git add src/collections/Orders.ts src/payload-types.ts src/migrations/*_orders_discount_referral_fields.*
git commit -m "$(cat <<'EOF'
feat(sales): orders.{discountCode,referral,discountAmount,discountCommission,referralCommission} fields

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Extend `deriveCountsAndTotal` with stacking-rule pricing

**Files:**
- Modify: `src/collections/orders/hooks.ts`
- Test: `tests/int/order-pricing.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/order-pricing.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from './harness.int.spec'

// Tiny seed helpers — mirror the pattern in orders.int.spec.ts.
async function seedEventDate(price = 200) {
  const payload = await getTestPayload()
  const loc = await payload.create({
    collection: 'locations',
    data: { name: 'L', slug: `l-${Math.random()}`, active: true } as never,
    overrideAccess: true,
  })
  const ev = await payload.create({
    collection: 'events',
    data: {
      title: 'E', slug: `e-${Math.random()}`, state: 'published',
      locations: [loc.id],
    } as never,
    overrideAccess: true,
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: ev.id, dateFrom: '2027-01-01', dateTo: '2027-01-08',
      price, vat: 21, currency: 'EUR', capacity: 10, active: true,
    } as never,
    overrideAccess: true,
  })
  return { eventDateId: ed.id as number }
}

async function seedUser() {
  const payload = await getTestPayload()
  const u = await payload.create({
    collection: 'users',
    data: {
      email: `u-${Math.random()}@x.test`, password: 'pwlong', _verified: true,
      firstName: 'A', lastName: 'B', phone: '+420 1',
    } as never,
    overrideAccess: true,
  })
  return u
}

const billing = {
  firstName: 'A', lastName: 'B', street: 'S 1', city: 'P',
  postalCode: '11000', country: 'CZ',
}

async function seedDiscount(payload: Awaited<ReturnType<typeof getTestPayload>>) {
  return payload.create({
    collection: 'discount-codes',
    data: {
      code: `DC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      title: 'T', discountPercent: 25,
      validFrom: '2020-01-01', validUntil: '2099-12-31',
      commissionPercent: 10,
    } as never,
    overrideAccess: true,
  })
}

async function seedReferral(payload: Awaited<ReturnType<typeof getTestPayload>>) {
  return payload.create({
    collection: 'referrals',
    data: {
      code: `R-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      name: 'P', email: `r-${Math.random()}@x.test`,
      discountPercent: 10, commissionPercent: 15,
    } as never,
    overrideAccess: true,
  })
}

describe('order pricing — snowbusters stacking rule', () => {
  it('discount code only: discounts price + records commission', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDate(200)
    const u = await seedUser()
    const dc = await seedDiscount(payload)
    const order = await payload.create({
      collection: 'orders',
      data: {
        user: u.id, eventDate: eventDateId,
        participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
        billingAddress: billing,
        unitPrice: 200, vat: 21, currency: 'EUR',
        discountCode: dc.id,
        state: 'pending',
      } as never,
      overrideAccess: true,
    })
    expect(order.discountAmount).toBe(50)   // 200 * 25%
    expect(order.totalPrice).toBe(150)
    expect(order.discountCommission).toBe(20) // 200 * 10%
    expect(order.referralCommission).toBe(0)
  })

  it('referral only: discounts price + records commission', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDate(200)
    const u = await seedUser()
    const ref = await seedReferral(payload)
    const order = await payload.create({
      collection: 'orders',
      data: {
        user: u.id, eventDate: eventDateId,
        participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
        billingAddress: billing,
        unitPrice: 200, vat: 21, currency: 'EUR',
        referral: ref.id,
        state: 'pending',
      } as never,
      overrideAccess: true,
    })
    expect(order.discountAmount).toBe(20)   // 200 * 10%
    expect(order.totalPrice).toBe(180)
    expect(order.referralCommission).toBe(30) // 200 * 15%
    expect(order.discountCommission).toBe(0)
  })

  it('both present: DC wins on price; referral commission still recorded', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDate(200)
    const u = await seedUser()
    const dc = await seedDiscount(payload)
    const ref = await seedReferral(payload)
    const order = await payload.create({
      collection: 'orders',
      data: {
        user: u.id, eventDate: eventDateId,
        participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
        billingAddress: billing,
        unitPrice: 200, vat: 21, currency: 'EUR',
        discountCode: dc.id,
        referral: ref.id,
        state: 'pending',
      } as never,
      overrideAccess: true,
    })
    expect(order.discountAmount).toBe(50)        // DC's 25% wins, not referral's 10%
    expect(order.totalPrice).toBe(150)
    expect(order.discountCommission).toBe(20)    // DC commission tracked
    expect(order.referralCommission).toBe(30)    // referral commission ALSO tracked
  })

  it('neither present: no change to existing behavior', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDate(200)
    const u = await seedUser()
    const order = await payload.create({
      collection: 'orders',
      data: {
        user: u.id, eventDate: eventDateId,
        participants: [
          { firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' },
          { firstName: 'C', lastName: 'D', email: 'c@x.test', phone: '+2' },
        ],
        billingAddress: billing,
        unitPrice: 200, vat: 21, currency: 'EUR',
        state: 'pending',
      } as never,
      overrideAccess: true,
    })
    expect(order.discountAmount).toBe(0)
    expect(order.totalPrice).toBe(400)
    expect(order.discountCommission).toBe(0)
    expect(order.referralCommission).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/int/order-pricing.int.spec.ts`
Expected: FAIL — `discountAmount` is `0` even when `discountCode` is set, because the hook doesn't yet load the code or apply the math.

- [ ] **Step 3: Write the implementation**

Replace the existing `deriveCountsAndTotal` in `src/collections/orders/hooks.ts` (replace the entire function — its signature changes from sync to async, and it now needs `req`):

```ts
export const deriveCountsAndTotal: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data) return data
  const d = data as {
    participants?: unknown[]
    unitPrice?: unknown
    discountCode?: number | null
    referral?: number | null
  }
  const participants = Array.isArray(d.participants) ? d.participants : []
  const participantCount = participants.length
  const unitPrice = Number(d.unitPrice ?? 0)
  const basePrice = unitPrice * participantCount

  let dc: { discountPercent: number; commissionPercent?: number | null } | null = null
  if (d.discountCode) {
    dc = (await req.payload.findByID({
      collection: 'discount-codes',
      id: d.discountCode,
      depth: 0,
      req,
    })) as never
  }

  let ref: { discountPercent: number; commissionPercent: number } | null = null
  if (d.referral) {
    ref = (await req.payload.findByID({
      collection: 'referrals',
      id: d.referral,
      depth: 0,
      req,
    })) as never
  }

  // Snowbusters stacking rule: discount-code wins on price; referral commission always tracked.
  const discountPercent = dc ? dc.discountPercent : ref ? ref.discountPercent : 0
  const discountAmount = Math.round((basePrice * discountPercent) / 100)
  const totalPrice = basePrice - discountAmount
  const discountCommission = dc
    ? Math.round((basePrice * (dc.commissionPercent ?? 0)) / 100)
    : 0
  const referralCommission = ref
    ? Math.round((basePrice * ref.commissionPercent) / 100)
    : 0

  return {
    ...data,
    participantCount,
    totalPrice,
    discountAmount,
    discountCommission,
    referralCommission,
  }
}
```

(Leave `allocateOrderNumber`, `stampNotes`, and other hooks in the file untouched.)

- [ ] **Step 4: Run the new test + existing orders test**

Run: `pnpm vitest run tests/int/order-pricing.int.spec.ts tests/int/orders.int.spec.ts`
Expected: all pass. The original `orders.int.spec.ts::derives participantCount and totalPrice on create` test still passes because no `discountCode`/`referral` is set → both percent fall back to 0 → `totalPrice = basePrice` exactly as before.

- [ ] **Step 5: Commit**

```bash
git add src/collections/orders/hooks.ts tests/int/order-pricing.int.spec.ts
git commit -m "$(cat <<'EOF'
feat(orders): apply discount + commissions in deriveCountsAndTotal (stacking rule)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `validateDiscountCodeAction` server action

**Files:**
- Create: `src/app/(frontend)/book/[eventDateId]/validate-discount.ts`
- Test: `tests/int/validate-discount-code.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/validate-discount-code.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from './harness.int.spec'
import { validateDiscountCodeAction } from '@/app/(frontend)/book/[eventDateId]/validate-discount'

async function seedCode(opts: {
  code: string
  active?: boolean
  validFrom?: string
  validUntil?: string
  discountPercent?: number
}) {
  const payload = await getTestPayload()
  return payload.create({
    collection: 'discount-codes',
    data: {
      code: opts.code,
      title: 'T',
      discountPercent: opts.discountPercent ?? 10,
      validFrom: opts.validFrom ?? '2020-01-01',
      validUntil: opts.validUntil ?? '2099-12-31',
      active: opts.active ?? true,
    } as never,
    overrideAccess: true,
  })
}

describe('validateDiscountCodeAction', () => {
  it('accepts a valid, active, in-window code (case-insensitive)', async () => {
    await seedCode({ code: 'VALID1', discountPercent: 15 })
    const r = await validateDiscountCodeAction({ code: ' valid1 ', eventDateId: 0 })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.code).toBe('VALID1')
      expect(r.discountPercent).toBe(15)
    }
  })

  it('rejects an unknown code', async () => {
    const r = await validateDiscountCodeAction({ code: 'NOPE', eventDateId: 0 })
    expect(r.ok).toBe(false)
  })

  it('rejects an inactive code', async () => {
    await seedCode({ code: 'OFF', active: false })
    const r = await validateDiscountCodeAction({ code: 'OFF', eventDateId: 0 })
    expect(r.ok).toBe(false)
  })

  it('rejects a not-yet-active code', async () => {
    await seedCode({ code: 'FUTURE', validFrom: '2099-01-01', validUntil: '2099-12-31' })
    const r = await validateDiscountCodeAction({ code: 'FUTURE', eventDateId: 0 })
    expect(r.ok).toBe(false)
  })

  it('rejects an expired code', async () => {
    await seedCode({ code: 'OLD', validFrom: '2000-01-01', validUntil: '2001-01-01' })
    const r = await validateDiscountCodeAction({ code: 'OLD', eventDateId: 0 })
    expect(r.ok).toBe(false)
  })

  it('rejects empty input', async () => {
    const r = await validateDiscountCodeAction({ code: '   ', eventDateId: 0 })
    expect(r.ok).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/int/validate-discount-code.int.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/app/(frontend)/book/[eventDateId]/validate-discount.ts`:

```ts
'use server'

import { getPayloadClient } from '@/lib/payload'

export type ValidateDiscountResult =
  | {
      ok: true
      id: number
      code: string
      title: string
      description: string | null
      discountPercent: number
    }
  | { ok: false; message: string }

export async function validateDiscountCodeAction(input: {
  code: string
  eventDateId: number
}): Promise<ValidateDiscountResult> {
  const code = (input.code ?? '').trim().toUpperCase()
  if (!code) return { ok: false, message: 'Enter a code.' }

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'discount-codes',
    where: { and: [{ code: { equals: code } }, { active: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  const dc = docs[0] as
    | {
        id: number
        code: string
        title: string
        description?: string | null
        discountPercent: number
        validFrom: string
        validUntil: string
      }
    | undefined
  if (!dc) return { ok: false, message: 'This code is not valid.' }

  const now = new Date()
  // Date-only comparison: compare YYYY-MM-DD strings to avoid TZ surprises.
  const today = now.toISOString().slice(0, 10)
  const from = dc.validFrom.slice(0, 10)
  const until = dc.validUntil.slice(0, 10)
  if (today < from) return { ok: false, message: 'This code is not yet active.' }
  if (today > until) return { ok: false, message: 'This code has expired.' }

  return {
    ok: true,
    id: dc.id,
    code: dc.code,
    title: dc.title,
    description: dc.description ?? null,
    discountPercent: dc.discountPercent,
  }
}
```

- [ ] **Step 4: Verify it passes**

Run: `pnpm vitest run tests/int/validate-discount-code.int.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/book/\[eventDateId\]/validate-discount.ts tests/int/validate-discount-code.int.spec.ts
git commit -m "$(cat <<'EOF'
feat(book): validateDiscountCodeAction server action

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Referral URL capture (pure helper + `src/proxy.ts`)

**Files:**
- Create: `src/lib/referral.ts`
- Create: `src/proxy.ts`
- Test: `tests/int/referral-helper.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/referral-helper.int.spec.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { resolveReferralFromQuery } from '@/lib/referral'

describe('resolveReferralFromQuery', () => {
  it('returns null when the URL has no ?ref param', async () => {
    const r = await resolveReferralFromQuery(
      new URL('https://example.com/trips/foo'),
      vi.fn(),
    )
    expect(r).toBeNull()
  })

  it('returns the normalized code + redirect URL when the code is active', async () => {
    const lookup = vi.fn(async (code: string) =>
      code === 'PETRA' ? { code: 'PETRA' } : null,
    )
    const r = await resolveReferralFromQuery(
      new URL('https://example.com/trips/foo?ref=petra&x=1'),
      lookup,
    )
    expect(r).toEqual({
      code: 'PETRA',
      cleanUrl: 'https://example.com/trips/foo?x=1',
    })
    expect(lookup).toHaveBeenCalledWith('PETRA')
  })

  it('strips the ?ref param even when the code is invalid (silent failure)', async () => {
    const lookup = vi.fn(async () => null)
    const r = await resolveReferralFromQuery(
      new URL('https://example.com/path?ref=NOPE'),
      lookup,
    )
    expect(r).toEqual({
      code: null,
      cleanUrl: 'https://example.com/path',
    })
  })

  it('trims and uppercases the code before lookup', async () => {
    const lookup = vi.fn(async () => ({ code: 'X' }))
    await resolveReferralFromQuery(
      new URL('https://example.com/?ref=%20x%20'),
      lookup,
    )
    expect(lookup).toHaveBeenCalledWith('X')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/int/referral-helper.int.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the helper**

Create `src/lib/referral.ts`:

```ts
/**
 * Pure URL → (cleanUrl, code or null) helper. Keeps src/proxy.ts thin
 * and lets us int-test the capture logic without Next request machinery.
 *
 * - Returns null when the URL has no `?ref` param (no work to do).
 * - Returns { code, cleanUrl } when `?ref` was present and resolved to an
 *   active referral (proxy should set the cookie + redirect to cleanUrl).
 * - Returns { code: null, cleanUrl } when `?ref` was present but unknown
 *   or inactive (proxy should NOT set a cookie but should still redirect
 *   to strip the bad code from the URL).
 */
export async function resolveReferralFromQuery(
  url: URL,
  lookupByCode: (code: string) => Promise<{ code: string } | null>,
): Promise<
  | null
  | { code: string; cleanUrl: string }
  | { code: null; cleanUrl: string }
> {
  const raw = url.searchParams.get('ref')
  if (raw === null) return null

  const code = raw.trim().toUpperCase()
  const cleaned = new URL(url.toString())
  cleaned.searchParams.delete('ref')
  const cleanUrl = cleaned.toString().replace(/\?$/, '')

  if (!code) return { code: null, cleanUrl }

  const found = await lookupByCode(code)
  if (!found) return { code: null, cleanUrl }
  return { code: found.code, cleanUrl }
}

export const REFERRAL_COOKIE_NAME = 'rb_ref'
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days
```

- [ ] **Step 4: Verify helper test passes**

Run: `pnpm vitest run tests/int/referral-helper.int.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the Next proxy**

Create `src/proxy.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import {
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
  resolveReferralFromQuery,
} from '@/lib/referral'

export const config = {
  // Run on every page request (excluding _next/static + admin + api which never
  // carry ?ref). Keep the matcher tight to avoid cookie chatter on assets.
  matcher: ['/((?!_next/static|_next/image|api|admin|favicon.ico).*)'],
}

export default async function proxy(req: NextRequest) {
  const result = await resolveReferralFromQuery(
    new URL(req.nextUrl.toString()),
    async (code) => {
      const payload = await getPayloadClient()
      const { docs } = await payload.find({
        collection: 'referrals',
        where: { and: [{ code: { equals: code } }, { active: { equals: true } }] },
        limit: 1,
        depth: 0,
      })
      const ref = docs[0] as { code: string } | undefined
      return ref ? { code: ref.code } : null
    },
  )

  if (result === null) return NextResponse.next()

  const res = NextResponse.redirect(result.cleanUrl, 302)
  if (result.code) {
    res.cookies.set(REFERRAL_COOKIE_NAME, result.code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
      path: '/',
    })
  }
  return res
}
```

- [ ] **Step 6: Smoke-check the build picks up the proxy**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0. (Don't run `pnpm build` here — the proxy is exercised end-to-end in T12's e2e suite.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/referral.ts src/proxy.ts tests/int/referral-helper.int.spec.ts
git commit -m "$(cat <<'EOF'
feat(referral): URL capture via proxy → rb_ref cookie

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Wire the booking action to discount + referral

**Files:**
- Modify: `src/app/(frontend)/book/[eventDateId]/schema.ts`
- Modify: `src/app/(frontend)/book/[eventDateId]/actions.ts`
- Modify: `src/app/(frontend)/book/[eventDateId]/page.tsx`

- [ ] **Step 1: Edit `schema.ts` — add optional `discountCodeId`**

Replace the whole file:

```ts
import { z } from 'zod'

const participantSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^\+?[\d\s\-()]{6,20}$/, 'Valid phone required'),
})

export const bookingSchema = z.object({
  participants: z.array(participantSchema).min(1, 'At least one participant required'),
  addressIndex: z.coerce.number().int().nonnegative('Choose a billing address'),
  customerNote: z.string().max(2000).optional(),
  discountCodeId: z.coerce.number().int().positive().optional(),
})

export type BookingInput = z.infer<typeof bookingSchema>
```

- [ ] **Step 2: Edit `actions.ts` — read referral cookie, re-validate discount code, pass IDs through**

Replace the whole file (the changes are: import `cookies`, read `rb_ref`, look up the active referral; re-validate the discount-code id; pass both IDs into `payload.create`).

```ts
'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult } from '@/components/forms/action-result'
import { bookingSchema } from './schema'
import { REFERRAL_COOKIE_NAME } from '@/lib/referral'

function parseParticipants(formData: FormData) {
  const indices = new Set<number>()
  for (const key of formData.keys()) {
    const m = key.match(/^participants\.(\d+)\./)
    if (m) indices.add(Number(m[1]))
  }
  const sorted = [...indices].sort((a, b) => a - b)
  return sorted.map((i) => ({
    firstName: String(formData.get(`participants.${i}.firstName`) ?? '').trim(),
    lastName: String(formData.get(`participants.${i}.lastName`) ?? '').trim(),
    email: String(formData.get(`participants.${i}.email`) ?? '').trim(),
    phone: String(formData.get(`participants.${i}.phone`) ?? '').trim(),
  }))
}

async function resolveActiveDiscountCode(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  id: number,
): Promise<{ id: number } | null> {
  try {
    const dc = (await payload.findByID({
      collection: 'discount-codes',
      id,
      depth: 0,
    })) as {
      id: number
      active: boolean
      validFrom: string
      validUntil: string
    }
    if (!dc.active) return null
    const today = new Date().toISOString().slice(0, 10)
    if (today < dc.validFrom.slice(0, 10)) return null
    if (today > dc.validUntil.slice(0, 10)) return null
    return { id: dc.id }
  } catch {
    return null
  }
}

async function resolveActiveReferralByCode(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  code: string,
): Promise<{ id: number } | null> {
  const { docs } = await payload.find({
    collection: 'referrals',
    where: { and: [{ code: { equals: code } }, { active: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  const ref = docs[0] as { id: number } | undefined
  return ref ? { id: ref.id } : null
}

export async function createBookingAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const eventDateId = Number(formData.get('eventDateId'))
  if (!Number.isFinite(eventDateId)) {
    return { ok: false, formError: 'Bad request.' }
  }

  const parsed = bookingSchema.safeParse({
    participants: parseParticipants(formData),
    addressIndex: formData.get('addressIndex'),
    customerNote: formData.get('customerNote') || undefined,
    discountCodeId: formData.get('discountCodeId') || undefined,
  })
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path.join('.'), i.message]),
      ),
    }
  }

  const payload = await getPayloadClient()

  const ed = await payload.findByID({ collection: 'event-dates', id: eventDateId, depth: 0 })
  const edObj = ed as {
    active?: boolean; price: number; vat: number; currency: 'EUR' | 'CZK'
  }
  if (!edObj.active) {
    return { ok: false, formError: 'This date is no longer available.' }
  }
  const addresses = (user.addresses ?? []) as Array<Record<string, unknown>>
  const chosen = addresses[parsed.data.addressIndex]
  if (!chosen) {
    return { ok: false, fieldErrors: { addressIndex: 'Select a valid address.' } }
  }
  const billingAddress = {
    firstName: chosen.firstName, lastName: chosen.lastName, street: chosen.street,
    city: chosen.city, postalCode: chosen.postalCode, country: chosen.country,
    company: chosen.company,
  }

  // Re-validate the discount code id (don't trust the hidden form field).
  let discountCodeId: number | null = null
  if (parsed.data.discountCodeId !== undefined) {
    const dc = await resolveActiveDiscountCode(payload, parsed.data.discountCodeId)
    if (!dc) {
      return {
        ok: false,
        fieldErrors: { discountCodeId: 'This code is no longer valid.' },
      }
    }
    discountCodeId = dc.id
  }

  // Resolve the referral from the cookie (single source of truth — not a hidden form field).
  const cookieJar = await cookies()
  const refCode = cookieJar.get(REFERRAL_COOKIE_NAME)?.value
  let referralId: number | null = null
  if (refCode) {
    const ref = await resolveActiveReferralByCode(payload, refCode.trim().toUpperCase())
    if (ref) referralId = ref.id
  }

  let newOrderId: number | string
  try {
    const order = await payload.create({
      collection: 'orders',
      data: {
        user: user.id,
        eventDate: eventDateId,
        participants: parsed.data.participants,
        billingAddress,
        unitPrice: edObj.price,
        vat: edObj.vat,
        currency: edObj.currency,
        state: 'pending',
        customerNote: parsed.data.customerNote,
        discountCode: discountCodeId ?? undefined,
        referral: referralId ?? undefined,
      } as never,
      user,
      overrideAccess: false,
    })
    newOrderId = order.id
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Booking failed. Please try again.'
    return { ok: false, formError: msg }
  }
  redirect(`/book/${eventDateId}/confirmation/${newOrderId}`)
}
```

- [ ] **Step 3: Edit `page.tsx` — read referral cookie server-side and pass into `<BookingForm>`**

Open `src/app/(frontend)/book/[eventDateId]/page.tsx`. Find the place where `<BookingForm ... />` is rendered. Just before that, add the referral-resolution block, then pass `referral` to the component.

Add these imports near the top (with the existing imports):

```ts
import { cookies } from 'next/headers'
import { REFERRAL_COOKIE_NAME } from '@/lib/referral'
```

Add this code right before the `return (` that renders the form (use `getPayloadClient` if it's not already in scope on that path — it is in the existing file):

```ts
const cookieJar = await cookies()
const refCode = cookieJar.get(REFERRAL_COOKIE_NAME)?.value
let referral: { name: string; discountPercent: number } | null = null
if (refCode) {
  const payloadForRef = await getPayloadClient()
  const { docs } = await payloadForRef.find({
    collection: 'referrals',
    where: {
      and: [
        { code: { equals: refCode.trim().toUpperCase() } },
        { active: { equals: true } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  const ref = docs[0] as { name: string; discountPercent: number } | undefined
  if (ref) referral = { name: ref.name, discountPercent: ref.discountPercent }
}
```

Then change the `<BookingForm` JSX call to include `referral={referral}`:

```tsx
<BookingForm
  eventDateId={eventDateId}
  unitPrice={...}
  currency={...}
  vat={...}
  remaining={...}
  addresses={...}
  booker={...}
  referral={referral}
/>
```

(Match the existing prop spelling/casing of `eventDateId` etc. exactly. The only NEW prop is `referral`.)

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0. (One error you might see: `BookingForm` doesn't accept `referral` yet — that's fine, T9 adds it. If tsc fails on that, skip ahead and complete T9, then come back to verify.)

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/book/\[eventDateId\]/{schema.ts,actions.ts,page.tsx}
git commit -m "$(cat <<'EOF'
feat(book): action + page wire discount code id + rb_ref cookie

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: BookingForm UI — discount panel, referral notice, price breakdown

**Files:**
- Modify: `src/app/(frontend)/book/[eventDateId]/BookingForm.tsx`

- [ ] **Step 1: Replace the file**

Replace the whole file with:

```tsx
'use client'
import React, { useActionState, useState, useTransition } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import styles from '@/components/forms/forms.module.css'
import { createBookingAction } from './actions'
import {
  validateDiscountCodeAction,
  type ValidateDiscountResult,
} from './validate-discount'

interface AddressOption {
  index: number
  label: string
  preview: string
  isDefault: boolean
}

interface Props {
  eventDateId: number
  unitPrice: number
  currency: string
  vat: number
  remaining: number
  addresses: AddressOption[]
  booker: { firstName: string; lastName: string; email: string; phone: string }
  referral: { name: string; discountPercent: number } | null
}

interface Participant {
  firstName: string; lastName: string; email: string; phone: string
}

type AppliedDiscount = Extract<ValidateDiscountResult, { ok: true }>

export function BookingForm({
  eventDateId, unitPrice, currency, vat, remaining, addresses, booker, referral,
}: Props) {
  const [state, formAction] = useActionState(createBookingAction, INITIAL_ACTION_STATE)
  const initial: Participant[] = [
    { firstName: booker.firstName, lastName: booker.lastName, email: booker.email, phone: booker.phone },
  ]
  const [participants, setParticipants] = useState<Participant[]>(initial)
  const [addressIndex, setAddressIndex] = useState(
    String(addresses.find((a) => a.isDefault)?.index ?? 0),
  )
  const [note, setNote] = useState('')

  // Discount-code panel state.
  const [showCodePanel, setShowCodePanel] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [applied, setApplied] = useState<AppliedDiscount | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const noAddresses = addresses.length === 0
  const overCapacity = participants.length > remaining

  const update = (i: number, patch: Partial<Participant>) => {
    setParticipants((curr) => curr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }
  const add = () =>
    setParticipants((curr) => [...curr, { firstName: '', lastName: '', email: '', phone: '' }])
  const remove = (i: number) => setParticipants((curr) => curr.filter((_, idx) => idx !== i))

  const subtotal = unitPrice * participants.length
  // Snowbusters stacking rule (client preview, server is authoritative).
  const effectivePercent = applied
    ? applied.discountPercent
    : referral
      ? referral.discountPercent
      : 0
  const discountAmount = Math.round((subtotal * effectivePercent) / 100)
  const total = subtotal - discountAmount

  const apply = () => {
    setCodeError(null)
    startTransition(async () => {
      const r = await validateDiscountCodeAction({ code: codeInput, eventDateId })
      if (r.ok) {
        setApplied(r)
        setCodeError(null)
      } else {
        setApplied(null)
        setCodeError(r.message)
      }
    })
  }

  const removeCode = () => {
    setApplied(null)
    setCodeInput('')
    setCodeError(null)
  }

  return (
    <>
      {state.ok && <FormBanner kind="success">Booking submitted — redirecting…</FormBanner>}
      {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      {noAddresses && (
        <FormBanner kind="error">
          You need at least one saved address before booking.{' '}
          <a href="/account/addresses">Add an address →</a>
        </FormBanner>
      )}
      {referral && (
        <div
          style={{
            background: '#eef7ee',
            border: '1px solid #b8d8b9',
            padding: 12,
            borderRadius: 6,
            margin: '12px 0',
          }}
        >
          You&apos;re booking via <strong>{referral.name}</strong>
          {referral.discountPercent > 0
            ? ` — ${referral.discountPercent}% off applied automatically.`
            : '.'}
        </div>
      )}
      <form action={formAction}>
        <input type="hidden" name="eventDateId" value={eventDateId} />
        {applied && <input type="hidden" name="discountCodeId" value={applied.id} />}

        <h2 style={{ marginTop: 24 }}>Participants</h2>
        {participants.map((p, i) => (
          <fieldset key={i} style={{ border: '1px solid #e3e0dc', padding: 16, marginBottom: 12, borderRadius: 6 }}>
            <legend style={{ padding: '0 8px' }}>
              Participant {i + 1}
              {i > 0 && (
                <button type="button" onClick={() => remove(i)} style={{ marginLeft: 12, background: 'none', border: 0, color: '#c8102e', cursor: 'pointer' }}>
                  Remove
                </button>
              )}
            </legend>
            <FormField name={`participants.${i}.firstName`} label="First name"
              value={p.firstName} onChange={(e) => update(i, { firstName: e.target.value })}
              required error={!state.ok ? state.fieldErrors?.[`participants.${i}.firstName`] : undefined} />
            <FormField name={`participants.${i}.lastName`} label="Last name"
              value={p.lastName} onChange={(e) => update(i, { lastName: e.target.value })}
              required error={!state.ok ? state.fieldErrors?.[`participants.${i}.lastName`] : undefined} />
            <FormField name={`participants.${i}.email`} label="Email" type="email"
              value={p.email} onChange={(e) => update(i, { email: e.target.value })}
              required error={!state.ok ? state.fieldErrors?.[`participants.${i}.email`] : undefined} />
            <FormField name={`participants.${i}.phone`} label="Phone"
              value={p.phone} onChange={(e) => update(i, { phone: e.target.value })}
              required error={!state.ok ? state.fieldErrors?.[`participants.${i}.phone`] : undefined} />
          </fieldset>
        ))}
        <button type="button" onClick={add} disabled={participants.length >= remaining} style={{ marginBottom: 24 }}>
          + Add participant
        </button>

        <h2>Billing address</h2>
        {noAddresses ? (
          <p>No saved addresses yet.</p>
        ) : (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="addressIndex">Pick from your saved addresses</label>
            <select id="addressIndex" name="addressIndex" className={styles.input}
              value={addressIndex} onChange={(e) => setAddressIndex(e.target.value)}>
              {addresses.map((a) => (
                <option key={a.index} value={a.index}>
                  {a.label}{a.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
            <div style={{ marginTop: 8, fontSize: 14, color: '#444', whiteSpace: 'pre-line' }}>
              {addresses.find((a) => String(a.index) === addressIndex)?.preview}
            </div>
            {!state.ok && state.fieldErrors?.addressIndex && (
              <span role="alert" className={styles.error}>{state.fieldErrors.addressIndex}</span>
            )}
          </div>
        )}

        <h2>Have a discount code?</h2>
        {!applied && !showCodePanel && (
          <button
            type="button"
            onClick={() => setShowCodePanel(true)}
            style={{ background: 'none', border: 0, color: '#1a73e8', cursor: 'pointer', padding: 0 }}
          >
            + Add a code
          </button>
        )}
        {!applied && showCodePanel && (
          <div className={styles.field} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Enter code"
              className={styles.input}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={apply}
              disabled={pending || codeInput.trim().length === 0}
              style={{ padding: '8px 16px' }}
            >
              {pending ? 'Applying…' : 'Apply'}
            </button>
          </div>
        )}
        {codeError && <span role="alert" className={styles.error}>{codeError}</span>}
        {applied && (
          <div style={{ background: '#eef7ee', padding: 12, borderRadius: 6, marginTop: 8 }}>
            <strong>{applied.code}</strong> applied — {applied.discountPercent}% off
            <button
              type="button"
              onClick={removeCode}
              style={{ marginLeft: 12, background: 'none', border: 0, color: '#c8102e', cursor: 'pointer' }}
            >
              Remove
            </button>
            {applied.description && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555' }}>{applied.description}</p>
            )}
          </div>
        )}

        <h2>Notes (optional)</h2>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="customerNote">Any extra info for our team</label>
          <textarea id="customerNote" name="customerNote" className={styles.input} rows={4}
            value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div style={{ background: '#f5f1ea', padding: 16, borderRadius: 6, margin: '16px 0' }}>
          <strong>Order summary</strong>
          <div style={{ marginTop: 8 }}>
            <div>
              Subtotal: {unitPrice} {currency} × {participants.length} = {subtotal} {currency}
            </div>
            {discountAmount > 0 && (
              <div style={{ color: '#206020' }}>
                Discount{applied ? ` (${applied.code})` : referral ? ` (${referral.name})` : ''}:
                {' '}−{discountAmount} {currency}
              </div>
            )}
            <div style={{ marginTop: 4 }}>
              <strong>Total: {total} {currency}</strong>
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>VAT {vat}% included.</div>
          </div>
        </div>
        {overCapacity && (
          <FormBanner kind="error">
            Only {remaining} seat(s) left. Reduce the participant count.
          </FormBanner>
        )}
        <SubmitButton>{noAddresses || overCapacity ? 'Cannot submit' : 'Submit booking'}</SubmitButton>
      </form>
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/book/\[eventDateId\]/BookingForm.tsx
git commit -m "$(cat <<'EOF'
feat(book): discount-code panel + referral notice + price breakdown

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Confirmation + account order-detail price breakdown

**Files:**
- Modify: `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/page.tsx`
- Modify: `src/app/(frontend)/account/orders/[id]/page.tsx`

- [ ] **Step 1: Edit `confirmation/[orderId]/page.tsx`** — extend the `o` type cast to include the new fields, and replace the `<p><strong>Total:</strong> ...</p>` line with a small breakdown:

In the `as { ... }` cast block, append:

```ts
    discountAmount?: number
    discountCode?: number | { code: string } | null
    referral?: number | { name: string } | null
```

Then replace this line:

```tsx
        <p><strong>Total:</strong> {o.totalPrice} {o.currency}</p>
```

with:

```tsx
        {(o.discountAmount ?? 0) > 0 && (
          <>
            <p><strong>Subtotal:</strong> {o.totalPrice + (o.discountAmount ?? 0)} {o.currency}</p>
            <p style={{ color: '#206020' }}>
              <strong>Discount:</strong> −{o.discountAmount} {o.currency}
              {typeof o.discountCode === 'object' && o.discountCode
                ? ` (${o.discountCode.code})`
                : typeof o.referral === 'object' && o.referral
                  ? ` (${o.referral.name})`
                  : ''}
            </p>
          </>
        )}
        <p><strong>Total:</strong> {o.totalPrice} {o.currency}</p>
```

- [ ] **Step 2: Edit `account/orders/[id]/page.tsx`** — extend the type cast and replace the Price section.

In the `as { ... }` cast block, append:

```ts
    discountAmount?: number
    discountCommission?: number
    referralCommission?: number
    discountCode?: number | { code: string; title: string } | null
    referral?: number | { name: string } | null
```

Replace the existing Price section:

```tsx
      <h3>Price</h3>
      <p>
        {o.unitPrice} {o.currency} × {o.participantCount} = <strong>{o.totalPrice} {o.currency}</strong>
        <br /><span style={{ color: '#666', fontSize: 13 }}>VAT {o.vat}% included.</span>
      </p>
```

with:

```tsx
      <h3>Price</h3>
      {(o.discountAmount ?? 0) > 0 ? (
        <>
          <p>
            Subtotal: {o.unitPrice} {o.currency} × {o.participantCount} = {o.totalPrice + (o.discountAmount ?? 0)} {o.currency}
          </p>
          <p style={{ color: '#206020' }}>
            Discount: −{o.discountAmount} {o.currency}
            {typeof o.discountCode === 'object' && o.discountCode
              ? ` (${o.discountCode.code})`
              : typeof o.referral === 'object' && o.referral
                ? ` (${o.referral.name})`
                : ''}
          </p>
          <p><strong>Total: {o.totalPrice} {o.currency}</strong></p>
        </>
      ) : (
        <p>
          {o.unitPrice} {o.currency} × {o.participantCount} = <strong>{o.totalPrice} {o.currency}</strong>
        </p>
      )}
      <p><span style={{ color: '#666', fontSize: 13 }}>VAT {o.vat}% included.</span></p>
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/book/\[eventDateId\]/confirmation/\[orderId\]/page.tsx src/app/\(frontend\)/account/orders/\[id\]/page.tsx
git commit -m "$(cat <<'EOF'
feat(orders): show discount line on confirmation + account order detail

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Booking-confirmed email — discount line

**Files:**
- Modify: `src/lib/email/templates.ts`
- Modify: `src/collections/orders/emails-hook.ts`

- [ ] **Step 1: Edit `templates.ts`** — extend `BookingCtx` and `orderSummary`.

Replace the `BookingCtx` interface and `orderSummary` function with:

```ts
interface BookingCtx {
  name: string
  orderNumber: string
  eventTitle: string
  eventDate: string
  participantCount: number
  totalPrice: number
  currency: string
  accountOrderUrl: string
  // Discount snapshot (optional — present only when an order had a discount).
  discountAmount?: number
  discountCodeCode?: string // e.g. "HOLIDAY10"
  referralName?: string     // partner name; used when no discount code but a referral applied
}

function orderSummary(ctx: BookingCtx): string {
  const hasDiscount = (ctx.discountAmount ?? 0) > 0
  const subtotal = ctx.totalPrice + (ctx.discountAmount ?? 0)
  const discountLabel = ctx.discountCodeCode
    ? `Discount (${escapeHtml(ctx.discountCodeCode)})`
    : ctx.referralName
      ? `Discount (${escapeHtml(ctx.referralName)})`
      : 'Discount'
  return `
    <p style="margin:16px 0;">
      <strong>Order:</strong> ${escapeHtml(ctx.orderNumber)}<br/>
      <strong>Trip:</strong> ${escapeHtml(ctx.eventTitle)}<br/>
      <strong>Dates:</strong> ${escapeHtml(ctx.eventDate)}<br/>
      <strong>Participants:</strong> ${ctx.participantCount}<br/>
      ${hasDiscount ? `<strong>Subtotal:</strong> ${subtotal} ${escapeHtml(ctx.currency)}<br/>` : ''}
      ${hasDiscount ? `<strong>${discountLabel}:</strong> −${ctx.discountAmount} ${escapeHtml(ctx.currency)}<br/>` : ''}
      <strong>Total:</strong> ${ctx.totalPrice} ${escapeHtml(ctx.currency)}
    </p>
  `
}
```

(Do NOT change `bookingReceivedToUserTemplate`, `bookingReceivedToAdminTemplate`, `bookingConfirmedToUserTemplate`, or `bookingCancelledToUserTemplate` — they all call `orderSummary(ctx)` so they pick up the new lines automatically.)

- [ ] **Step 2: Edit `src/collections/orders/emails-hook.ts`** — extend `OrderLike`, look up the related code/referral docs when present, and add the three optional fields to `baseCtx`.

In `OrderLike` (line ~11), append three optional fields:

```ts
  discountAmount?: number
  discountCode?: number | { code: string } | null
  referral?: number | { name: string } | null
```

In `dispatchLifecycleEmails`, after the existing event-title/date-range resolution block (around line 60, just before `const baseCtx = { ... }`), add the discount-code/referral name resolution:

```ts
  // Resolve discount-code code + referral name for the email template.
  // Same pattern as the event lookup above — handle both shapes (id | object).
  let discountCodeCode: string | undefined
  if (o.discountCode != null) {
    if (typeof o.discountCode === 'object') {
      discountCodeCode = o.discountCode.code
    } else {
      const dc = await req.payload.findByID({
        collection: 'discount-codes', id: o.discountCode, depth: 0, req,
      })
      discountCodeCode = (dc as { code?: string }).code
    }
  }
  let referralName: string | undefined
  if (o.referral != null) {
    if (typeof o.referral === 'object') {
      referralName = o.referral.name
    } else {
      const ref = await req.payload.findByID({
        collection: 'referrals', id: o.referral, depth: 0, req,
      })
      referralName = (ref as { name?: string }).name
    }
  }
```

Then extend `baseCtx`:

```ts
  const baseCtx = {
    name: userName,
    orderNumber: o.orderNumber,
    eventTitle, eventDate: eventDateRange,
    participantCount: o.participantCount,
    totalPrice: o.totalPrice,
    currency: o.currency,
    accountOrderUrl: siteUrl(`/account/orders/${o.id}`),
    discountAmount: o.discountAmount,
    discountCodeCode,
    referralName,
  }
```

No other change needed — every template (`bookingReceivedToUserTemplate`, `bookingConfirmedToUserTemplate`, `bookingCancelledToUserTemplate`) calls `orderSummary(ctx)` internally, which now reads the new fields. The admin-notification template (`bookingReceivedToAdminTemplate`) takes a different ctx shape and is intentionally NOT changed.

- [ ] **Step 3: Run existing email-template tests**

Run: `pnpm vitest run tests/int/email-templates.int.spec.ts`
Expected: pass. (Existing tests build BookingCtx without the new optional fields → discount block is omitted → output is byte-identical to the pre-change output.)

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email/templates.ts src/collections/orders/emails-hook.ts
git commit -m "$(cat <<'EOF'
feat(email): booking emails show discount line when applied

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: e2e specs

**Files:**
- Create: `tests/e2e/discount-referral.e2e.spec.ts`

- [ ] **Step 1: Write the spec**

Create `tests/e2e/discount-referral.e2e.spec.ts`. This mirrors the seed + login + afterAll-cleanup pattern from `tests/e2e/booking.e2e.spec.ts` (verified 2026-06-13). FK-safe cleanup order: `orders → event-dates → events → users → discount-codes → referrals`.

```ts
import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const BASE = 'http://localhost:3001'
const runId = Date.now().toString(36)
const customer = {
  email: `dc-ref-e2e-${runId}@example.com`,
  password: 'dc-ref-e2e-pwd-1',
  name: 'Discount Tester',
  phone: '+420 600 000 998',
}
const eventTitle = `E2E DC/Ref Trip ${runId}`
const dcCode = `DCE2E${runId.toUpperCase()}`
const refCode = `REFE2E${runId.toUpperCase()}`

let eventDateId: number
let eventId: number
let discountCodeId: number
let referralId: number

test.beforeAll(async () => {
  const payload = await getPayload({ config })

  const event = await payload.create({
    collection: 'events',
    data: { title: eventTitle } as never,
  })
  eventId = event.id
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-09-01T00:00:00.000Z',
      dateTo: '2027-09-05T00:00:00.000Z',
      price: 200, vat: 21, currency: 'EUR', capacity: 5, active: true,
    },
  })
  eventDateId = ed.id

  const u = await payload.create({
    collection: 'users',
    data: {
      ...customer, role: 'customer',
      addresses: [{
        label: 'Home', isDefault: true,
        firstName: 'Discount', lastName: 'Tester',
        street: 'Main 1', city: 'Prague', postalCode: '11000', country: 'CZ',
      }],
    } as never,
  })
  await payload.update({
    collection: 'users', id: u.id, data: { _verified: true } as never, overrideAccess: true,
  })

  const dc = await payload.create({
    collection: 'discount-codes',
    data: {
      code: dcCode, title: 'E2E 25% off',
      discountPercent: 25,
      validFrom: '2020-01-01', validUntil: '2099-12-31',
      commissionPercent: 10,
    } as never,
  })
  discountCodeId = dc.id as number

  const ref = await payload.create({
    collection: 'referrals',
    data: {
      code: refCode, name: 'E2E Partner',
      email: `partner-${runId}@example.com`,
      discountPercent: 10, commissionPercent: 15,
    } as never,
  })
  referralId = ref.id as number
})

// FK-safe cleanup. Orders first (they point at event-date, user, dc, ref).
test.afterAll(async () => {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'orders', where: { 'user.email': { equals: customer.email } } })
  await payload.delete({ collection: 'event-dates', where: { id: { equals: eventDateId } } })
  await payload.delete({ collection: 'events', where: { id: { equals: eventId } } })
  await payload.delete({ collection: 'users', where: { email: { equals: customer.email } } })
  await payload.delete({ collection: 'discount-codes', where: { id: { equals: discountCodeId } } })
  await payload.delete({ collection: 'referrals', where: { id: { equals: referralId } } })
})

async function login(page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[name="email"]', customer.email)
  await page.fill('input[name="password"]', customer.password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
}

test('book with a discount code', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/book/${eventDateId}`)
  await page.getByRole('button', { name: /add a code/i }).click()
  await page.getByPlaceholder('Enter code').fill(dcCode)
  await page.getByRole('button', { name: /^apply$/i }).click()
  await expect(page.getByText(new RegExp(`${dcCode}.*applied`, 'i'))).toBeVisible()
  await expect(page.getByText(/−50 EUR/)).toBeVisible()

  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(new RegExp(`/book/${eventDateId}/confirmation/\\d+`))
  await expect(page.getByText(/Discount.*−50 EUR/i)).toBeVisible()
})

test('book via referral URL — cookie set, ?ref stripped, notice shown', async ({ page }) => {
  await login(page)
  const resp = await page.goto(`${BASE}/book/${eventDateId}?ref=${refCode}`)
  expect(resp?.url()).not.toContain('ref=')
  await expect(page.getByText(/booking via.*E2E Partner.*10% off/i)).toBeVisible()

  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(new RegExp(`/book/${eventDateId}/confirmation/\\d+`))
  await expect(page.getByText(/−20 EUR/)).toBeVisible()
})

test('book with BOTH — DC wins on price; referral commission still snapshotted', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/book/${eventDateId}?ref=${refCode}`)
  await expect(page.getByText(/booking via.*E2E Partner/i)).toBeVisible()
  await page.getByRole('button', { name: /add a code/i }).click()
  await page.getByPlaceholder('Enter code').fill(dcCode)
  await page.getByRole('button', { name: /^apply$/i }).click()
  await expect(page.getByText(/−50 EUR/)).toBeVisible()   // DC's 25%, not referral's 10%

  await page.click('button[type="submit"]')
  const urlMatch = page.url().match(/confirmation\/(\d+)/)
  expect(urlMatch).not.toBeNull()
  const orderId = Number(urlMatch![1])

  // Verify the snapshot: DC discount + referral commission both recorded.
  const payload = await getPayload({ config })
  const order = (await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })) as {
    discountAmount: number; discountCommission: number; referralCommission: number
    discountCode: number | null; referral: number | null
  }
  expect(order.discountAmount).toBe(50)
  expect(order.discountCommission).toBe(20)   // 200 * 10%
  expect(order.referralCommission).toBe(30)   // 200 * 15%, still tracked
  expect(order.discountCode).toBe(discountCodeId)
  expect(order.referral).toBe(referralId)
})

test('invalid discount code shows inline error', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/book/${eventDateId}`)
  await page.getByRole('button', { name: /add a code/i }).click()
  await page.getByPlaceholder('Enter code').fill('NOPE-NEVER-EXISTED')
  await page.getByRole('button', { name: /^apply$/i }).click()
  await expect(page.getByText(/not valid/i)).toBeVisible()
})
```

- [ ] **Step 2: Run the e2e spec**

Run: `pnpm test:e2e -- --grep "discount + referral|book with a discount|book via referral URL|book with BOTH|invalid discount code"`
Expected: all 4 tests pass. (Or just `pnpm test:e2e tests/e2e/discount-referral.e2e.spec.ts`.)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/discount-referral.e2e.spec.ts
git commit -m "$(cat <<'EOF'
test(e2e): book with discount code + referral URL + both + invalid code

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Full verification

- [ ] **Step 1: Run the full int suite**

Run: `pnpm test:int`
Expected: 0 failures. (Roughly +5 spec files, +15–20 tests.)

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both exit 0. (Lint may carry the same 42 pre-existing warnings flagged during the revalidation work — verify the count hasn't grown.)

- [ ] **Step 3: Production build**

Run: `pnpm build`
Expected: build succeeds. In the route table, the existing static catalogue routes (`/`, `/blog`, `/calendar`, `/destinations`, `/programs`, `/team`) should still be marked `○` — adding `src/proxy.ts` must NOT flip them to `ƒ`. (Next 16 runs the proxy at the edge for each request but does not force the underlying pages dynamic.)

- [ ] **Step 4: Full e2e**

Run: `pnpm test:e2e`
Expected: all specs pass, including the 4 new discount+referral specs and the existing 57.

- [ ] **Step 5: Use superpowers:finishing-a-development-branch** to decide how to integrate (merge/PR).

---

## Notes on scope & known limitations

- **No automatic commission emails.** `commissionEmail` (DC) and `email` (referral) are stored but no notification fires at MVP. Adding a "redemption notice" email later is a single addition to the existing `dispatchLifecycleEmails` order hook.
- **Cookie-only referral.** No URL query string for affiliate links beyond the initial `?ref=CODE` capture — the cookie is the persistent source of truth. If a customer clears cookies between visit and booking, the referral is lost; no UX recovery is offered.
- **Snapshots are final.** Editing a `discount-codes` or `referrals` record after orders have been placed does NOT rewrite the `discountAmount` / commission snapshots on those orders. Intentional.
- **Currency-agnostic commission percent.** All commission math is percent of the order subtotal in the order's currency. A partner that books both EUR and CZK orders earns each commission in the corresponding currency; admin handles cross-currency payouts manually.
- **No URL capture for discount codes.** Only referrals get URL capture; promo codes must be typed.
