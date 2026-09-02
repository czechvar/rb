# Benefit+ (MuzaPay) Payment Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second "Pay with Benefit+" button to the booking confirmation page, backed by a MuzaPay gateway that settles in CZK and resolves its result by polling rather than by webhook.

**Architecture:** Event dates gain an optional CZK price which orders snapshot at create time; the order itself stays EUR. A new `MuzaPayGateway` implements the existing `PaymentGateway` contract, but because Benefit+ sends no webhook, the result is read from its status endpoint — once when the payer returns, and again from a Vercel Cron sweep for abandoned sessions. The order-state chain currently buried inside `applyComgateWebhook` is extracted first so both gateways share it.

**Tech Stack:** Next.js App Router (Server Actions + route handlers), Payload CMS 3 (Postgres/Drizzle), TypeScript, Vitest integration tests, Node `crypto` for RSA-SHA256 signing.

**Spec:** `docs/superpowers/specs/2026-09-02-benefit-plus-gateway-design.md`

**Running tests:** `pnpm test:int` runs the whole suite. To run one file, use
`pnpm exec vitest run --config ./vitest.config.mts <path>` — `pnpm test:int -- <path>`
does *not* filter, it silently runs everything.

**Worktree setup (once):** this worktree needs `.env` and `.env.test` copied from
the main checkout at `/Users/janantl/Work/rockbusters/v3/`, and `pnpm install` run
in it. Both are already done.

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `src/payments/money.ts` | `toMinorUnits` — decimal string → integer minor units. Shared by both gateways. |
| `src/payments/transaction-store.ts` | `PayloadTransactionStore`, `toGatewayTransaction`, the `OrderDoc`/`TransactionDoc` narrowings. |
| `src/payments/order-transitions.ts` | `applyOutcome` — the single place the order state chain lives. |
| `src/payments/muzapay/config.ts` | Env config + `isBenefitPlusConfigured()`. |
| `src/payments/muzapay/client.ts` | `MuzaPayClient` — JSON HTTP transport, no domain knowledge. |
| `src/payments/muzapay/gateway.ts` | `MuzaPayGateway implements PaymentGateway`. |
| `src/app/api/payments/muzapay/return/route.ts` | Payer-facing return URL; resolves then redirects. |
| `src/app/api/payments/muzapay/reconcile/route.ts` | Cron sweep for unresolved payments. |
| `tests/int/money.int.spec.ts` | `toMinorUnits`. |
| `tests/int/order-transitions.int.spec.ts` | The four `applyOutcome` cases. |
| `tests/int/muzapay-signing.int.spec.ts` | Signature builder + signer + `rawUrlEncode`. |
| `tests/int/muzapay-gateway.int.spec.ts` | `begin`, `checkStatus` mapping, `cancel`, webhook refusal. |

**Modified:**

| File | Change |
|---|---|
| `src/collections/EventDates.ts` | Add `priceCzk`. |
| `src/collections/Orders.ts` | Add `unitPriceCzk`, `totalPriceCzk`. |
| `src/collections/Transactions.ts` | Add `orderReference`; relabel the `muzapay` option. |
| `src/collections/orders/hooks.ts` | Derive `totalPriceCzk`. |
| `src/payments/gateway.ts` | Add `orderReference?` to `Transaction`; drop the resolved DRAFT block. |
| `src/payments/comgate/gateway.ts` | Import `toMinorUnits` from `../money`. |
| `src/payments/order-payment-service.ts` | Shrink to the public API; add the three Benefit+ functions. |
| `src/app/(frontend)/book/[eventDateId]/actions.ts` | Pass `unitPriceCzk` on order create. |
| `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/actions.ts` | Add `payWithBenefitPlusAction`. |
| `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/page.tsx` | Render the second button. |
| `vercel.json` | Add the cron entry. |
| `CLAUDE.md` | Document the new env vars. |

**Interface decision made while planning:** `PaymentGateway.begin()` receives only a `Transaction`, but MuzaPay's init call needs an `orderReferenceCode` (the order number) and an `orderDescription`. Rather than widen the contract, the `Transaction` gains one optional `orderReference` field, and `orderDescription` maps onto the existing `label` — with `beginBenefitPlusPayment` setting that label to the event title (truncated to 255), which is what `label` is documented to be ("short human label shown to the payer / on the gateway").

---

## Task 1: Schema — CZK prices and the transaction order reference

One migration covers all four new columns so there is only one `migrate:create` run.

**Files:**
- Modify: `src/collections/EventDates.ts:42`
- Modify: `src/collections/Orders.ts:94`, `src/collections/Orders.ts:106`
- Modify: `src/collections/Transactions.ts`
- Modify: `src/collections/orders/hooks.ts:18-67`
- Modify: `src/app/(frontend)/book/[eventDateId]/actions.ts:93-95`, `:141`
- Test: `tests/int/order-pricing.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/int/order-pricing.int.spec.ts`. It reuses the `seedEventDate`, `seedUser` and `billing` helpers already at the top of that file, but needs a CZK-aware seed — add both blocks:

```ts
async function seedEventDateWithCzk(price = 200, priceCzk = 5000) {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: {
      title: `CzkPricingTest ${unique}`,
      slug: `czkpricingtest-${unique}`,
      state: 'published',
    } as never,
    overrideAccess: true,
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-01-01',
      dateTo: '2027-01-08',
      price,
      priceCzk,
      vat: 21,
      currency: 'EUR',
      capacity: 10,
      active: true,
    } as never,
    overrideAccess: true,
  })
  return { eventDateId: ed.id as number }
}

describe('CZK order pricing', () => {
  it('derives totalPriceCzk with the same discount formula as totalPrice', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDateWithCzk(200, 5000)
    const user = await seedUser()
    const discount = await payload.create({
      collection: 'discount-codes',
      data: {
        code: `CZK${Date.now()}${Math.floor(Math.random() * 1000)}`,
        title: 'CZK test',
        discountPercent: 10,
        validFrom: '2020-01-01',
        validUntil: '2099-01-01',
        active: true,
      } as never,
      overrideAccess: true,
    })

    const order = await payload.create({
      collection: 'orders',
      data: {
        user: user.id,
        eventDate: eventDateId,
        participants: [
          { firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' },
          { firstName: 'C', lastName: 'D', email: 'c@x.test', phone: '+2' },
        ],
        billingAddress: billing,
        unitPrice: 200,
        unitPriceCzk: 5000,
        vat: 21,
        currency: 'EUR',
        discountCode: discount.id,
        state: 'pending',
      } as never,
      overrideAccess: true,
    })

    // EUR: 200 * 2 = 400, less 10% = 360. CZK: 5000 * 2 = 10000, less 10% = 9000.
    expect(order.totalPrice).toBe(360)
    expect(order.unitPriceCzk).toBe(5000)
    expect(order.totalPriceCzk).toBe(9000)
  })

  it('leaves totalPriceCzk null when the trip has no CZK price', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDate(200)
    const user = await seedUser()

    const order = await payload.create({
      collection: 'orders',
      data: {
        user: user.id,
        eventDate: eventDateId,
        participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
        billingAddress: billing,
        unitPrice: 200,
        vat: 21,
        currency: 'EUR',
        state: 'pending',
      } as never,
      overrideAccess: true,
    })

    expect(order.totalPrice).toBe(200)
    expect(order.unitPriceCzk ?? null).toBeNull()
    expect(order.totalPriceCzk ?? null).toBeNull()
  })

  it('treats a zero CZK price as a real price, not as "unavailable"', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDateWithCzk(200, 0)
    const user = await seedUser()

    const order = await payload.create({
      collection: 'orders',
      data: {
        user: user.id,
        eventDate: eventDateId,
        participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
        billingAddress: billing,
        unitPrice: 200,
        unitPriceCzk: 0,
        vat: 21,
        currency: 'EUR',
        state: 'pending',
      } as never,
      overrideAccess: true,
    })

    expect(order.totalPriceCzk).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/order-pricing.int.spec.ts
```

Expected: FAIL. Payload rejects the unknown `priceCzk` / `unitPriceCzk` fields, or `totalPriceCzk` comes back `undefined`.

- [ ] **Step 3: Add `priceCzk` to event dates**

In `src/collections/EventDates.ts`, immediately after the `price` field (line 42):

```ts
    { name: 'price', type: 'number', required: true, min: 0 },
    {
      name: 'priceCzk',
      type: 'number',
      min: 0,
      admin: {
        description:
          'CZK price per person, used only for Benefit+ (MuzaPay) payments. Leave empty to disable Benefit+ for this trip.',
      },
    },
```

- [ ] **Step 4: Add the CZK fields to orders**

In `src/collections/Orders.ts`, immediately after the `unitPrice` field:

```ts
    { name: 'unitPrice', type: 'number', required: true, admin: { readOnly: true } },
    {
      name: 'unitPriceCzk',
      type: 'number',
      admin: {
        readOnly: true,
        description:
          'CZK price per person, snapshotted from the event date at booking time. Null when the trip has no CZK price.',
      },
    },
```

and immediately after the `totalPrice` field:

```ts
    { name: 'totalPrice', type: 'number', required: true, admin: { readOnly: true } },
    {
      name: 'totalPriceCzk',
      type: 'number',
      admin: {
        readOnly: true,
        description:
          'CZK order total, derived with the same discount formula as totalPrice. Used only as the Benefit+ payment amount. Null when the trip has no CZK price.',
      },
    },
```

- [ ] **Step 5: Add `orderReference` to transactions**

In `src/collections/Transactions.ts`, after the `label` field:

```ts
    { name: 'label', type: 'text', required: true },
    {
      name: 'orderReference',
      type: 'text',
      admin: {
        description:
          'The human order number sent to the gateway, so support tickets can be reconciled without the internal id.',
      },
    },
```

and in the same file change the `muzapay` option label:

```ts
        { label: 'Benefit+ (MuzaPay)', value: 'muzapay' },
```

- [ ] **Step 6: Derive `totalPriceCzk` in the pricing hook**

In `src/collections/orders/hooks.ts`, inside `deriveCountsAndTotal`, widen the `d` narrowing and add the CZK derivation. The full changed region:

```ts
  const d = data as {
    participants?: unknown[]
    unitPrice?: unknown
    unitPriceCzk?: unknown
    discountCode?: number | null
    referral?: number | null
  }
  const participants = Array.isArray(d.participants) ? d.participants : []
  const participantCount = participants.length
  const unitPrice = Number(d.unitPrice ?? 0)
  const basePrice = unitPrice * participantCount

  // Null, not 0: a trip with no CZK price must be distinguishable from a
  // free one, because null is what hides the Benefit+ button.
  const unitPriceCzk =
    d.unitPriceCzk === null || d.unitPriceCzk === undefined ? null : Number(d.unitPriceCzk)
  const basePriceCzk = unitPriceCzk === null ? null : unitPriceCzk * participantCount
```

and after `const totalPrice = basePrice - discountAmount`:

```ts
  const totalPrice = basePrice - discountAmount
  const totalPriceCzk =
    basePriceCzk === null
      ? null
      : basePriceCzk - Math.round((basePriceCzk * discountPercent) / 100)
```

and add it to the returned object:

```ts
  return {
    ...data,
    participantCount,
    totalPrice,
    totalPriceCzk,
    discountAmount,
    discountCommission,
    referralCommission,
  }
```

- [ ] **Step 7: Pass the CZK price through the booking action**

In `src/app/(frontend)/book/[eventDateId]/actions.ts`, widen the `edObj` narrowing (line 93):

```ts
  const edObj = ed as {
    active?: boolean; price: number; priceCzk?: number | null; vat: number; currency: 'EUR' | 'CZK'
  }
```

and add the field to the `payload.create` data (after `unitPrice: edObj.price,`):

```ts
        unitPrice: edObj.price,
        unitPriceCzk: edObj.priceCzk ?? null,
```

- [ ] **Step 8: Generate the migration**

```bash
pnpm payload migrate:create add_czk_prices_and_order_reference
```

Expected: two new files in `src/migrations/` — a `.ts` and its `.json` Drizzle snapshot. **Both must exist.** A `.ts` without a `.json` means the snapshot did not regenerate; delete both and re-run rather than hand-editing.

- [ ] **Step 9: Apply the migration and run the tests**

```bash
pnpm payload migrate && pnpm exec vitest run --config ./vitest.config.mts tests/int/order-pricing.int.spec.ts
```

Expected: migration applies, all three new tests PASS.

If `migrate` reports nothing to run while the columns are missing, check `payload_migrations` for a stale `name='dev' batch=-1` row and delete it — that row silently no-ops migrations in non-interactive shells.

- [ ] **Step 10: Run the full integration suite**

```bash
pnpm test:int
```

Expected: PASS. The new nullable columns must not disturb existing order tests.

- [ ] **Step 11: Commit**

```bash
git add src/collections src/migrations src/app/\(frontend\)/book tests/int/order-pricing.int.spec.ts
git commit -m "feat(orders): add CZK price to event dates and orders"
```

---

## Task 2: Extract `toMinorUnits` into a shared module

**Files:**
- Create: `src/payments/money.ts`
- Modify: `src/payments/comgate/gateway.ts:22-33`
- Test: `tests/int/money.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/money.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { toMinorUnits } from '@/payments/money'

describe('toMinorUnits', () => {
  it('converts a two-decimal string', () => {
    expect(toMinorUnits('199.00')).toBe(19900)
  })

  it('converts a whole-number string', () => {
    expect(toMinorUnits('199')).toBe(19900)
  })

  it('truncates beyond two decimals rather than rounding', () => {
    expect(toMinorUnits('82.6446')).toBe(8264)
  })

  it('pads a single decimal', () => {
    expect(toMinorUnits('9.5')).toBe(950)
  })

  it('handles an amount large enough to expose float error', () => {
    // 1234567.89 * 100 in floating point is 123456788.99999999
    expect(toMinorUnits('1234567.89')).toBe(123456789)
  })

  it('handles zero', () => {
    expect(toMinorUnits('0.00')).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/money.int.spec.ts
```

Expected: FAIL — cannot resolve `@/payments/money`.

- [ ] **Step 3: Create the module**

Create `src/payments/money.ts` with the function moved verbatim out of `comgate/gateway.ts`:

```ts
/**
 * Converts a decimal-string amount (e.g. "199.00") to integer minor units
 * (e.g. 19900) without ever routing the value through float multiplication.
 * `Money.amount` is a `DecimalString` specifically because floating point is
 * unsafe for money (see `src/payments/gateway.ts`) — do not replace this with
 * `Math.round(Number(amount) * 100)`.
 *
 * Fractions beyond two places are truncated, not rounded: amounts reaching a
 * gateway are already rounded to 2dp at persistence time.
 */
export function toMinorUnits(decimal: string): number {
  const [whole, fraction = ''] = decimal.split('.')
  const cents = (fraction + '00').slice(0, 2)
  return Number(whole) * 100 + Number(cents)
}
```

- [ ] **Step 4: Point the Comgate gateway at it**

In `src/payments/comgate/gateway.ts`, delete the local `toMinorUnits` function and its docblock (lines 22-33) and add to the imports:

```ts
import { comgatePostForm } from './client'
import { toMinorUnits } from '../money'
```

- [ ] **Step 5: Run the tests**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/money.int.spec.ts tests/int/comgate-gateway.int.spec.ts
```

Expected: PASS. The Comgate tests are the regression check that the move changed no behaviour.

- [ ] **Step 6: Commit**

```bash
git add src/payments/money.ts src/payments/comgate/gateway.ts tests/int/money.int.spec.ts
git commit -m "refactor(payments): extract toMinorUnits into a shared module"
```

---

## Task 3: Extract the transaction store

Pure move — no behaviour changes. The existing suite is the test.

**Files:**
- Create: `src/payments/transaction-store.ts`
- Modify: `src/payments/order-payment-service.ts`

- [ ] **Step 1: Create the module**

Create `src/payments/transaction-store.ts`, moving `OrderDoc`, `TransactionDoc`, `toGatewayTransaction`, and `PayloadTransactionStore` out of `order-payment-service.ts` unchanged, plus one new method:

```ts
/**
 * Payload-backed persistence for `transactions`. Split out of
 * order-payment-service.ts so both gateways can share it: Comgate resolves
 * through a webhook, Benefit+ through polling, but both need the same lookups
 * and the same domain mapping.
 */

import { getPayloadClient } from '@/lib/payload'
import type {
  Transaction as GatewayTransaction,
  TransactionState,
  PaymentMethod,
  TransactionStore,
} from './gateway'

export type Currency = 'EUR' | 'CZK'
export type OrderState = 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled'

// OrderDoc/TransactionDoc below are hand-narrowed subsets of the generated Payload
// types, not a verified 1:1 mirror of payload-types.ts — e.g. `orderNumber` is
// treated as always-present because `allocateOrderNumber` sets it on create, and
// `payload`/`callbackPayload` are narrowed to object-only because nothing but the
// payment modules ever writes them.
export interface OrderDoc {
  id: number
  orderNumber: string
  state: OrderState
  totalPrice: number
  totalPriceCzk?: number | null
  vat: number
  currency: Currency
  user: number | { id: number; email: string }
}

export interface TransactionDoc {
  id: number
  uuid: string
  order: number | { id: number }
  amount: number
  amountWithoutVat: number
  currency: Currency
  label: string
  orderReference?: string | null
  email: string
  state: TransactionState
  paymentMethod: PaymentMethod
  payload: Record<string, unknown> | null
  callbackPayload: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export function toGatewayTransaction(doc: TransactionDoc): GatewayTransaction {
  return {
    id: String(doc.id),
    uuid: doc.uuid,
    money: {
      amount: doc.amount.toFixed(2),
      amountWithoutVat: doc.amountWithoutVat.toFixed(2),
      currency: doc.currency,
    },
    label: doc.label,
    orderReference: doc.orderReference ?? undefined,
    email: doc.email,
    state: doc.state,
    paymentMethod: doc.paymentMethod,
    payload: doc.payload ?? {},
    callbackPayload: doc.callbackPayload,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export class PayloadTransactionStore implements TransactionStore {
  /**
   * The raw Payload document, which the service layer needs (it writes back
   * by numeric id). `findByUuid` below is the narrowed domain view the
   * `TransactionStore` port promises to gateways.
   */
  async findDocByUuid(uuid: string): Promise<TransactionDoc | null> {
    const cms = await getPayloadClient()
    const { docs } = await cms.find({
      collection: 'transactions',
      where: { uuid: { equals: uuid } },
      limit: 1,
      overrideAccess: true,
    })
    return (docs[0] as TransactionDoc | undefined) ?? null
  }

  async findByUuid(uuid: string): Promise<GatewayTransaction | null> {
    const doc = await this.findDocByUuid(uuid)
    return doc ? toGatewayTransaction(doc) : null
  }

  async findByGatewayTransactionId(
    gatewayTransactionId: string,
  ): Promise<GatewayTransaction | null> {
    const cms = await getPayloadClient()
    const { docs } = await cms.find({
      collection: 'transactions',
      where: { 'payload.gatewayTransactionId': { equals: gatewayTransactionId } },
      limit: 1,
      overrideAccess: true,
    })
    const doc = docs[0] as TransactionDoc | undefined
    return doc ? toGatewayTransaction(doc) : null
  }
}
```

- [ ] **Step 2: Add `orderReference` to the domain type**

In `src/payments/gateway.ts`, inside `interface Transaction`, after `label`:

```ts
  /** Short human label shown to the payer / on the gateway. */
  label: string;
  /**
   * The human order number (e.g. "RB-2026-000123") sent to gateways that
   * accept a merchant-side reference. Optional because not every gateway
   * has a field for it.
   */
  orderReference?: string;
```

- [ ] **Step 3: Strip the moved code out of the service**

In `src/payments/order-payment-service.ts`, delete the `Currency`/`OrderState` types, `OrderDoc`, `TransactionDoc`, `toGatewayTransaction`, and `PayloadTransactionStore`, and import them instead:

```ts
import {
  PayloadTransactionStore,
  toGatewayTransaction,
  type OrderDoc,
  type TransactionDoc,
} from './transaction-store'
```

Remove the now-unused `TransactionState`/`PaymentMethod`/`TransactionStore` imports from `./gateway` if TypeScript flags them.

- [ ] **Step 4: Typecheck and run the payment tests**

```bash
pnpm exec tsc --noEmit && pnpm exec vitest run --config ./vitest.config.mts tests/int/order-payment-service.int.spec.ts
```

Expected: no type errors, tests PASS unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/payments
git commit -m "refactor(payments): extract the Payload transaction store"
```

---

## Task 4: Extract the order-state chain into `applyOutcome`

**Files:**
- Create: `src/payments/order-transitions.ts`
- Modify: `src/payments/order-payment-service.ts`
- Test: `tests/int/order-transitions.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/order-transitions.int.spec.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { getTestPayload } from '../helpers/payload'
import { applyOutcome } from '@/payments/order-transitions'
import type { TransactionDoc } from '@/payments/transaction-store'

const billing = {
  firstName: 'A',
  lastName: 'B',
  street: 'Main 1',
  city: 'Prague',
  postalCode: '11000',
  country: 'CZ',
}

async function seedOrderAndTransaction(orderState: 'pending' | 'confirmed' = 'pending') {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: { title: `TransTest ${unique}`, slug: `transtest-${unique}`, state: 'published' } as never,
    overrideAccess: true,
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-05-01T00:00:00.000Z',
      dateTo: '2027-05-05T00:00:00.000Z',
      price: 100,
      vat: 21,
      currency: 'EUR',
      capacity: 10,
      active: true,
    } as never,
    overrideAccess: true,
  })
  const user = await payload.create({
    collection: 'users',
    data: {
      name: 'Trans',
      phone: '+420 600 000 040',
      email: `trans-${unique}@x.test`,
      password: 'trans-test-pwd',
      role: 'customer',
      _verified: true,
    } as never,
    overrideAccess: true,
  })
  const order = await payload.create({
    collection: 'orders',
    data: {
      user: user.id,
      eventDate: ed.id,
      participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
      billingAddress: billing,
      unitPrice: 100,
      vat: 21,
      currency: 'EUR',
      state: 'pending',
    } as never,
    overrideAccess: true,
  })
  if (orderState !== 'pending') {
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { state: orderState },
      overrideAccess: true,
    })
  }
  const txn = (await payload.create({
    collection: 'transactions',
    data: {
      uuid: randomUUID(),
      order: order.id,
      amount: 100,
      amountWithoutVat: 82.64,
      currency: 'EUR',
      label: 'Rockbusters test',
      email: user.email,
      state: 'begun',
      paymentMethod: 'muzapay',
    } as never,
    overrideAccess: true,
  })) as unknown as TransactionDoc
  return { orderId: order.id as number, txn }
}

async function orderState(orderId: number): Promise<string> {
  const payload = await getTestPayload()
  const o = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
  return o.state as string
}

async function transactionState(id: number): Promise<string> {
  const payload = await getTestPayload()
  const t = await payload.findByID({ collection: 'transactions', id, overrideAccess: true })
  return t.state as string
}

describe('applyOutcome', () => {
  it('chains pending -> confirmed -> paid and marks the transaction paid', async () => {
    const { orderId, txn } = await seedOrderAndTransaction('pending')
    await applyOutcome(txn, { state: 'paid', callbackPayload: { paymentState: 'PAID' } })
    expect(await orderState(orderId)).toBe('paid')
    expect(await transactionState(txn.id)).toBe('paid')
  })

  it('goes straight to paid from confirmed', async () => {
    const { orderId, txn } = await seedOrderAndTransaction('confirmed')
    await applyOutcome(txn, { state: 'paid', callbackPayload: {} })
    expect(await orderState(orderId)).toBe('paid')
  })

  it('cancels the order on a cancelled outcome', async () => {
    const { orderId, txn } = await seedOrderAndTransaction('pending')
    await applyOutcome(txn, { state: 'cancelled', callbackPayload: { paymentState: 'CANCELED' } })
    expect(await orderState(orderId)).toBe('cancelled')
    expect(await transactionState(txn.id)).toBe('cancelled')
  })

  it('leaves the order payable on a failed outcome so the payer can retry', async () => {
    const { orderId, txn } = await seedOrderAndTransaction('pending')
    await applyOutcome(txn, { state: 'failed', callbackPayload: { paymentState: 'DECLINED' } })
    expect(await orderState(orderId)).toBe('pending')
    expect(await transactionState(txn.id)).toBe('failed')
  })

  it('is a no-op when the transaction already carries the outcome state', async () => {
    const payload = await getTestPayload()
    const { orderId, txn } = await seedOrderAndTransaction('pending')
    await payload.update({
      collection: 'transactions',
      id: txn.id,
      data: { state: 'paid' },
      overrideAccess: true,
    })
    await applyOutcome({ ...txn, state: 'paid' }, { state: 'paid', callbackPayload: {} })
    // The order was never advanced, proving the duplicate was short-circuited
    // rather than replayed.
    expect(await orderState(orderId)).toBe('pending')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/order-transitions.int.spec.ts
```

Expected: FAIL — cannot resolve `@/payments/order-transitions`.

- [ ] **Step 3: Create the module**

Create `src/payments/order-transitions.ts`, moving the logic (and its comments) out of `applyComgateWebhook`:

```ts
/**
 * The single place a gateway outcome is turned into order + transaction
 * state. Comgate reaches it from a webhook, Benefit+ from a status poll —
 * the chaining, the idempotency, and the write ordering are identical, and
 * subtle enough that they must not be duplicated.
 */

import { getPayloadClient } from '@/lib/payload'
import type { PaymentOutcome } from './gateway'
import type { OrderDoc, TransactionDoc } from './transaction-store'

export async function applyOutcome(
  txnDoc: TransactionDoc,
  outcome: PaymentOutcome,
): Promise<void> {
  const cms = await getPayloadClient()

  // Already applied (duplicate webhook, or a poll racing the return URL) —
  // return without re-running the order transition.
  if (txnDoc.state === outcome.state) return

  // Apply the order-state transition(s) BEFORE marking the transaction terminal
  // (see below) — if this throws (e.g. the order was independently cancelled
  // between begin() and now, making the transition invalid), the transaction
  // stays in `begun`/`pending-payment`, so a retry will not short-circuit on the
  // idempotency check above and will retry the order chain.
  const orderId = typeof txnDoc.order === 'object' ? txnDoc.order.id : txnDoc.order
  const order = (await cms.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
  })) as OrderDoc

  if (outcome.state === 'paid' && order.state !== 'paid') {
    if (order.state === 'pending') {
      await cms.update({
        collection: 'orders',
        id: orderId,
        data: { state: 'confirmed' },
        overrideAccess: true,
      })
    }
    await cms.update({
      collection: 'orders',
      id: orderId,
      data: { state: 'paid' },
      overrideAccess: true,
    })
  } else if (outcome.state === 'cancelled' && order.state !== 'cancelled') {
    await cms.update({
      collection: 'orders',
      id: orderId,
      data: { state: 'cancelled' },
      overrideAccess: true,
    })
  }
  // `failed` deliberately leaves the order alone: it stays `pending`, so both
  // pay buttons remain live and the customer can retry with either method.

  // Persisted last: if this write fails after the order already transitioned,
  // that's self-healing too — the order-update above is idempotently skipped as
  // already-applied on the next attempt, and the transaction gets marked
  // correctly then.
  await cms.update({
    collection: 'transactions',
    id: txnDoc.id,
    data: { state: outcome.state, callbackPayload: outcome.callbackPayload },
    overrideAccess: true,
  })
}
```

- [ ] **Step 4: Rewrite `applyComgateWebhook` to use it**

In `src/payments/order-payment-service.ts`, replace the whole body of `applyComgateWebhook` with:

```ts
export async function applyComgateWebhook(request: Request): Promise<Response> {
  const gateway = comgateGateway()
  const result = await gateway.handleWebhook(request)

  const store = new PayloadTransactionStore()
  const txnDoc = await store.findDocByUuid(result.transactionUuid)
  if (!txnDoc) {
    return new Response('Transaction not found', { status: 404 })
  }

  await applyOutcome(txnDoc, result.outcome)

  return new Response(result.acknowledgement.body, { status: result.acknowledgement.status })
}
```

and add the import:

```ts
import { applyOutcome } from './order-transitions'
```

- [ ] **Step 5: Run the tests**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/order-transitions.int.spec.ts tests/int/order-payment-service.int.spec.ts
```

Expected: all PASS. The Comgate webhook tests are the regression check.

- [ ] **Step 6: Commit**

```bash
git add src/payments tests/int/order-transitions.int.spec.ts
git commit -m "refactor(payments): extract the order-state chain into applyOutcome"
```

---

## Task 5: Verify the MuzaPay signing primitives

`signature-builder.ts` and `signer.ts` are already in the repo but have never been executed. Test them before anything depends on them.

**Files:**
- Test: `tests/int/muzapay-signing.int.spec.ts`
- Possibly modify: `src/payments/muzapay/signature-builder.ts`, `src/payments/muzapay/signer.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/muzapay-signing.int.spec.ts`:

```ts
// @vitest-environment node
//
// The signer uses Node's crypto; jsdom's partial crypto shim is not enough.
import { describe, expect, it } from 'vitest'
import { createVerify, generateKeyPairSync } from 'node:crypto'
import { MuzaPaySignatureBuilder } from '@/payments/muzapay/signature-builder'
import { MuzaPaySigner, rawUrlEncode } from '@/payments/muzapay/signer'

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

describe('MuzaPaySignatureBuilder', () => {
  const builder = new MuzaPaySignatureBuilder('|')

  it('joins values in the order given', () => {
    expect(builder.build(['a', 'b', 'c'])).toBe('a|b|c')
  })

  it('trims each value', () => {
    expect(builder.build([' a ', '\tb\n'])).toBe('a|b')
  })

  it('skips null, undefined and empty-after-trim values entirely', () => {
    // Critical: skipped values must not leave an empty delimiter segment.
    expect(builder.build(['a', null, 'b', undefined, '   ', 'c'])).toBe('a|b|c')
  })

  it('returns an empty string when everything is skipped', () => {
    expect(builder.build([null, undefined, '  '])).toBe('')
  })

  it('honours a non-default delimiter', () => {
    expect(new MuzaPaySignatureBuilder(';').build(['a', 'b'])).toBe('a;b')
  })
})

describe('MuzaPaySigner', () => {
  const signer = new MuzaPaySigner(privateKey)

  it('produces a base64 RSA-SHA256 signature the public key verifies', () => {
    const data = 'uuid-1|9900|LEISURE|RB-2026-000001'
    const signature = signer.signToBase64(data)

    const verifier = createVerify('RSA-SHA256')
    verifier.update(data, 'utf8')
    verifier.end()
    expect(verifier.verify(publicKey, signature, 'base64')).toBe(true)
  })

  it('signs UTF-8 bytes, so diacritics verify', () => {
    const data = 'Zážitkový víkend v Českém ráji'
    const signature = signer.signToBase64(data)

    const verifier = createVerify('RSA-SHA256')
    verifier.update(data, 'utf8')
    verifier.end()
    expect(verifier.verify(publicKey, signature, 'base64')).toBe(true)
  })

  it('is deterministic — PKCS#1 v1.5, not PSS', () => {
    // A PSS signature is randomised and would differ between calls; MuzaPay
    // expects PKCS#1 v1.5, so identical input must give identical output.
    expect(signer.signToBase64('same')).toBe(signer.signToBase64('same'))
  })

  it('url-encodes the base64 signature', () => {
    const encoded = signer.signToUrlEncoded('anything')
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')
  })

  it('rejects an unusable key at construction time', () => {
    expect(() => new MuzaPaySigner('not a pem')).toThrow()
    expect(() => new MuzaPaySigner('')).toThrow()
  })
})

describe('rawUrlEncode', () => {
  it('matches PHP rawurlencode for the base64 alphabet', () => {
    expect(rawUrlEncode('a+b/c=')).toBe('a%2Bb%2Fc%3D')
  })

  it('encodes the characters encodeURIComponent leaves alone', () => {
    expect(rawUrlEncode("!*'()")).toBe('%21%2A%27%28%29')
  })

  it('leaves the RFC 3986 unreserved set untouched', () => {
    expect(rawUrlEncode('AZaz09-_.~')).toBe('AZaz09-_.~')
  })
})
```

- [ ] **Step 2: Run the test**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/muzapay-signing.int.spec.ts
```

Expected: the primitives were ported carefully, so these should PASS on the first run. If any fail, fix the source file (not the test) — these assertions restate documented MuzaPay requirements, and getting them wrong means the gateway rejects every request.

- [ ] **Step 3: Commit**

```bash
git add tests/int/muzapay-signing.int.spec.ts src/payments/muzapay
git commit -m "test(payments): cover the MuzaPay signing primitives"
```

---

## Task 6: MuzaPay configuration

**Files:**
- Create: `src/payments/muzapay/config.ts`
- Test: `tests/int/muzapay-config.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/muzapay-config.int.spec.ts`:

```ts
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { muzapayConfigFromEnv, isBenefitPlusConfigured } from '@/payments/muzapay/config'

const KEYS = [
  'MUZAPAY_BASE_URL',
  'MUZAPAY_ESHOP_ID',
  'MUZAPAY_ESHOP_PASSWORD',
  'MUZAPAY_PRIVATE_KEY',
  'MUZAPAY_PRIVATE_KEY_PASSPHRASE',
  'MUZAPAY_PRODUCT_CODE',
  'MUZAPAY_LANGUAGE',
  'MUZAPAY_COUNTRY',
  'MUZAPAY_TOKEN_SCOPE',
] as const

const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
})

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

function setMinimalEnv() {
  process.env.MUZAPAY_BASE_URL = 'https://api.gate.int.pay.muza.cz'
  process.env.MUZAPAY_ESHOP_ID = 'ESHOP1'
  process.env.MUZAPAY_ESHOP_PASSWORD = 'pw'
  // "-----BEGIN..." base64-encoded
  process.env.MUZAPAY_PRIVATE_KEY = Buffer.from('-----BEGIN PRIVATE KEY-----\nx\n').toString(
    'base64',
  )
}

describe('muzapayConfigFromEnv', () => {
  it('throws when credentials are missing', () => {
    expect(() => muzapayConfigFromEnv()).toThrow(/MUZAPAY_/)
  })

  it('decodes the base64 private key and applies defaults', () => {
    setMinimalEnv()
    const config = muzapayConfigFromEnv()
    expect(config.privateKeyPem).toBe('-----BEGIN PRIVATE KEY-----\nx\n')
    expect(config.productCode).toBe('LEISURE')
    expect(config.language).toBe('cs')
    expect(config.country).toBe('CZ')
    expect(config.tokenScope).toBe('SINGLE_PAYMENT')
    expect(config.signatureDelimiter).toBe('|')
    expect(config.privateKeyPassphrase).toBeUndefined()
  })

  it('accepts a raw PEM that was not base64-encoded', () => {
    setMinimalEnv()
    process.env.MUZAPAY_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nraw\n'
    expect(muzapayConfigFromEnv().privateKeyPem).toBe('-----BEGIN PRIVATE KEY-----\nraw\n')
  })

  it('lets the defaults be overridden', () => {
    setMinimalEnv()
    process.env.MUZAPAY_PRODUCT_CODE = 'HEALTHCARE'
    process.env.MUZAPAY_LANGUAGE = 'en'
    expect(muzapayConfigFromEnv().productCode).toBe('HEALTHCARE')
    expect(muzapayConfigFromEnv().language).toBe('en')
  })
})

describe('isBenefitPlusConfigured', () => {
  it('is false with no credentials, and never throws', () => {
    expect(isBenefitPlusConfigured()).toBe(false)
  })

  it('is true once the required variables are set', () => {
    setMinimalEnv()
    expect(isBenefitPlusConfigured()).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/muzapay-config.int.spec.ts
```

Expected: FAIL — cannot resolve `@/payments/muzapay/config`.

- [ ] **Step 3: Write the implementation**

Create `src/payments/muzapay/config.ts`:

```ts
/**
 * Reads MuzaPay (Benefit+) credentials from the environment. Fails fast on
 * missing values, matching `comgateConfigFromEnv()` — a cryptic signature
 * rejection from the gateway is a much worse first symptom than a clear
 * startup error.
 *
 * The private key is expected base64-encoded, because a multi-line PEM
 * survives neither `.env` files nor `vercel env pull` cleanly. A raw PEM is
 * accepted too, so a local developer pasting the file contents still works.
 */

export interface MuzaPayEnvConfig {
  baseUrl: string
  eshopId: string
  eshopPassword: string
  country: string
  tokenScope: string
  privateKeyPem: string
  privateKeyPassphrase?: string
  signatureDelimiter: string
  productCode: string
  language: string
}

const REQUIRED = [
  'MUZAPAY_BASE_URL',
  'MUZAPAY_ESHOP_ID',
  'MUZAPAY_ESHOP_PASSWORD',
  'MUZAPAY_PRIVATE_KEY',
] as const

function decodePrivateKey(raw: string): string {
  if (raw.includes('-----BEGIN')) return raw
  return Buffer.from(raw, 'base64').toString('utf8')
}

export function muzapayConfigFromEnv(): MuzaPayEnvConfig {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `${missing.join(', ')} must be set to accept Benefit+ payments.`,
    )
  }

  return {
    baseUrl: process.env.MUZAPAY_BASE_URL as string,
    eshopId: process.env.MUZAPAY_ESHOP_ID as string,
    eshopPassword: process.env.MUZAPAY_ESHOP_PASSWORD as string,
    country: process.env.MUZAPAY_COUNTRY || 'CZ',
    tokenScope: process.env.MUZAPAY_TOKEN_SCOPE || 'SINGLE_PAYMENT',
    privateKeyPem: decodePrivateKey(process.env.MUZAPAY_PRIVATE_KEY as string),
    privateKeyPassphrase: process.env.MUZAPAY_PRIVATE_KEY_PASSPHRASE || undefined,
    signatureDelimiter: '|',
    productCode: process.env.MUZAPAY_PRODUCT_CODE || 'LEISURE',
    language: process.env.MUZAPAY_LANGUAGE || 'cs',
  }
}

/**
 * Whether Benefit+ can be offered at all. Never throws — the confirmation
 * page calls this to decide whether to render the button, the same
 * defensive fallback pattern as the R2 and Resend configuration.
 */
export function isBenefitPlusConfigured(): boolean {
  return REQUIRED.every((key) => Boolean(process.env[key]))
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/muzapay-config.int.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/payments/muzapay/config.ts tests/int/muzapay-config.int.spec.ts
git commit -m "feat(payments): add MuzaPay environment configuration"
```

---

## Task 7: MuzaPay HTTP client

**Files:**
- Create: `src/payments/muzapay/client.ts`
- Test: `tests/int/muzapay-client.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/muzapay-client.int.spec.ts`:

```ts
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PaymentGatewayError } from '@/payments/gateway'
import { MuzaPayClient } from '@/payments/muzapay/client'

afterEach(() => {
  vi.unstubAllGlobals()
})

const client = new MuzaPayClient('https://api.gate.int.pay.muza.cz')

describe('MuzaPayClient.postJson', () => {
  it('posts JSON against the base URL and parses the response', async () => {
    let capturedUrl = ''
    let capturedInit: RequestInit | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        capturedUrl = String(url)
        capturedInit = init
        return new Response(JSON.stringify({ paymentId: 'P1' }), { status: 200 })
      }),
    )

    const result = await client.postJson('/v2/payments/init?signature=abc', { amount: '9900' }, {
      Authorization: 'Bearer t',
    })

    expect(capturedUrl).toBe('https://api.gate.int.pay.muza.cz/v2/payments/init?signature=abc')
    expect(capturedInit?.method).toBe('POST')
    expect(capturedInit?.body).toBe('{"amount":"9900"}')
    const headers = capturedInit?.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers.Accept).toBe('application/json')
    expect(headers.Authorization).toBe('Bearer t')
    expect(result).toEqual({ paymentId: 'P1' })
  })

  it('throws on an unexpected status code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 400 })))
    await expect(client.postJson('/v2/payments/init', {})).rejects.toThrow(PaymentGatewayError)
  })

  it('throws on an unparseable body', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 200 })))
    await expect(client.postJson('/v2/payments/init', {})).rejects.toThrow(/parse/i)
  })

  it('wraps a transport failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED')
      }),
    )
    await expect(client.postJson('/v2/payments/init', {})).rejects.toThrow(PaymentGatewayError)
  })
})

describe('MuzaPayClient.getJson', () => {
  it('sends a GET with the Accept header and parses the response', async () => {
    let capturedInit: RequestInit | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        capturedInit = init
        return new Response(JSON.stringify({ paymentState: 'PAID' }), { status: 200 })
      }),
    )

    const result = await client.getJson('/v2/payments/P1/state?signature=abc')
    expect(capturedInit?.method).toBe('GET')
    expect(result).toEqual({ paymentState: 'PAID' })
  })
})

describe('MuzaPayClient.put', () => {
  it('accepts the expected 202 and returns nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 202 })))
    await expect(client.put('/v2/payments/P1/cancel?signature=abc', {}, 202)).resolves.toBeUndefined()
  })

  it('throws when the status differs from the expected one', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })))
    await expect(client.put('/v2/payments/P1/cancel', {}, 202)).rejects.toThrow(/202/)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/muzapay-client.int.spec.ts
```

Expected: FAIL — cannot resolve `@/payments/muzapay/client`.

- [ ] **Step 3: Write the implementation**

Create `src/payments/muzapay/client.ts`:

```ts
/**
 * Raw JSON HTTP transport for the MuzaPay REST API. No domain knowledge —
 * takes and returns plain objects. Port of snowbusters
 * `api/app/PaymentsModule/service/MuzaPay/MuzaPayClient.php`.
 */

import { PaymentGatewayError } from '../gateway'

export class MuzaPayClient {
  constructor(private readonly baseUrl: string) {}

  private url(pathWithQuery: string): string {
    if (!this.baseUrl) {
      throw new PaymentGatewayError('MuzaPay baseUrl is not configured.')
    }
    return `${this.baseUrl.replace(/\/+$/, '')}${pathWithQuery}`
  }

  private async send(
    pathWithQuery: string,
    init: RequestInit,
    expectedCode: number,
  ): Promise<Response> {
    let response: Response
    try {
      response = await fetch(this.url(pathWithQuery), init)
    } catch (cause) {
      throw new PaymentGatewayError('MuzaPay request failed.', cause)
    }
    if (response.status !== expectedCode) {
      throw new PaymentGatewayError(
        `Unexpected HTTP ${response.status} from MuzaPay (expected ${expectedCode}).`,
      )
    }
    return response
  }

  private async parse(response: Response): Promise<Record<string, unknown>> {
    let decoded: unknown
    try {
      decoded = await response.json()
    } catch (cause) {
      throw new PaymentGatewayError('Unable to parse MuzaPay JSON response.', cause)
    }
    if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
      throw new PaymentGatewayError('MuzaPay JSON response is not an object.')
    }
    return decoded as Record<string, unknown>
  }

  async postJson(
    pathWithQuery: string,
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
    expectedCode = 200,
  ): Promise<Record<string, unknown>> {
    const response = await this.send(
      pathWithQuery,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
        body: JSON.stringify(body),
      },
      expectedCode,
    )
    return this.parse(response)
  }

  async getJson(
    pathWithQuery: string,
    headers: Record<string, string> = {},
    expectedCode = 200,
  ): Promise<Record<string, unknown>> {
    const response = await this.send(
      pathWithQuery,
      { method: 'GET', headers: { Accept: 'application/json', ...headers } },
      expectedCode,
    )
    return this.parse(response)
  }

  async put(
    pathWithQuery: string,
    headers: Record<string, string> = {},
    expectedCode = 202,
  ): Promise<void> {
    await this.send(pathWithQuery, { method: 'PUT', headers }, expectedCode)
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/muzapay-client.int.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/payments/muzapay/client.ts tests/int/muzapay-client.int.spec.ts
git commit -m "feat(payments): add the MuzaPay HTTP client"
```

---

## Task 8: `MuzaPayGateway.begin()`

**Files:**
- Create: `src/payments/muzapay/gateway.ts`
- Test: `tests/int/muzapay-gateway.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/muzapay-gateway.int.spec.ts`:

```ts
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import { PaymentGatewayError, type Transaction, type TransactionStore } from '@/payments/gateway'
import { MuzaPayGateway } from '@/payments/muzapay/gateway'

afterEach(() => {
  vi.unstubAllGlobals()
})

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: '1',
    uuid: 'uuid-benefit-1',
    money: { amount: '2490.00', amountWithoutVat: '2057.85', currency: 'CZK' },
    label: 'Vysoké Tatry — zimní přechod',
    orderReference: 'RB-2026-000123',
    email: 'payer@x.test',
    state: 'created',
    paymentMethod: 'muzapay',
    payload: {},
    callbackPayload: null,
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
    ...overrides,
  }
}

function makeStore(transactions: Transaction[]): TransactionStore {
  return {
    async findByUuid(uuid) {
      return transactions.find((t) => t.uuid === uuid) ?? null
    },
    async findByGatewayTransactionId(id) {
      return transactions.find((t) => t.payload.gatewayTransactionId === id) ?? null
    },
  }
}

function makeGateway(store: TransactionStore = makeStore([])) {
  return new MuzaPayGateway({
    baseUrl: 'https://api.gate.int.pay.muza.cz',
    eshopId: 'ESHOP1',
    eshopPassword: 'pw',
    country: 'CZ',
    tokenScope: 'SINGLE_PAYMENT',
    privateKeyPem: privateKey,
    signatureDelimiter: '|',
    productCode: 'LEISURE',
    language: 'cs',
    backendBaseUrl: 'https://beta.rockbusters.net',
    store,
  })
}

/**
 * Stubs the auth call, then returns each subsequent response in order.
 * Every MuzaPay call is preceded by a token fetch on a fresh gateway.
 */
function stubMuzaPay(...responses: Response[]) {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const queue = [...responses]
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), init })
      if (String(url).includes('/v2/auth/token')) {
        return new Response(
          JSON.stringify({
            accessToken: 'tok-1',
            validTo: new Date(Date.now() + 600_000).toISOString(),
          }),
          { status: 200 },
        )
      }
      const next = queue.shift()
      if (!next) throw new Error(`Unexpected call to ${url}`)
      return next
    }),
  )
  return calls
}

describe('MuzaPayGateway.begin', () => {
  it('signs and posts the init request, returning the gateway URL', async () => {
    const calls = stubMuzaPay(
      new Response(
        JSON.stringify({
          paymentId: 'PAY-1',
          gatewayUrl: 'https://gate.pay.muza.cz/p/PAY-1',
          currency: 'CZK',
          beneficiaryId: 'BEN-1',
        }),
        { status: 200 },
      ),
    )

    const gateway = makeGateway()
    const result = await gateway.begin(makeTransaction())

    expect(result.redirectUrl).toBe('https://gate.pay.muza.cz/p/PAY-1')
    expect(result.gatewayTransactionId).toBe('PAY-1')

    const init = calls.find((c) => c.url.includes('/v2/payments/init'))
    expect(init).toBeDefined()
    expect(init?.url).toMatch(/\/v2\/payments\/init\?signature=/)

    const headers = init?.init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok-1')
    expect(headers['x-correlation-id']).toBe('uuid-benefit-1')

    // Field order is signature-critical: the body must serialise in exactly
    // this order, because the signature is built over these values in order.
    expect(init?.init.body).toBe(
      JSON.stringify({
        amount: '249000',
        productCode: 'LEISURE',
        orderReferenceCode: 'RB-2026-000123',
        orderDescription: 'Vysoké Tatry — zimní přechod',
        merchantData: Buffer.from('uuid-benefit-1').toString('base64'),
        returnUrl:
          'https://beta.rockbusters.net/api/payments/muzapay/return?refId=uuid-benefit-1',
        language: 'cs',
      }),
    )
  })

  it('persists the init response on the payload', async () => {
    stubMuzaPay(
      new Response(
        JSON.stringify({
          paymentId: 'PAY-2',
          gatewayUrl: 'https://gate.pay.muza.cz/p/PAY-2',
          currency: 'CZK',
          beneficiaryId: 'BEN-2',
        }),
        { status: 200 },
      ),
    )
    const result = await makeGateway().begin(makeTransaction())
    expect(result.payload).toMatchObject({
      gatewayTransactionId: 'PAY-2',
      redirectUrl: 'https://gate.pay.muza.cz/p/PAY-2',
      beneficiaryId: 'BEN-2',
      orderReferenceCode: 'RB-2026-000123',
    })
  })

  it('refuses a transaction that has already begun', async () => {
    stubMuzaPay()
    await expect(
      makeGateway().begin(makeTransaction({ state: 'begun' })),
    ).rejects.toThrow(PaymentGatewayError)
  })

  it('refuses a transaction with no order reference', async () => {
    stubMuzaPay()
    await expect(
      makeGateway().begin(makeTransaction({ orderReference: undefined })),
    ).rejects.toThrow(/order reference/i)
  })

  it('throws when the init response is missing required fields', async () => {
    stubMuzaPay(new Response(JSON.stringify({ paymentId: 'PAY-3' }), { status: 200 }))
    await expect(makeGateway().begin(makeTransaction())).rejects.toThrow(/missing/i)
  })

  it('truncates an over-long description to 255 characters', async () => {
    const calls = stubMuzaPay(
      new Response(
        JSON.stringify({ paymentId: 'P', gatewayUrl: 'https://x', currency: 'CZK' }),
        { status: 200 },
      ),
    )
    await makeGateway().begin(makeTransaction({ label: 'x'.repeat(300) }))
    const init = calls.find((c) => c.url.includes('/v2/payments/init'))
    const body = JSON.parse(String(init?.init.body)) as { orderDescription: string }
    expect(body.orderDescription).toHaveLength(255)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/muzapay-gateway.int.spec.ts
```

Expected: FAIL — cannot resolve `@/payments/muzapay/gateway`.

- [ ] **Step 3: Write the implementation**

Create `src/payments/muzapay/gateway.ts` (this task adds `begin`; `checkStatus` and `cancel` land in the next two tasks, so they throw a not-yet-implemented error for now):

```ts
/**
 * TypeScript port of snowbusters
 * api/app/PaymentsModule/service/MuzaPayGateway.php — the Benefit+ gateway.
 *
 * Unlike Comgate, MuzaPay sends NO webhook. The payment result is read from
 * its status endpoint, once when the payer returns and again from the cron
 * sweep. See docs/superpowers/specs/2026-09-02-benefit-plus-gateway-design.md.
 */

import {
  PaymentGatewayError,
  type BeginResult,
  type PaymentGateway,
  type PaymentOutcome,
  type Transaction,
  type TransactionStore,
  type WebhookResult,
} from '../gateway'
import { toMinorUnits } from '../money'
import { MuzaPayClient } from './client'
import { MuzaPaySignatureBuilder } from './signature-builder'
import { MuzaPaySigner } from './signer'
import { MuzaPayTokenProvider } from './token-provider'

const ORDER_DESCRIPTION_MAX_LENGTH = 255

export interface MuzaPayGatewayConfig {
  baseUrl: string
  eshopId: string
  eshopPassword: string
  country: string
  tokenScope: string
  privateKeyPem: string
  privateKeyPassphrase?: string
  signatureDelimiter: string
  productCode: string
  language: string
  /** Public base URL of this Next.js app, for building the return URL. */
  backendBaseUrl: string
  store: TransactionStore
}

export class MuzaPayGateway implements PaymentGateway {
  private readonly client: MuzaPayClient
  private readonly signer: MuzaPaySigner
  private readonly signatureBuilder: MuzaPaySignatureBuilder
  private readonly tokenProvider: MuzaPayTokenProvider

  constructor(private readonly config: MuzaPayGatewayConfig) {
    this.client = new MuzaPayClient(config.baseUrl)
    this.signer = new MuzaPaySigner(config.privateKeyPem, config.privateKeyPassphrase)
    this.signatureBuilder = new MuzaPaySignatureBuilder(config.signatureDelimiter)
    this.tokenProvider = new MuzaPayTokenProvider({
      baseUrl: config.baseUrl,
      eshopId: config.eshopId,
      eshopPassword: config.eshopPassword,
      country: config.country,
      tokenScope: config.tokenScope,
    })
  }

  async begin(transaction: Transaction): Promise<BeginResult> {
    if (transaction.state !== 'created') {
      throw new PaymentGatewayError('Cannot begin the transaction at this point.')
    }
    if (!transaction.orderReference) {
      throw new PaymentGatewayError('MuzaPay requires an order reference on the transaction.')
    }

    const token = await this.tokenProvider.getToken()
    const correlationId = transaction.uuid
    const base = this.config.backendBaseUrl.replace(/\/+$/, '')

    // Field order is signature-critical — the signature is built over these
    // values in exactly this order. Do not reorder, and do not let a
    // formatter or a spread reorder them either.
    const initRequest = {
      amount: String(toMinorUnits(transaction.money.amount)),
      productCode: this.config.productCode,
      orderReferenceCode: transaction.orderReference,
      orderDescription: transaction.label.slice(0, ORDER_DESCRIPTION_MAX_LENGTH),
      merchantData: Buffer.from(transaction.uuid, 'utf8').toString('base64'),
      returnUrl: `${base}/api/payments/muzapay/return?refId=${transaction.uuid}`,
      language: this.config.language,
    }

    const signature = this.signer.signToUrlEncoded(
      this.signatureBuilder.build([correlationId, ...Object.values(initRequest)]),
    )

    const response = await this.client.postJson(
      `/v2/payments/init?signature=${signature}`,
      initRequest,
      {
        Authorization: `Bearer ${token.accessToken}`,
        'x-correlation-id': correlationId,
      },
      200,
    )

    const paymentId = response.paymentId
    const gatewayUrl = response.gatewayUrl
    if (typeof paymentId !== 'string' || typeof gatewayUrl !== 'string') {
      throw new PaymentGatewayError('MuzaPay init response is missing paymentId/gatewayUrl.')
    }

    return {
      redirectUrl: gatewayUrl,
      gatewayTransactionId: paymentId,
      payload: {
        ...initRequest,
        gatewayTransactionId: paymentId,
        redirectUrl: gatewayUrl,
        currency: response.currency,
        beneficiaryId: response.beneficiaryId,
        initResponse: response,
      },
    }
  }

  /**
   * Benefit+ sends no server-to-server callback — the PHP original throws
   * here too. No webhook route exists for this gateway.
   */
  async handleWebhook(_request: Request): Promise<WebhookResult> {
    throw new PaymentGatewayError(
      'Benefit+ does not send webhooks — resolve the payment via checkStatus.',
    )
  }

  async handleReturn(transaction: Transaction): Promise<PaymentOutcome | null> {
    return this.checkStatus(transaction)
  }

  async checkStatus(_transaction: Transaction): Promise<PaymentOutcome | null> {
    throw new PaymentGatewayError('MuzaPayGateway.checkStatus is not implemented yet.')
  }

  async cancel(_transaction: Transaction): Promise<void> {
    throw new PaymentGatewayError('MuzaPayGateway.cancel is not implemented yet.')
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/muzapay-gateway.int.spec.ts
```

Expected: PASS — all six `begin` tests.

- [ ] **Step 5: Commit**

```bash
git add src/payments/muzapay/gateway.ts tests/int/muzapay-gateway.int.spec.ts
git commit -m "feat(payments): implement MuzaPayGateway.begin"
```

---

## Task 9: `MuzaPayGateway.checkStatus()` and the state mapping

**Files:**
- Modify: `src/payments/muzapay/gateway.ts`
- Test: `tests/int/muzapay-gateway.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/int/muzapay-gateway.int.spec.ts` (it reuses `makeTransaction`, `makeGateway` and `stubMuzaPay` defined at the top of that file):

```ts
describe('MuzaPayGateway.checkStatus', () => {
  function begunTransaction() {
    return makeTransaction({
      state: 'begun',
      payload: { gatewayTransactionId: 'PAY-1' },
    })
  }

  it('signs the payment id and queries the state endpoint', async () => {
    const calls = stubMuzaPay(
      new Response(JSON.stringify({ paymentState: 'PAID' }), { status: 200 }),
    )
    const outcome = await makeGateway().checkStatus(begunTransaction())

    const state = calls.find((c) => c.url.includes('/state'))
    expect(state?.url).toMatch(/\/v2\/payments\/PAY-1\/state\?signature=/)
    expect((state?.init.headers as Record<string, string>).Authorization).toBe('Bearer tok-1')
    expect(outcome).toEqual({ state: 'paid', callbackPayload: { paymentState: 'PAID' } })
  })

  it.each([
    ['PAID', 'paid'],
    ['CANCELED', 'cancelled'],
    ['DECLINED', 'failed'],
    ['EXPIRED', 'failed'],
  ])('maps %s to %s', async (paymentState, expected) => {
    stubMuzaPay(new Response(JSON.stringify({ paymentState }), { status: 200 }))
    const outcome = await makeGateway().checkStatus(begunTransaction())
    expect(outcome?.state).toBe(expected)
  })

  it.each(['IN_PROGRESS_UNPAID', 'PENDING_INFO', 'SOMETHING_NEW', ''])(
    'returns null for the non-terminal state %s',
    async (paymentState) => {
      stubMuzaPay(new Response(JSON.stringify({ paymentState }), { status: 200 }))
      expect(await makeGateway().checkStatus(begunTransaction())).toBeNull()
    },
  )

  it('accepts a lower-case state', async () => {
    stubMuzaPay(new Response(JSON.stringify({ paymentState: 'paid' }), { status: 200 }))
    expect((await makeGateway().checkStatus(begunTransaction()))?.state).toBe('paid')
  })

  it('returns null without calling the gateway when the transaction has not begun', async () => {
    const calls = stubMuzaPay()
    expect(await makeGateway().checkStatus(makeTransaction({ state: 'created' }))).toBeNull()
    expect(calls).toHaveLength(0)
  })

  it('throws when the transaction has no gateway payment id', async () => {
    stubMuzaPay()
    await expect(
      makeGateway().checkStatus(makeTransaction({ state: 'begun', payload: {} })),
    ).rejects.toThrow(/payment id/i)
  })
})

describe('MuzaPayGateway.handleWebhook', () => {
  it('refuses — Benefit+ has no webhook', async () => {
    await expect(
      makeGateway().handleWebhook(new Request('https://x/api/payments/muzapay/webhook')),
    ).rejects.toThrow(/does not send webhooks/i)
  })
})

describe('MuzaPayGateway.handleReturn', () => {
  it('delegates to checkStatus rather than trusting the redirect', async () => {
    stubMuzaPay(new Response(JSON.stringify({ paymentState: 'PAID' }), { status: 200 }))
    const outcome = await makeGateway().handleReturn(
      makeTransaction({ state: 'begun', payload: { gatewayTransactionId: 'PAY-1' } }),
    )
    expect(outcome?.state).toBe('paid')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/muzapay-gateway.int.spec.ts
```

Expected: FAIL with "MuzaPayGateway.checkStatus is not implemented yet."

- [ ] **Step 3: Write the implementation**

In `src/payments/muzapay/gateway.ts`, add the mapping helper above the class:

```ts
/**
 * MuzaPay's payment states. Note `CANCELED` — a single L, unlike our
 * `cancelled`. Anything unrecognised maps to null, i.e. "still pending",
 * which is the safe direction: a payment is never wrongly marked terminal.
 */
function mapPaymentState(paymentState: string): PaymentOutcome['state'] | null {
  switch (paymentState.toUpperCase()) {
    case 'PAID':
      return 'paid'
    case 'CANCELED':
      return 'cancelled'
    case 'DECLINED':
    case 'EXPIRED':
      return 'failed'
    default:
      return null
  }
}
```

then add a private helper and replace the `checkStatus` stub:

```ts
  private paymentId(transaction: Transaction): string {
    const id = transaction.payload.gatewayTransactionId
    if (typeof id !== 'string' || id === '') {
      throw new PaymentGatewayError('Transaction has no MuzaPay payment id.')
    }
    return id
  }

  private signedPath(paymentId: string, suffix: string): string {
    const signature = this.signer.signToUrlEncoded(this.signatureBuilder.build([paymentId]))
    return `/v2/payments/${encodeURIComponent(paymentId)}/${suffix}?signature=${signature}`
  }

  async checkStatus(transaction: Transaction): Promise<PaymentOutcome | null> {
    if (transaction.state !== 'begun') return null

    const paymentId = this.paymentId(transaction)
    const token = await this.tokenProvider.getToken()
    const response = await this.client.getJson(
      this.signedPath(paymentId, 'state'),
      { Authorization: `Bearer ${token.accessToken}` },
      200,
    )

    const paymentState = response.paymentState
    if (typeof paymentState !== 'string') return null

    const state = mapPaymentState(paymentState)
    if (state === null) return null

    return { state, callbackPayload: response }
  }
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/muzapay-gateway.int.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/payments/muzapay/gateway.ts tests/int/muzapay-gateway.int.spec.ts
git commit -m "feat(payments): implement MuzaPayGateway.checkStatus"
```

---

## Task 10: `MuzaPayGateway.cancel()`

**Files:**
- Modify: `src/payments/muzapay/gateway.ts`
- Test: `tests/int/muzapay-gateway.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/int/muzapay-gateway.int.spec.ts`:

```ts
describe('MuzaPayGateway.cancel', () => {
  function begunTransaction() {
    return makeTransaction({ state: 'begun', payload: { gatewayTransactionId: 'PAY-1' } })
  }

  it('submits the cancel and reports the confirmed outcome', async () => {
    const calls = stubMuzaPay(
      new Response('', { status: 202 }),
      new Response(JSON.stringify({ paymentState: 'CANCELED' }), { status: 200 }),
    )

    const outcome = await makeGateway().cancel(begunTransaction())

    const cancel = calls.find((c) => c.url.includes('/cancel'))
    expect(cancel?.init.method).toBe('PUT')
    expect(cancel?.url).toMatch(/\/v2\/payments\/PAY-1\/cancel\?signature=/)
    expect(outcome).toEqual({ state: 'cancelled', callbackPayload: { paymentState: 'CANCELED' } })
  })

  it('returns null when the payment did not actually cancel', async () => {
    stubMuzaPay(
      new Response('', { status: 202 }),
      new Response(JSON.stringify({ paymentState: 'IN_PROGRESS_UNPAID' }), { status: 200 }),
    )
    expect(await makeGateway().cancel(begunTransaction())).toBeNull()
  })

  it('reports a payment that turned out to be paid rather than cancelling it', async () => {
    // A race: the payer completed while the sweep decided the payment was stale.
    stubMuzaPay(
      new Response('', { status: 202 }),
      new Response(JSON.stringify({ paymentState: 'PAID' }), { status: 200 }),
    )
    expect((await makeGateway().cancel(begunTransaction()))?.state).toBe('paid')
  })

  it('refuses a transaction that has not begun', async () => {
    stubMuzaPay()
    await expect(makeGateway().cancel(makeTransaction({ state: 'created' }))).rejects.toThrow(
      PaymentGatewayError,
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/muzapay-gateway.int.spec.ts
```

Expected: FAIL with "MuzaPayGateway.cancel is not implemented yet."

- [ ] **Step 3: Widen the contract and implement**

`PaymentGateway.cancel` currently returns `Promise<void>`, but the sweep needs to know what the cancel produced. In `src/payments/gateway.ts` change the contract:

```ts
  /**
   * Cancel/reverse a previously initiated payment. Returns the resolved
   * outcome when the provider confirms one, or null if the payment is still
   * in flight — cancellation may be asynchronous.
   * PHP: `cancel(Transaction): void`.
   */
  cancel(transaction: Transaction): Promise<PaymentOutcome | null>;
```

In `src/payments/comgate/gateway.ts` update the stub's signature to match:

```ts
  async cancel(_transaction: Transaction): Promise<PaymentOutcome | null> {
    throw new PaymentGatewayError(
      'ComgateGateway.cancel is not implemented (deferred — see docs/superpowers/plans/2026-08-28-comgate-payment-gateway.md).',
    )
  }
```

In `src/payments/muzapay/gateway.ts` replace the `cancel` stub:

```ts
  /**
   * Asks MuzaPay to cancel an in-flight payment, then re-reads the state to
   * see what actually happened — the cancel itself is asynchronous (202), so
   * its acceptance proves nothing. Benefit+ documents at most three attempts
   * at progressive intervals; that spacing comes from the cron sweep calling
   * this once per pass, not from a loop in here.
   */
  async cancel(transaction: Transaction): Promise<PaymentOutcome | null> {
    if (transaction.state !== 'begun') {
      throw new PaymentGatewayError('Cannot cancel the transaction at this point.')
    }

    const paymentId = this.paymentId(transaction)
    const token = await this.tokenProvider.getToken()
    const authorization = { Authorization: `Bearer ${token.accessToken}` }

    await this.client.put(this.signedPath(paymentId, 'cancel'), authorization, 202)

    const response = await this.client.getJson(
      this.signedPath(paymentId, 'state'),
      authorization,
      200,
    )
    const paymentState = response.paymentState
    if (typeof paymentState !== 'string') return null

    const state = mapPaymentState(paymentState)
    if (state === null) return null

    return { state, callbackPayload: response }
  }
```

- [ ] **Step 4: Run the tests and typecheck**

```bash
pnpm exec tsc --noEmit && pnpm exec vitest run --config ./vitest.config.mts tests/int/muzapay-gateway.int.spec.ts tests/int/comgate-gateway.int.spec.ts
```

Expected: no type errors, all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/payments tests/int/muzapay-gateway.int.spec.ts
git commit -m "feat(payments): implement MuzaPayGateway.cancel"
```

---

## Task 11: `beginBenefitPlusPayment`

**Files:**
- Modify: `src/payments/order-payment-service.ts`
- Test: `tests/int/benefit-plus-payment-service.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/benefit-plus-payment-service.int.spec.ts`:

```ts
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import { getTestPayload } from '../helpers/payload'
import { beginBenefitPlusPayment } from '@/payments/order-payment-service'

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

process.env.MUZAPAY_BASE_URL = 'https://api.gate.int.pay.muza.cz'
process.env.MUZAPAY_ESHOP_ID = 'ESHOP1'
process.env.MUZAPAY_ESHOP_PASSWORD = 'pw'
process.env.MUZAPAY_PRIVATE_KEY = Buffer.from(privateKey).toString('base64')
process.env.NEXT_PUBLIC_SITE_URL = 'https://beta.rockbusters.net'

afterEach(() => {
  vi.unstubAllGlobals()
})

const billing = {
  firstName: 'A',
  lastName: 'B',
  street: 'Main 1',
  city: 'Prague',
  postalCode: '11000',
  country: 'CZ',
}

async function seedOrder({ priceCzk }: { priceCzk: number | null }) {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: { title: `Benefit ${unique}`, slug: `benefit-${unique}`, state: 'published' } as never,
    overrideAccess: true,
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-05-01T00:00:00.000Z',
      dateTo: '2027-05-05T00:00:00.000Z',
      price: 100,
      priceCzk: priceCzk ?? undefined,
      vat: 21,
      currency: 'EUR',
      capacity: 10,
      active: true,
    } as never,
    overrideAccess: true,
  })
  const user = await payload.create({
    collection: 'users',
    data: {
      name: 'Benefit Payer',
      phone: '+420 600 000 050',
      email: `benefit-${unique}@x.test`,
      password: 'benefit-test-pwd',
      role: 'customer',
      _verified: true,
    } as never,
    overrideAccess: true,
  })
  const order = await payload.create({
    collection: 'orders',
    data: {
      user: user.id,
      eventDate: ed.id,
      participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
      billingAddress: billing,
      unitPrice: 100,
      unitPriceCzk: priceCzk ?? null,
      vat: 21,
      currency: 'EUR',
      state: 'pending',
    } as never,
    overrideAccess: true,
  })
  return { user, order, eventTitle: `Benefit ${unique}` }
}

function stubInit() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).includes('/v2/auth/token')) {
        return new Response(
          JSON.stringify({
            accessToken: 'tok-1',
            validTo: new Date(Date.now() + 600_000).toISOString(),
          }),
          { status: 200 },
        )
      }
      return new Response(
        JSON.stringify({
          paymentId: 'PAY-SVC-1',
          gatewayUrl: 'https://gate.pay.muza.cz/p/PAY-SVC-1',
          currency: 'CZK',
          beneficiaryId: 'BEN-1',
        }),
        { status: 200 },
      )
    }),
  )
}

describe('beginBenefitPlusPayment', () => {
  it('creates a CZK transaction and returns the gateway URL', async () => {
    const payload = await getTestPayload()
    const { user, order, eventTitle } = await seedOrder({ priceCzk: 2490 })
    stubInit()

    const { redirectUrl } = await beginBenefitPlusPayment(order.id, {
      id: user.id,
      email: user.email,
    })
    expect(redirectUrl).toBe('https://gate.pay.muza.cz/p/PAY-SVC-1')

    const { docs } = await payload.find({
      collection: 'transactions',
      where: { order: { equals: order.id } },
      overrideAccess: true,
    })
    expect(docs).toHaveLength(1)
    expect(docs[0].state).toBe('begun')
    expect(docs[0].paymentMethod).toBe('muzapay')
    expect(docs[0].currency).toBe('CZK')
    expect(docs[0].amount).toBe(2490)
    // 2490 / 1.21 = 2057.851... rounded to 2dp before persisting.
    expect(docs[0].amountWithoutVat).toBe(2057.85)
    // The label is what the payer sees on the gateway.
    expect(docs[0].label).toBe(eventTitle)
    expect(docs[0].orderReference).toBe(order.orderNumber)

    const refreshed = await payload.findByID({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
    })
    expect(refreshed.state).toBe('pending') // begin() never touches order state
  })

  it('refuses when the trip has no CZK price', async () => {
    const { user, order } = await seedOrder({ priceCzk: null })
    stubInit()
    await expect(
      beginBenefitPlusPayment(order.id, { id: user.id, email: user.email }),
    ).rejects.toThrow(/Benefit\+/i)
  })

  it("refuses someone else's order", async () => {
    const { order } = await seedOrder({ priceCzk: 2490 })
    stubInit()
    await expect(
      beginBenefitPlusPayment(order.id, { id: 999_999, email: 'attacker@x.test' }),
    ).rejects.toThrow()
  })

  it('refuses an order that is already paid', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder({ priceCzk: 2490 })
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { state: 'confirmed' },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { state: 'paid' },
      overrideAccess: true,
    })
    stubInit()
    await expect(
      beginBenefitPlusPayment(order.id, { id: user.id, email: user.email }),
    ).rejects.toThrow(/cannot be paid/i)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/benefit-plus-payment-service.int.spec.ts
```

Expected: FAIL — `beginBenefitPlusPayment` is not exported.

- [ ] **Step 3: Write the implementation**

In `src/payments/order-payment-service.ts`, add the imports:

```ts
import { MuzaPayGateway } from './muzapay/gateway'
import { muzapayConfigFromEnv } from './muzapay/config'
```

add the gateway factory next to `comgateGateway()`:

```ts
function benefitPlusGateway() {
  return new MuzaPayGateway({
    ...muzapayConfigFromEnv(),
    backendBaseUrl: siteUrl(),
    store: new PayloadTransactionStore(),
  })
}
```

and add the function:

```ts
/**
 * Starts a Benefit+ (MuzaPay) payment for `orderId`. The order stays in EUR;
 * the transaction is created in CZK at the price snapshotted on the order,
 * because MuzaPay settles only in CZK. Does not change the order's state —
 * that happens once the status check confirms the outcome.
 */
export async function beginBenefitPlusPayment(
  orderId: number | string,
  user: { id: number; email: string },
): Promise<{ redirectUrl: string }> {
  const cms = await getPayloadClient()
  // depth 2, not 1: the label comes from order.eventDate.event.title, and
  // depth 1 would leave `event` as a bare id.
  const order = (await cms.findByID({
    collection: 'orders',
    id: orderId,
    depth: 2,
    overrideAccess: true,
  })) as OrderDoc & { eventDate?: { event?: { title?: string } | number } | number }

  const ownerId = typeof order.user === 'object' ? order.user.id : order.user
  if (ownerId !== user.id) {
    throw new Error('This order does not belong to you.')
  }
  if (order.state !== 'pending' && order.state !== 'confirmed') {
    throw new Error('This order cannot be paid online.')
  }
  if (order.totalPriceCzk === null || order.totalPriceCzk === undefined) {
    throw new Error('Benefit+ is not available for this trip.')
  }

  // The label is what the payer sees on the Benefit+ gateway, so it should
  // name the trip rather than repeat the order number.
  const eventDate = order.eventDate
  const event =
    typeof eventDate === 'object' && eventDate !== null ? eventDate.event : undefined
  const eventTitle =
    typeof event === 'object' && event !== null && typeof event.title === 'string'
      ? event.title
      : `Rockbusters ${order.orderNumber}`

  // Rounded to 2dp before persisting — a stored financial field must not carry
  // raw floating-point noise.
  const amountWithoutVat = Math.round((order.totalPriceCzk / (1 + order.vat / 100)) * 100) / 100

  const txnDoc = (await cms.create({
    collection: 'transactions',
    data: {
      uuid: randomUUID(),
      order: order.id,
      amount: order.totalPriceCzk,
      amountWithoutVat,
      currency: 'CZK',
      label: eventTitle,
      orderReference: order.orderNumber,
      email: user.email,
      state: 'created',
      paymentMethod: 'muzapay',
    },
    overrideAccess: true,
  })) as TransactionDoc

  const gateway = benefitPlusGateway()
  const result = await gateway.begin(toGatewayTransaction(txnDoc))

  await cms.update({
    collection: 'transactions',
    id: txnDoc.id,
    data: { state: 'begun', payload: result.payload },
    overrideAccess: true,
  })

  return { redirectUrl: result.redirectUrl }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/benefit-plus-payment-service.int.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/payments/order-payment-service.ts tests/int/benefit-plus-payment-service.int.spec.ts
git commit -m "feat(payments): start Benefit+ payments from an order"
```

---

## Task 12: Resolve on return + the return route

**Files:**
- Modify: `src/payments/order-payment-service.ts`
- Create: `src/app/api/payments/muzapay/return/route.ts`
- Test: `tests/int/benefit-plus-payment-service.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/int/benefit-plus-payment-service.int.spec.ts` — add `resolveBenefitPlusPayment` to the import at the top of the file first:

```ts
import {
  beginBenefitPlusPayment,
  resolveBenefitPlusPayment,
} from '@/payments/order-payment-service'
```

then append:

```ts
function stubState(paymentState: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).includes('/v2/auth/token')) {
        return new Response(
          JSON.stringify({
            accessToken: 'tok-1',
            validTo: new Date(Date.now() + 600_000).toISOString(),
          }),
          { status: 200 },
        )
      }
      return new Response(JSON.stringify({ paymentState }), { status: 200 })
    }),
  )
}

async function begunTransactionUuid(orderId: number, user: { id: number; email: string }) {
  stubInit()
  await beginBenefitPlusPayment(orderId, user)
  const payload = await getTestPayload()
  const { docs } = await payload.find({
    collection: 'transactions',
    where: { order: { equals: orderId } },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
  })
  return docs[0].uuid as string
}

describe('resolveBenefitPlusPayment', () => {
  it('marks the order paid when the gateway reports PAID', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder({ priceCzk: 2490 })
    const uuid = await begunTransactionUuid(order.id, { id: user.id, email: user.email })

    stubState('PAID')
    await resolveBenefitPlusPayment(uuid)

    const refreshed = await payload.findByID({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
    })
    expect(refreshed.state).toBe('paid')
  })

  it('leaves the order pending while the payment is in progress', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder({ priceCzk: 2490 })
    const uuid = await begunTransactionUuid(order.id, { id: user.id, email: user.email })

    stubState('IN_PROGRESS_UNPAID')
    await resolveBenefitPlusPayment(uuid)

    const refreshed = await payload.findByID({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
    })
    expect(refreshed.state).toBe('pending')
  })

  it('leaves the order payable after a decline', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder({ priceCzk: 2490 })
    const uuid = await begunTransactionUuid(order.id, { id: user.id, email: user.email })

    stubState('DECLINED')
    await resolveBenefitPlusPayment(uuid)

    const refreshed = await payload.findByID({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
    })
    expect(refreshed.state).toBe('pending')
    const { docs } = await payload.find({
      collection: 'transactions',
      where: { uuid: { equals: uuid } },
      overrideAccess: true,
    })
    expect(docs[0].state).toBe('failed')
  })

  it('is a no-op for an unknown uuid', async () => {
    stubState('PAID')
    await expect(resolveBenefitPlusPayment('no-such-uuid')).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/benefit-plus-payment-service.int.spec.ts
```

Expected: FAIL — `resolveBenefitPlusPayment` is not exported.

- [ ] **Step 3: Write the implementation**

In `src/payments/order-payment-service.ts`:

```ts
/**
 * Reads the current Benefit+ payment state and applies it. Safe to call more
 * than once and from more than one place — the return URL and the cron sweep
 * both do — because `applyOutcome` short-circuits an already-applied result.
 */
export async function resolveBenefitPlusPayment(uuid: string): Promise<void> {
  const store = new PayloadTransactionStore()
  const txnDoc = await store.findDocByUuid(uuid)
  if (!txnDoc || txnDoc.state !== 'begun') return

  const gateway = benefitPlusGateway()
  const outcome = await gateway.checkStatus(toGatewayTransaction(txnDoc))
  if (!outcome) return

  await applyOutcome(txnDoc, outcome)
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/benefit-plus-payment-service.int.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Add the return route**

Create `src/app/api/payments/muzapay/return/route.ts`:

```ts
/**
 * Where the payer's browser lands after the Benefit+ gateway. Benefit+ sends
 * no webhook, so this is the first chance to learn the result — but the
 * redirect itself proves nothing, so the state is read from the gateway.
 *
 * This route never shows the payer an error: if the status check fails, the
 * cron sweep will resolve the payment shortly, and the order page they land
 * on shows the current truth either way.
 */

import { getPayloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/url'
import { resolveBenefitPlusPayment } from '@/payments/order-payment-service'

export async function GET(request: Request): Promise<Response> {
  const refId = new URL(request.url).searchParams.get('refId')
  if (!refId) {
    return Response.redirect(siteUrl('/'), 302)
  }

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'transactions',
    where: { uuid: { equals: refId } },
    limit: 1,
    overrideAccess: true,
  })
  const txn = docs[0] as { order: number | { id: number } } | undefined
  if (!txn) {
    return Response.redirect(siteUrl('/'), 302)
  }

  try {
    await resolveBenefitPlusPayment(refId)
  } catch (err) {
    console.error('[muzapay/return] status check failed; leaving it to the sweep:', err)
  }

  const orderId = typeof txn.order === 'object' ? txn.order.id : txn.order
  return Response.redirect(siteUrl(`/account/orders/${orderId}`), 302)
}
```

- [ ] **Step 6: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/payments/order-payment-service.ts src/app/api/payments/muzapay tests/int/benefit-plus-payment-service.int.spec.ts
git commit -m "feat(payments): resolve Benefit+ payments on return"
```

---

## Task 13: The reconcile sweep and its cron

**Files:**
- Modify: `src/payments/order-payment-service.ts`
- Create: `src/app/api/payments/muzapay/reconcile/route.ts`
- Modify: `vercel.json`
- Test: `tests/int/benefit-plus-sweep.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/int/benefit-plus-sweep.int.spec.ts`:

```ts
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync, randomUUID } from 'node:crypto'
import { getTestPayload } from '../helpers/payload'
import { sweepBenefitPlusPayments } from '@/payments/order-payment-service'

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

process.env.MUZAPAY_BASE_URL = 'https://api.gate.int.pay.muza.cz'
process.env.MUZAPAY_ESHOP_ID = 'ESHOP1'
process.env.MUZAPAY_ESHOP_PASSWORD = 'pw'
process.env.MUZAPAY_PRIVATE_KEY = Buffer.from(privateKey).toString('base64')
process.env.NEXT_PUBLIC_SITE_URL = 'https://beta.rockbusters.net'

afterEach(() => {
  vi.unstubAllGlobals()
})

const billing = {
  firstName: 'A',
  lastName: 'B',
  street: 'Main 1',
  city: 'Prague',
  postalCode: '11000',
  country: 'CZ',
}

/** Seeds an order plus a `begun` muzapay transaction, bypassing the gateway. */
async function seedBegunTransaction(paymentId: string) {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: { title: `Sweep ${unique}`, slug: `sweep-${unique}`, state: 'published' } as never,
    overrideAccess: true,
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-05-01T00:00:00.000Z',
      dateTo: '2027-05-05T00:00:00.000Z',
      price: 100,
      priceCzk: 2490,
      vat: 21,
      currency: 'EUR',
      capacity: 10,
      active: true,
    } as never,
    overrideAccess: true,
  })
  const user = await payload.create({
    collection: 'users',
    data: {
      name: 'Sweep',
      phone: '+420 600 000 060',
      email: `sweep-${unique}@x.test`,
      password: 'sweep-test-pwd',
      role: 'customer',
      _verified: true,
    } as never,
    overrideAccess: true,
  })
  const order = await payload.create({
    collection: 'orders',
    data: {
      user: user.id,
      eventDate: ed.id,
      participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
      billingAddress: billing,
      unitPrice: 100,
      unitPriceCzk: 2490,
      vat: 21,
      currency: 'EUR',
      state: 'pending',
    } as never,
    overrideAccess: true,
  })
  const txn = await payload.create({
    collection: 'transactions',
    data: {
      uuid: randomUUID(),
      order: order.id,
      amount: 2490,
      amountWithoutVat: 2057.85,
      currency: 'CZK',
      label: `Sweep ${unique}`,
      orderReference: order.orderNumber,
      email: user.email,
      state: 'begun',
      paymentMethod: 'muzapay',
      payload: { gatewayTransactionId: paymentId },
    } as never,
    overrideAccess: true,
  })
  return { orderId: order.id as number, txnId: txn.id as number }
}

function stubStates(byPaymentId: Record<string, string>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const u = String(url)
      if (u.includes('/v2/auth/token')) {
        return new Response(
          JSON.stringify({
            accessToken: 'tok-1',
            validTo: new Date(Date.now() + 600_000).toISOString(),
          }),
          { status: 200 },
        )
      }
      const match = u.match(/\/v2\/payments\/([^/]+)\//)
      const paymentState = match ? byPaymentId[match[1]] : undefined
      if (!paymentState) return new Response('{}', { status: 404 })
      return new Response(JSON.stringify({ paymentState }), { status: 200 })
    }),
  )
}

async function orderState(orderId: number): Promise<string> {
  const payload = await getTestPayload()
  const o = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
  return o.state as string
}

describe('sweepBenefitPlusPayments', () => {
  it('resolves a payment that completed after the payer closed the tab', async () => {
    const id = `PAY-SWEEP-${Date.now()}`
    const { orderId } = await seedBegunTransaction(id)
    stubStates({ [id]: 'PAID' })

    const summary = await sweepBenefitPlusPayments()

    expect(summary.checked).toBeGreaterThanOrEqual(1)
    expect(await orderState(orderId)).toBe('paid')
  })

  it('leaves an in-progress payment alone', async () => {
    const id = `PAY-INPROG-${Date.now()}`
    const { orderId } = await seedBegunTransaction(id)
    stubStates({ [id]: 'IN_PROGRESS_UNPAID' })

    await sweepBenefitPlusPayments()

    expect(await orderState(orderId)).toBe('pending')
  })

  it('keeps going when one transaction throws', async () => {
    const good = `PAY-GOOD-${Date.now()}`
    const bad = `PAY-BAD-${Date.now()}`
    const { orderId: goodOrder } = await seedBegunTransaction(good)
    await seedBegunTransaction(bad)
    // `bad` is absent from the map, so its state call 404s and throws.
    stubStates({ [good]: 'PAID' })

    const summary = await sweepBenefitPlusPayments()

    expect(summary.failed).toBeGreaterThanOrEqual(1)
    expect(await orderState(goodOrder)).toBe('paid')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/benefit-plus-sweep.int.spec.ts
```

Expected: FAIL — `sweepBenefitPlusPayments` is not exported.

- [ ] **Step 3: Write the implementation**

In `src/payments/order-payment-service.ts`:

```ts
/** How long a payment may sit `begun` before the sweep tries to cancel it. */
const STALE_AFTER_MS = 60 * 60 * 1000
/** Cap per run, so one sweep cannot fan out into an unbounded number of calls. */
const SWEEP_BATCH_SIZE = 50

export interface SweepSummary {
  checked: number
  resolved: number
  failed: number
}

/**
 * Resolves Benefit+ payments the return URL never got to — the payer closed
 * the tab, or the status check failed at the time. Runs from Vercel Cron.
 *
 * One failing transaction must not abort the batch: each is logged and the
 * loop continues, because a single unreachable payment would otherwise stall
 * every other order in the queue.
 */
export async function sweepBenefitPlusPayments(): Promise<SweepSummary> {
  const cms = await getPayloadClient()
  const { docs } = await cms.find({
    collection: 'transactions',
    where: {
      and: [{ paymentMethod: { equals: 'muzapay' } }, { state: { equals: 'begun' } }],
    },
    sort: 'createdAt',
    limit: SWEEP_BATCH_SIZE,
    overrideAccess: true,
  })

  const gateway = benefitPlusGateway()
  const summary: SweepSummary = { checked: 0, resolved: 0, failed: 0 }

  for (const doc of docs as TransactionDoc[]) {
    summary.checked += 1
    try {
      const transaction = toGatewayTransaction(doc)
      let outcome = await gateway.checkStatus(transaction)

      // Still unresolved well past the point a payer would have finished:
      // ask MuzaPay to cancel it, which their docs require for uncertain
      // states. Repeated passes give the progressive spacing they ask for.
      if (!outcome && Date.now() - new Date(doc.createdAt).getTime() > STALE_AFTER_MS) {
        outcome = await gateway.cancel(transaction)
      }

      if (outcome) {
        await applyOutcome(doc, outcome)
        summary.resolved += 1
      }
    } catch (err) {
      summary.failed += 1
      console.error(`[muzapay/sweep] transaction ${doc.uuid} failed:`, err)
    }
  }

  return summary
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/benefit-plus-sweep.int.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Add the cron route**

Create `src/app/api/payments/muzapay/reconcile/route.ts`:

```ts
/**
 * Cron entry point for the Benefit+ reconciliation sweep. Benefit+ sends no
 * webhook, so this is what closes out payments whose payer never came back
 * through the return URL.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on scheduled
 * invocations; nothing else may run this, since it drives order state.
 */

import { sweepBenefitPlusPayments } from '@/payments/order-payment-service'

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Fail closed: an unset secret must not leave the endpoint open.
    return new Response('Not configured', { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const summary = await sweepBenefitPlusPayments()
  return Response.json(summary)
}
```

- [ ] **Step 6: Register the cron**

Replace `vercel.json` with:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm payload migrate && pnpm build",
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/payments/muzapay/reconcile",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

Note for the operator: a sub-daily schedule requires the Vercel **Pro** plan. On Hobby the deploy still succeeds but the cron runs at most once a day, leaving abandoned payments unresolved for up to 24 hours.

- [ ] **Step 7: Typecheck and run the whole suite**

```bash
pnpm exec tsc --noEmit && pnpm test:int
```

Expected: no type errors, all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/payments/order-payment-service.ts src/app/api/payments/muzapay vercel.json tests/int/benefit-plus-sweep.int.spec.ts
git commit -m "feat(payments): add the Benefit+ reconciliation sweep"
```

---

## Task 14: The button

**Files:**
- Modify: `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/actions.ts`
- Modify: `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/page.tsx`

- [ ] **Step 1: Add the server action**

Replace `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/actions.ts` with:

```ts
'use server'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import {
  beginComgatePayment,
  beginBenefitPlusPayment,
} from '@/payments/order-payment-service'

export async function payByCardAction(orderId: number): Promise<void> {
  const user = await requireUser()
  const { redirectUrl } = await beginComgatePayment(orderId, { id: user.id, email: user.email })
  redirect(redirectUrl)
}

export async function payWithBenefitPlusAction(orderId: number): Promise<void> {
  const user = await requireUser()
  const { redirectUrl } = await beginBenefitPlusPayment(orderId, {
    id: user.id,
    email: user.email,
  })
  redirect(redirectUrl)
}
```

- [ ] **Step 2: Render the second button**

In `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/page.tsx`, extend the imports:

```ts
import { payByCardAction, payWithBenefitPlusAction } from './actions'
import { isBenefitPlusConfigured } from '@/payments/muzapay/config'
```

add `totalPriceCzk` to the `o` narrowing (alongside `totalPrice`):

```ts
    totalPrice: number; totalPriceCzk?: number | null; currency: string; participantCount: number
```

and replace the single-button block with:

```tsx
      {o.state === 'pending' && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '24px 0' }}>
          <form action={payByCardAction.bind(null, o.id)}>
            <button type="submit">Pay by card</button>
          </form>
          {o.totalPriceCzk != null && isBenefitPlusConfigured() && (
            <form action={payWithBenefitPlusAction.bind(null, o.id)}>
              {/* The CZK amount is shown because it differs from the EUR total
                  above — Benefit+ settles in CZK at an independently set price,
                  and the payer should not first learn that at the gateway. */}
              <button type="submit">
                Pay with Benefit+ — {o.totalPriceCzk.toLocaleString('cs-CZ')} Kč
              </button>
            </form>
          )}
        </div>
      )}
```

- [ ] **Step 3: Typecheck and build**

```bash
pnpm exec tsc --noEmit && pnpm build
```

Expected: no type errors; the build succeeds.

`isBenefitPlusConfigured()` is called from a Server Component, so the env vars stay server-side — confirm no `MUZAPAY_` value appears in the client bundle:

```bash
grep -r "MUZAPAY_" .next/static/ | head
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/book
git commit -m "feat(booking): add the Pay with Benefit+ button"
```

---

## Task 15: Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `src/payments/gateway.ts`

- [ ] **Step 1: Document the env vars**

In `CLAUDE.md`, in the `## Deployment` bullet list of environment variables, after the `COMGATE_TEST_MODE` entry, add:

```markdown
- `MUZAPAY_BASE_URL` — Benefit+ (MuzaPay) API base. Sandbox `https://api.gate.int.pay.muza.cz`, production `https://api.gate.pay.muza.cz`.
- `MUZAPAY_ESHOP_ID` / `MUZAPAY_ESHOP_PASSWORD` — eshop credentials for the token endpoint (HTTP Basic).
- `MUZAPAY_PRIVATE_KEY` — RSA private key used to sign every request, **base64-encoded PEM** (a multi-line PEM does not survive `.env` files or `vercel env pull`). A raw PEM is also accepted.
- `MUZAPAY_PRIVATE_KEY_PASSPHRASE` — optional passphrase for that key.
- `MUZAPAY_PRODUCT_CODE` — Benefit+ product category. Defaults to `LEISURE`; a Rockbusters order is always one trip, so the category never varies within a payment.
- `MUZAPAY_LANGUAGE` — gateway UI language, defaults to `cs`.
- `MUZAPAY_COUNTRY` / `MUZAPAY_TOKEN_SCOPE` — default to `CZ` and `SINGLE_PAYMENT`.
- `CRON_SECRET` — bearer secret for `/api/payments/muzapay/reconcile`. Vercel Cron sends it automatically; without it the endpoint returns 503.

If any of the four required `MUZAPAY_*` vars (`BASE_URL`, `ESHOP_ID`, `ESHOP_PASSWORD`, `PRIVATE_KEY`) is unset, the Benefit+ button does not render — same defensive fallback as the R2 and Resend configuration.
```

- [ ] **Step 2: Update the "Code so far" section**

In `CLAUDE.md`, replace the `src/payments/muzapay/` bullet (the one describing the three drafts) with:

```markdown
- `src/payments/muzapay/` — **implemented**: the Benefit+ gateway. `config.ts`
  (env config + `isBenefitPlusConfigured()`), `client.ts` (JSON HTTP transport),
  `gateway.ts` (`MuzaPayGateway`), plus the previously-drafted `signature-builder.ts`,
  `signer.ts` and `token-provider.ts`, now unit-tested. Benefit+ sends **no
  webhook**: results are read from its status endpoint on the return URL
  (`/api/payments/muzapay/return`) and by a cron sweep
  (`/api/payments/muzapay/reconcile`, every 10 minutes). It settles in CZK, so
  event dates carry an optional `priceCzk` that orders snapshot as
  `unitPriceCzk`/`totalPriceCzk`; the order itself stays EUR. See
  `docs/superpowers/specs/2026-09-02-benefit-plus-gateway-design.md`.
```

- [ ] **Step 3: Remove the resolved DRAFT block**

At the bottom of `src/payments/gateway.ts`, the "DRAFT — open questions" block asks four questions that this work answers. Replace the whole block with:

```ts
// ---------------------------------------------------------------------------
// Resolved design notes
// ---------------------------------------------------------------------------
//
// 1. Webhook routing: one route per gateway, under
//    src/app/api/payments/<gateway>/. Benefit+ has no webhook route at all.
// 2. handleWebhook receives the Web `Request` straight from a Next.js route
//    handler; the service layer (`order-payment-service.ts`) owns persistence.
// 3. checkStatus scheduling: Vercel Cron hits
//    /api/payments/muzapay/reconcile every 10 minutes. Comgate does not need
//    it — its webhook is authoritative.
// 4. MuzaPay signing is ported and unit-tested in
//    tests/int/muzapay-signing.int.spec.ts.
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md src/payments/gateway.ts
git commit -m "docs: document the Benefit+ gateway and its environment"
```

---

## Task 16: Sandbox verification

Nothing above proves the integration works — every MuzaPay call in the tests is stubbed. This task is the real check, and it **blocks merge**.

**Files:** none (manual)

- [ ] **Step 1: Configure the sandbox locally**

Put the sandbox credentials in `.env` (never `.env.test` — that database gets wiped):

```bash
MUZAPAY_BASE_URL=https://api.gate.int.pay.muza.cz
MUZAPAY_ESHOP_ID=<sandbox eshop id>
MUZAPAY_ESHOP_PASSWORD=<sandbox password>
MUZAPAY_PRIVATE_KEY=<base64 of the PEM>
CRON_SECRET=<any local random string>
```

Base64-encode the key with:

```bash
base64 -i /path/to/rockbusters_benefit_private.pem | tr -d '\n'
```

Confirm `DATABASE_URL` in `.env` points at the Neon **dev** branch, not `ep-weathered-pine-alvc3sdj`.

- [ ] **Step 2: Give a trip a CZK price**

Start the dev server, open `/admin/collections/event-dates`, pick an active future date, set `priceCzk` (e.g. `2490`), and save.

- [ ] **Step 3: Book it and check the button**

Book that date as a logged-in customer. On the confirmation page, expect **two** buttons, with the Benefit+ one showing `2 490 Kč`.

- [ ] **Step 4: Pay**

Click "Pay with Benefit+". Expect a redirect to the MuzaPay gateway rather than an error.

**If the gateway rejects the signature**, work through the risks listed in the spec in this order: (a) field order in `initRequest`, (b) whether `amount` should be haléře or whole crowns, (c) whether the delimiter is `|`. Change one at a time and re-run.

Confirm the payment in the Benefit+ test app.

- [ ] **Step 5: Verify the return path**

Expect a redirect to `/account/orders/<id>` and the order showing as **paid**. In `/admin/collections/transactions`, the transaction should be `paid` with a populated `callbackPayload`.

- [ ] **Step 6: Verify the sweep**

Start a second Benefit+ payment and close the browser tab at the gateway instead of returning. The order stays `pending`. Then run the sweep by hand:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/payments/muzapay/reconcile
```

Expected: a JSON summary like `{"checked":1,"resolved":0,"failed":0}` while the payment is unconfirmed. Complete the payment in the Benefit+ app, run the same command again, and expect `resolved` to increment and the order to reach `paid`.

Also confirm the endpoint is closed without the header:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/payments/muzapay/reconcile
```

Expected: `401`.

- [ ] **Step 7: Record the findings**

Append a short "Sandbox verification" section to
`docs/superpowers/specs/2026-09-02-benefit-plus-gateway-design.md` recording what
the five open questions turned out to be — signature field order, amount units,
the observed `paymentState` values, the token response shape, and anything the
gateway rejected on the way. Future readers should not have to rediscover this.

- [ ] **Step 8: Commit**

```bash
git add docs/superpowers/specs/2026-09-02-benefit-plus-gateway-design.md
git commit -m "docs: record Benefit+ sandbox verification findings"
```

---

## Deployment checklist

After merge, before the button is usable on `beta.rockbusters.net`:

1. Set all `MUZAPAY_*` variables plus `CRON_SECRET` in the Vercel project settings for the `rockbusters` project. Store `MUZAPAY_ESHOP_PASSWORD` and `MUZAPAY_PRIVATE_KEY` as Sensitive.
2. Keep `MUZAPAY_BASE_URL` on the **sandbox** host until a live Benefit+ account is verified.
3. Confirm the project is on the **Pro** plan, otherwise the 10-minute cron degrades to daily.
4. Deploy, then check the Vercel cron log shows `/api/payments/muzapay/reconcile` firing and returning 200.
5. Give at least one production event date a `priceCzk`, or no Benefit+ button appears anywhere.
