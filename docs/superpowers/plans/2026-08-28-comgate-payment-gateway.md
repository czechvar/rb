# Comgate Payment Gateway Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a customer pay for a booking online by card through Comgate, right after creating the order, with the order automatically moving to `paid` once Comgate confirms the payment via webhook.

**Architecture:** Port `snowbusters` `ComgateGateway.php` to TypeScript against the existing draft contract in [`src/payments/gateway.ts`](../../src/payments/gateway.ts) (`PaymentGateway`, `Transaction`, `TransactionStore`). A new `transactions` Payload collection persists gateway state. A thin `OrderPaymentService` (`src/payments/order-payment-service.ts`) is the only thing that touches both the `transactions` and `orders` collections — it creates the transaction, calls the gateway, and on a webhook outcome advances the order through the existing state machine (`pending → confirmed → paid`, or `→ cancelled`). Two Next.js route handlers (webhook + return) and one new server action wire this into the existing booking-confirmation page.

**Scope for this plan (confirmed with the user):**
- ✅ `begin()` (start a payment, redirect to Comgate) and the webhook that confirms it.
- ✅ "Pay by card" attaches to the order **immediately after booking**, while the order is still `pending` — not gated behind admin confirmation. The webhook handler chains `pending → confirmed → paid` in one call so the existing state matrix (which only allows single-step forward transitions) never sees a skipped step.
- ❌ **Out of scope, deferred:** the `checkStatus` cron/reconciliation job and the `cancel`/refund call. Both exist in the PHP original but aren't needed for a working checkout. `ComgateGateway.checkStatus()` and `.cancel()` are implemented as clearly-labelled "not implemented yet" stubs so the class still satisfies the shared `PaymentGateway` interface — do not flesh these out as part of this plan.
- ❌ Stripe is **not** part of this plan — it was only discussed as a possible future addition.

**Tech Stack:** Next.js App Router route handlers, Payload CMS local API (`overrideAccess: true` for system-triggered writes, mirroring the existing `orders` hooks), Vitest (`tests/int/**/*.int.spec.ts` — this project runs pure-unit-style specs from that same folder, e.g. `helpers.int.spec.ts`, `state-machine.int.spec.ts`; only specs that actually touch the DB need `getTestPayload()`), native `fetch` (already the pattern in `src/payments/muzapay/token-provider.ts`).

---

## Reference material

- PHP original: `/Users/janantl/Sites/snowbusters/api/app/PaymentsModule/service/ComgateGateway.php` (194 lines — read it before Task 3, the port must match it exactly on the wire format).
- PHP interface it implements: `/Users/janantl/Sites/snowbusters/api/app/PaymentsModule/service/PaymentGateway.php`.
- Existing TS contract to build against (do **not** modify): [`src/payments/gateway.ts`](../../src/payments/gateway.ts).
- Style precedent for a ported gateway file: [`src/payments/muzapay/token-provider.ts`](../../src/payments/muzapay/token-provider.ts) (uses global `fetch`, wraps failures in `PaymentGatewayError`). Note: the `src/payments/**` draft files use semicolons, which is inconsistent with this repo's own `.prettierrc.json` (`"semi": false`). Write all **new** files in this plan without semicolons, matching the repo-wide config — don't propagate the drafts' inconsistency.
- Order state machine: [`src/collections/orders/state-machine.ts`](../../src/collections/orders/state-machine.ts) — `pending → confirmed → paid → completed`, any non-terminal → `cancelled`.
- Order state-transition guard: [`src/collections/orders/state-hook.ts`](../../src/collections/orders/state-hook.ts) — rejects skipped steps (e.g. `pending → paid` directly throws). This is why the webhook handler must do two `payload.update` calls, not one.
- Booking flow: [`src/app/(frontend)/book/[eventDateId]/actions.ts`](<../../src/app/(frontend)/book/[eventDateId]/actions.ts>) creates the order in `pending`; the confirmation page is [`src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/page.tsx`](<../../src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/page.tsx>).
- Existing "bind an id, submit a form" pattern to mirror: [`src/app/(frontend)/account/orders/[id]/actions.ts`](<../../src/app/(frontend)/account/orders/[id]/actions.ts>) (`cancelMyOrderAction`) + its usage in [`src/app/(frontend)/account/orders/[id]/page.tsx`](<../../src/app/(frontend)/account/orders/[id]/page.tsx>) (`.bind(null, o.id)`, plain `<form action={...}>`, no `ActionResult` needed since there's nothing to re-render on failure — a thrown `Error` surfaces via the Next.js error boundary, same as `cancelMyOrderAction`).
- Test fixture pattern to reuse: `seed()` in [`tests/int/orders-state.int.spec.ts`](../../tests/int/orders-state.int.spec.ts).
- `getTestPayload()` helper: [`tests/helpers/payload.ts`](../../tests/helpers/payload.ts).
- Payload migrations: **never hand-write the `.ts` migration file** — always run `payload migrate:create` so the Drizzle `.json` snapshot is generated alongside it (this project got bitten by this before). Also: check for a stale `name='dev' batch=-1` row in `payload_migrations` if a migrate command appears to silently no-op.

---

## File Structure

New files:
- `src/collections/Transactions.ts` — Payload collection.
- `src/payments/comgate/config.ts` — env var → gateway config.
- `src/payments/comgate/client.ts` — raw HTTP (form-urlencoded POST/parse), no domain knowledge.
- `src/payments/comgate/gateway.ts` — `ComgateGateway`, implements `PaymentGateway` from `../gateway`.
- `src/payments/order-payment-service.ts` — the only file that reads/writes both `transactions` and `orders`; owns the `pending→confirmed→paid` chaining.
- `src/app/api/payments/comgate/webhook/route.ts` — thin route handler.
- `src/app/api/payments/comgate/return/route.ts` — thin route handler.
- `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/actions.ts` — new `payByCardAction`.

Modified files:
- `src/payload.config.ts` — register `Transactions` collection.
- `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/page.tsx` — add the "Pay by card" button.
- `.env.example` — document the three new env vars.
- `CLAUDE.md` — add the env vars to the Deployment section, matching the existing list format.

Tests (all under `tests/int/`, per this project's convention of running pure-unit specs from that folder):
- `tests/int/comgate-client.int.spec.ts`
- `tests/int/comgate-gateway.int.spec.ts`
- `tests/int/transactions-collection.int.spec.ts`
- `tests/int/order-payment-service.int.spec.ts`

---

### Task 1: `transactions` Payload collection

**Files:**
- Create: `src/collections/Transactions.ts`
- Modify: `src/payload.config.ts`
- Test: `tests/int/transactions-collection.int.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/int/transactions-collection.int.spec.ts
import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('transactions collection', () => {
  it('creates a transaction with defaults and enforces the uuid unique index', async () => {
    const payload = await getTestPayload()
    const uuid = `11111111-0000-4000-8000-${Date.now()}`

    const doc = await payload.create({
      collection: 'transactions',
      data: {
        uuid,
        order: 1, // FK not validated at the DB level by Payload; any int id is fine here
        amount: 199,
        amountWithoutVat: 164.46,
        currency: 'EUR',
        label: 'Rockbusters RB-2026-000001',
        email: 'payer@x.test',
        paymentMethod: 'comgate-card',
      } as never,
      overrideAccess: true,
    })

    expect(doc.state).toBe('created')
    expect(doc.payload).toBeFalsy()
    expect(doc.callbackPayload).toBeFalsy()

    await expect(
      payload.create({
        collection: 'transactions',
        data: {
          uuid, // duplicate
          order: 1,
          amount: 50,
          amountWithoutVat: 41.32,
          currency: 'EUR',
          label: 'dup',
          email: 'other@x.test',
          paymentMethod: 'comgate-card',
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('blocks writes through the public API (create/update/delete all denied without overrideAccess)', async () => {
    const payload = await getTestPayload()
    await expect(
      payload.create({
        collection: 'transactions',
        data: {
          uuid: `no-access-${Date.now()}`,
          order: 1,
          amount: 10,
          amountWithoutVat: 8.26,
          currency: 'EUR',
          label: 'x',
          email: 'x@x.test',
          paymentMethod: 'comgate-card',
        } as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/int/transactions-collection.int.spec.ts`
Expected: FAIL — `The collection with slug transactions can't be found.` (or similar), because the collection doesn't exist yet.

- [ ] **Step 3: Create the collection**

```typescript
// src/collections/Transactions.ts
import type { CollectionConfig } from 'payload'

/**
 * Payment-gateway transactions. Mirrors the `Transaction` domain type in
 * `src/payments/gateway.ts` — see that file's header for the full state
 * machine and field meanings. This collection is written to only by server
 * code via the local API with `overrideAccess: true` (see
 * `src/payments/order-payment-service.ts`); it has no public write surface.
 */
export const Transactions: CollectionConfig = {
  slug: 'transactions',
  labels: { singular: 'Transaction', plural: 'Transactions' },
  admin: {
    useAsTitle: 'uuid',
    group: 'Sales',
    defaultColumns: ['uuid', 'order', 'state', 'paymentMethod', 'amount', 'currency', 'createdAt'],
  },
  access: {
    read: ({ req }) => req.user?.role === 'admin',
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'uuid', type: 'text', required: true, unique: true, index: true },
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, index: true },
    { name: 'amount', type: 'number', required: true, admin: { description: 'Total amount, VAT inclusive, in whole currency units (e.g. 199 for €199).' } },
    { name: 'amountWithoutVat', type: 'number', required: true },
    {
      name: 'currency',
      type: 'select',
      required: true,
      options: [
        { label: 'EUR', value: 'EUR' },
        { label: 'CZK', value: 'CZK' },
      ],
    },
    { name: 'label', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    {
      name: 'state',
      type: 'select',
      required: true,
      defaultValue: 'created',
      options: [
        { label: 'Created', value: 'created' },
        { label: 'Begun', value: 'begun' },
        { label: 'Pending payment', value: 'pending-payment' },
        { label: 'Paid', value: 'paid' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      options: [
        { label: 'PayPal', value: 'paypal' },
        { label: 'MuzaPay', value: 'muzapay' },
        { label: 'Comgate — card', value: 'comgate-card' },
        { label: 'Comgate — bank transfer', value: 'comgate-transfer' },
        { label: 'Bank transfer', value: 'bank-transfer' },
      ],
    },
    {
      name: 'payload',
      type: 'json',
      admin: { description: 'Gateway data captured from begin() (e.g. redirectUrl, gatewayTransactionId).' },
    },
    {
      name: 'callbackPayload',
      type: 'json',
      admin: { description: 'Raw data from the last gateway webhook/callback.' },
    },
  ],
}
```

- [ ] **Step 4: Register the collection**

In `src/payload.config.ts`, add the import next to the other collection imports:

```typescript
import { Orders } from './collections/Orders'
import { Transactions } from './collections/Transactions'
```

And add `Transactions` to the `collections` array, right after `Orders`:

```typescript
  collections: [
    Users,
    Media,
    Difficulties,
    Programs,
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
    Transactions,
    DiscountCodes,
    Referrals,
    PostCategories,
    Posts,
    Pages,
  ],
```

- [ ] **Step 5: Generate types and the migration**

```bash
NODE_OPTIONS=--no-deprecation npx payload generate:types
NODE_OPTIONS=--no-deprecation npx payload migrate:create add-transactions
```

Confirm two new files landed under `src/migrations/`: `<timestamp>_add-transactions.ts` **and** `<timestamp>_add-transactions.json`. If only the `.ts` file appears, stop — check `payload_migrations` for a stale `name='dev' batch=-1` row before proceeding (this has silently no-op'd migrate before in this project).

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm exec vitest run tests/int/transactions-collection.int.spec.ts`
Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add src/collections/Transactions.ts src/payload.config.ts src/migrations/*add-transactions* src/payload-types.ts tests/int/transactions-collection.int.spec.ts
git commit -m "feat(payments): add transactions collection"
```

---

### Task 2: Comgate HTTP client

**Files:**
- Create: `src/payments/comgate/client.ts`
- Test: `tests/int/comgate-client.int.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/int/comgate-client.int.spec.ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PaymentGatewayError } from '@/payments/gateway'
import { comgatePostForm } from '@/payments/comgate/client'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('comgatePostForm', () => {
  it('sends a form-urlencoded POST and parses the form-urlencoded response', async () => {
    let capturedInit: RequestInit | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        capturedInit = init
        return new Response('code=0&message=OK&transId=ABCD-1234-EFGH&redirect=https%3A%2F%2Fpayments.comgate.cz%2Fclient%2Finstructions%2Findex', {
          status: 200,
        })
      }),
    )

    const result = await comgatePostForm('https://payments.comgate.cz/v1.0/create', {
      merchant: 'M123',
      secret: 's3cr3t',
      price: '19900',
    })

    expect(result).toEqual({
      code: '0',
      message: 'OK',
      transId: 'ABCD-1234-EFGH',
      redirect: 'https://payments.comgate.cz/client/instructions/index',
    })
    expect(capturedInit?.method).toBe('POST')
    expect((capturedInit?.headers as Record<string, string>)['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    )
    expect(String(capturedInit?.body)).toBe('merchant=M123&secret=s3cr3t&price=19900')
  })

  it('wraps a non-200 response in PaymentGatewayError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })))
    await expect(comgatePostForm('https://payments.comgate.cz/v1.0/create', {})).rejects.toThrow(
      PaymentGatewayError,
    )
  })

  it('wraps a network failure in PaymentGatewayError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNRESET')
      }),
    )
    await expect(comgatePostForm('https://payments.comgate.cz/v1.0/create', {})).rejects.toThrow(
      PaymentGatewayError,
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/int/comgate-client.int.spec.ts`
Expected: FAIL — cannot find module `@/payments/comgate/client`.

- [ ] **Step 3: Write the client**

```typescript
// src/payments/comgate/client.ts
/**
 * Raw HTTP transport for the Comgate REST API. No domain knowledge — takes
 * and returns plain string maps. Mirrors snowbusters
 * `ComgateGateway::sendRequest` (form-urlencoded request AND response body).
 */

import { PaymentGatewayError } from '../gateway'

export async function comgatePostForm(
  url: string,
  params: Record<string, string>,
): Promise<Record<string, string>> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    })
  } catch (cause) {
    throw new PaymentGatewayError('Comgate request failed.', cause)
  }

  if (response.status !== 200) {
    throw new PaymentGatewayError(`Unexpected HTTP ${response.status} from Comgate.`)
  }

  const text = await response.text()
  const parsed = new URLSearchParams(text)
  const result: Record<string, string> = {}
  for (const [key, value] of parsed.entries()) result[key] = value
  return result
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/int/comgate-client.int.spec.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/payments/comgate/client.ts tests/int/comgate-client.int.spec.ts
git commit -m "feat(payments): add Comgate HTTP client"
```

---

### Task 3: `ComgateGateway`

**Files:**
- Create: `src/payments/comgate/config.ts`
- Create: `src/payments/comgate/gateway.ts`
- Test: `tests/int/comgate-gateway.int.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/int/comgate-gateway.int.spec.ts
// @vitest-environment node
//
// This spec builds real `Request` objects and calls `.formData()` on them.
// The project's default `jsdom` environment (vitest.config.mts) has patchy
// FormData/Request support in some versions — force the Node environment
// for this file so the webhook parsing is tested against the same
// fetch/Request implementation Next.js route handlers actually run on.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isPaymentResult, PaymentGatewayError, type Transaction, type TransactionStore } from '@/payments/gateway'
import { ComgateGateway } from '@/payments/comgate/gateway'

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: '1',
    uuid: 'uuid-1',
    money: { amount: '199.00', amountWithoutVat: '164.46', currency: 'EUR' },
    label: 'Rockbusters RB-2026-000001',
    email: 'payer@x.test',
    state: 'created',
    paymentMethod: 'comgate-card',
    payload: {},
    callbackPayload: null,
    createdAt: '2026-08-28T00:00:00.000Z',
    updatedAt: '2026-08-28T00:00:00.000Z',
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

function makeGateway(store: TransactionStore) {
  return new ComgateGateway({
    merchant: 'M123',
    secret: 's3cr3t',
    test: true,
    backendBaseUrl: 'https://rockbusters.net',
    store,
  })
}

describe('ComgateGateway.begin', () => {
  it('builds the create request and returns the redirect + gateway id', async () => {
    let capturedBody = ''
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        capturedBody = String(init.body)
        return new Response('code=0&message=OK&transId=ABCD-1234&redirect=https%3A%2F%2Fpayments.comgate.cz%2Fpay%2FABCD-1234', {
          status: 200,
        })
      }),
    )

    const gateway = makeGateway(makeStore([]))
    const result = await gateway.begin(makeTransaction())

    expect(result).toEqual({
      redirectUrl: 'https://payments.comgate.cz/pay/ABCD-1234',
      gatewayTransactionId: 'ABCD-1234',
      payload: { redirectUrl: 'https://payments.comgate.cz/pay/ABCD-1234', gatewayTransactionId: 'ABCD-1234' },
    })

    const sent = new URLSearchParams(capturedBody)
    expect(sent.get('merchant')).toBe('M123')
    expect(sent.get('secret')).toBe('s3cr3t')
    expect(sent.get('price')).toBe('19900') // 199.00 EUR -> minor units
    expect(sent.get('curr')).toBe('EUR')
    expect(sent.get('refId')).toBe('uuid-1')
    expect(sent.get('prepareOnly')).toBe('true')
    expect(sent.get('test')).toBe('true')
    expect(sent.get('returnUrl')).toBe('https://rockbusters.net/api/payments/comgate/return?refId=uuid-1')
    expect(sent.get('notifyUrl')).toBe('https://rockbusters.net/api/payments/comgate/webhook')
  })

  it('rejects a transaction that is not in the created state', async () => {
    const gateway = makeGateway(makeStore([]))
    await expect(gateway.begin(makeTransaction({ state: 'begun' }))).rejects.toThrow(PaymentGatewayError)
  })

  it('throws when Comgate returns a non-zero code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('code=1400&message=Invalid merchant', { status: 200 })))
    const gateway = makeGateway(makeStore([]))
    await expect(gateway.begin(makeTransaction())).rejects.toThrow(/Invalid merchant/)
  })
})

describe('ComgateGateway.handleWebhook', () => {
  function webhookRequest(fields: Record<string, string>): Request {
    const body = new URLSearchParams(fields)
    return new Request('https://rockbusters.net/api/payments/comgate/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
  }

  it('maps a PAID webhook to a paid outcome', async () => {
    const txn = makeTransaction({ state: 'begun' })
    const gateway = makeGateway(makeStore([txn]))
    const result = await gateway.handleWebhook(
      webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: 'uuid-1', status: 'PAID', transId: 'ABCD-1234' }),
    )
    expect(result.transactionUuid).toBe('uuid-1')
    expect(result.outcome.state).toBe('paid')
    expect(result.outcome.callbackPayload).toMatchObject({ status: 'PAID', transId: 'ABCD-1234' })
    expect(result.acknowledgement).toEqual({ status: 200, body: 'OK' })
  })

  it('maps a CANCELLED webhook to a cancelled outcome', async () => {
    const txn = makeTransaction({ state: 'begun' })
    const gateway = makeGateway(makeStore([txn]))
    const result = await gateway.handleWebhook(
      webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: 'uuid-1', status: 'CANCELLED' }),
    )
    expect(result.outcome.state).toBe('cancelled')
  })

  it('is idempotent for a transaction already in a payment-result state', async () => {
    const txn = makeTransaction({ state: 'paid', callbackPayload: { status: 'PAID' } })
    expect(isPaymentResult(txn.state)).toBe(true)
    const gateway = makeGateway(makeStore([txn]))
    const result = await gateway.handleWebhook(
      webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: 'uuid-1', status: 'PAID' }),
    )
    expect(result.outcome.state).toBe('paid')
    expect(result.acknowledgement).toEqual({ status: 200, body: 'OK' })
  })

  it('rejects a merchant/secret mismatch', async () => {
    const gateway = makeGateway(makeStore([makeTransaction({ state: 'begun' })]))
    await expect(
      gateway.handleWebhook(webhookRequest({ merchant: 'WRONG', secret: 's3cr3t', refId: 'uuid-1', status: 'PAID' })),
    ).rejects.toThrow(/Merchant mismatch/)
  })

  it('rejects an unknown refId', async () => {
    const gateway = makeGateway(makeStore([]))
    await expect(
      gateway.handleWebhook(webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: 'nope', status: 'PAID' })),
    ).rejects.toThrow(/not found/i)
  })

  it('rejects a transaction that has not begun yet', async () => {
    const gateway = makeGateway(makeStore([makeTransaction({ state: 'created' })]))
    await expect(
      gateway.handleWebhook(webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: 'uuid-1', status: 'PAID' })),
    ).rejects.toThrow(/cannot be handled/i)
  })
})

describe('ComgateGateway — deferred methods', () => {
  it('handleReturn always resolves null (Comgate confirms via webhook only)', async () => {
    const gateway = makeGateway(makeStore([]))
    await expect(gateway.handleReturn(makeTransaction())).resolves.toBeNull()
  })
  it('checkStatus and cancel are not implemented in this MVP', async () => {
    const gateway = makeGateway(makeStore([]))
    await expect(gateway.checkStatus(makeTransaction())).rejects.toThrow(PaymentGatewayError)
    await expect(gateway.cancel(makeTransaction())).rejects.toThrow(PaymentGatewayError)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/int/comgate-gateway.int.spec.ts`
Expected: FAIL — cannot find module `@/payments/comgate/gateway`.

- [ ] **Step 3: Write the env config**

```typescript
// src/payments/comgate/config.ts
export interface ComgateEnvConfig {
  merchant: string
  secret: string
  test: boolean
}

/**
 * Reads Comgate credentials from the environment, failing fast (same
 * pattern as `requireEnv` in `src/payload.config.ts`) rather than silently
 * defaulting to empty strings that would only surface as a cryptic Comgate
 * API error later.
 */
export function comgateConfigFromEnv(): ComgateEnvConfig {
  const merchant = process.env.COMGATE_MERCHANT
  const secret = process.env.COMGATE_SECRET
  if (!merchant || !secret) {
    throw new Error(
      'COMGATE_MERCHANT and COMGATE_SECRET must be set to accept card payments.',
    )
  }
  // Defaults to sandbox (true) unless explicitly turned off — a missing/mistyped
  // value should never accidentally enable real charges.
  return { merchant, secret, test: process.env.COMGATE_TEST_MODE !== 'false' }
}
```

- [ ] **Step 4: Write the gateway**

```typescript
// src/payments/comgate/gateway.ts
/**
 * TypeScript port of snowbusters
 * api/app/PaymentsModule/service/ComgateGateway.php.
 *
 * Scope for this port (see docs/superpowers/plans/2026-08-28-comgate-payment-gateway.md):
 * only begin() and handleWebhook() are implemented. checkStatus() and
 * cancel() throw — they back a cron-reconciliation job and a refund flow
 * that this rebuild doesn't have yet. handleReturn() is a no-op in the PHP
 * original too: Comgate confirms payment via server-to-server webhook only,
 * the return URL is purely where the payer's browser lands.
 */

import {
  isPaymentResult,
  PaymentGatewayError,
  type BeginResult,
  type PaymentGateway,
  type PaymentOutcome,
  type Transaction,
  type TransactionStore,
  type WebhookResult,
} from '../gateway'
import { comgatePostForm } from './client'

const API_BASE = 'https://payments.comgate.cz'

export interface ComgateGatewayConfig {
  merchant: string
  secret: string
  test: boolean
  /** Public base URL of this Next.js app (both the webhook and the API live here). */
  backendBaseUrl: string
  store: TransactionStore
}

export class ComgateGateway implements PaymentGateway {
  constructor(private readonly config: ComgateGatewayConfig) {}

  async begin(transaction: Transaction): Promise<BeginResult> {
    if (transaction.state !== 'created') {
      throw new PaymentGatewayError('Cannot begin the transaction at this point.')
    }

    const base = this.config.backendBaseUrl.replace(/\/+$/, '')
    const returnUrl = `${base}/api/payments/comgate/return?refId=${transaction.uuid}`
    const notifyUrl = `${base}/api/payments/comgate/webhook`
    const minorUnits = Math.round(Number(transaction.money.amount) * 100)

    const data = await comgatePostForm(`${API_BASE}/v1.0/create`, {
      merchant: this.config.merchant,
      secret: this.config.secret,
      price: String(minorUnits),
      curr: transaction.money.currency,
      label: transaction.label,
      email: transaction.email,
      refId: transaction.uuid,
      method: 'ALL',
      prepareOnly: 'true',
      test: this.config.test ? 'true' : 'false',
      returnUrl,
      notifyUrl,
    })

    if (data.code !== undefined && data.code !== '0') {
      throw new PaymentGatewayError(`Comgate API error: ${data.message ?? 'Unknown error'}`)
    }
    if (!data.redirect || !data.transId) {
      throw new PaymentGatewayError('Comgate response is missing redirect/transId.')
    }

    return {
      redirectUrl: data.redirect,
      gatewayTransactionId: data.transId,
      payload: { redirectUrl: data.redirect, gatewayTransactionId: data.transId },
    }
  }

  async handleWebhook(request: Request): Promise<WebhookResult> {
    const form = await request.formData()
    const get = (key: string): string | null => {
      const value = form.get(key)
      return typeof value === 'string' ? value : null
    }

    if (get('merchant') !== this.config.merchant) {
      throw new PaymentGatewayError('Merchant mismatch.')
    }
    if (get('secret') !== this.config.secret) {
      throw new PaymentGatewayError('Secret mismatch.')
    }
    const refId = get('refId')
    if (!refId) {
      throw new PaymentGatewayError('Missing reference ID.')
    }
    const transaction = await this.config.store.findByUuid(refId)
    if (!transaction) {
      throw new PaymentGatewayError('Transaction not found.')
    }

    const acknowledgement = { status: 200, body: 'OK' }

    // Idempotent: a duplicate webhook for an already-resolved transaction
    // still gets a 200 so Comgate stops retrying.
    if (isPaymentResult(transaction.state)) {
      return {
        transactionUuid: refId,
        outcome: { state: transaction.state, callbackPayload: transaction.callbackPayload ?? {} },
        acknowledgement,
      }
    }
    if (transaction.state !== 'begun') {
      throw new PaymentGatewayError('Transaction cannot be handled at this point.')
    }

    const status = get('status')
    const state = status === 'PAID' ? 'paid' : status === 'CANCELLED' ? 'cancelled' : null
    if (!state) {
      throw new PaymentGatewayError(`Unhandled Comgate status: ${status ?? '(missing)'}`)
    }

    const callbackPayload: Record<string, unknown> = {}
    for (const [key, value] of form.entries()) callbackPayload[key] = value

    return { transactionUuid: refId, outcome: { state, callbackPayload }, acknowledgement }
  }

  async handleReturn(): Promise<PaymentOutcome | null> {
    return null
  }

  async checkStatus(): Promise<PaymentOutcome | null> {
    throw new PaymentGatewayError(
      'ComgateGateway.checkStatus is not implemented (deferred — see docs/superpowers/plans/2026-08-28-comgate-payment-gateway.md).',
    )
  }

  async cancel(): Promise<void> {
    throw new PaymentGatewayError(
      'ComgateGateway.cancel is not implemented (deferred — see docs/superpowers/plans/2026-08-28-comgate-payment-gateway.md).',
    )
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run tests/int/comgate-gateway.int.spec.ts`
Expected: PASS (11 tests)

- [ ] **Step 6: Commit**

```bash
git add src/payments/comgate/config.ts src/payments/comgate/gateway.ts tests/int/comgate-gateway.int.spec.ts
git commit -m "feat(payments): port ComgateGateway (begin + webhook)"
```

---

### Task 4: `OrderPaymentService`

This is the only file that touches both `transactions` and `orders`. It owns: creating a transaction + calling `begin()`, and applying a webhook outcome by chaining the order through the state machine.

**Files:**
- Create: `src/payments/order-payment-service.ts`
- Test: `tests/int/order-payment-service.int.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/int/order-payment-service.int.spec.ts
// @vitest-environment node
//
// See the same note in comgate-gateway.int.spec.ts — this spec also builds
// real `Request` objects and relies on `.formData()`.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import { beginComgatePayment, applyComgateWebhook } from '@/payments/order-payment-service'

process.env.COMGATE_MERCHANT = 'M123'
process.env.COMGATE_SECRET = 's3cr3t'
process.env.COMGATE_TEST_MODE = 'true'
process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net'

afterEach(() => {
  vi.unstubAllGlobals()
})

const baseBilling = {
  firstName: 'A', lastName: 'B', street: 'Main 1', city: 'Prague', postalCode: '11000', country: 'CZ',
}

async function seedOrder() {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: { title: `PayTest ${unique}`, slug: `paytest-${unique}`, state: 'published' },
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-05-01T00:00:00.000Z',
      dateTo: '2027-05-05T00:00:00.000Z',
      price: 100, vat: 21, currency: 'EUR', capacity: 10, active: true,
    },
  })
  const user = await payload.create({
    collection: 'users',
    data: {
      name: 'Payer', phone: '+420 600 000 030',
      email: `payer-${Date.now()}-${Math.random()}@x.test`,
      password: 'pay-test-pwd',
      role: 'customer',
      _verified: true,
    } as never,
  })
  const order = await payload.create({
    collection: 'orders',
    data: {
      user: user.id, eventDate: ed.id,
      participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
      billingAddress: baseBilling,
      unitPrice: 100, vat: 21, currency: 'EUR', state: 'pending',
    } as never,
    overrideAccess: true,
  })
  return { user, order }
}

function stubComgateCreate(response: string) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(response, { status: 200 })))
}

describe('beginComgatePayment', () => {
  it('creates a transaction, calls Comgate, and returns the redirect URL', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder()
    stubComgateCreate('code=0&message=OK&transId=TXN-1&redirect=https%3A%2F%2Fpayments.comgate.cz%2Fpay%2FTXN-1')

    const { redirectUrl } = await beginComgatePayment(order.id, { id: user.id, email: user.email })
    expect(redirectUrl).toBe('https://payments.comgate.cz/pay/TXN-1')

    const { docs } = await payload.find({
      collection: 'transactions', where: { order: { equals: order.id } }, overrideAccess: true,
    })
    expect(docs).toHaveLength(1)
    expect(docs[0].state).toBe('begun')
    expect(docs[0].payload).toMatchObject({ gatewayTransactionId: 'TXN-1' })

    const refreshedOrder = await payload.findByID({ collection: 'orders', id: order.id, overrideAccess: true })
    expect(refreshedOrder.state).toBe('pending') // begin() never touches order state
  })

  it('refuses to start a payment for someone else\'s order', async () => {
    const { order } = await seedOrder()
    stubComgateCreate('code=0&message=OK&transId=TXN-2&redirect=https%3A%2F%2Fx')
    await expect(beginComgatePayment(order.id, { id: 999_999, email: 'attacker@x.test' })).rejects.toThrow()
  })
})

describe('applyComgateWebhook', () => {
  async function beginAndGetUuid(orderId: number, user: { id: number; email: string }) {
    stubComgateCreate('code=0&message=OK&transId=TXN-3&redirect=https%3A%2F%2Fpayments.comgate.cz%2Fpay%2FTXN-3')
    await beginComgatePayment(orderId, user)
    const payload = await getTestPayload()
    const { docs } = await payload.find({
      collection: 'transactions', where: { order: { equals: orderId } }, overrideAccess: true, sort: '-createdAt', limit: 1,
    })
    return docs[0].uuid as string
  }

  function webhookRequest(fields: Record<string, string>): Request {
    return new Request('https://rockbusters.net/api/payments/comgate/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    })
  }

  it('chains pending -> confirmed -> paid on a PAID webhook', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder()
    const uuid = await beginAndGetUuid(order.id, { id: user.id, email: user.email })

    const response = await applyComgateWebhook(
      webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: uuid, status: 'PAID', transId: 'TXN-3' }),
    )
    expect(response.status).toBe(200)

    const refreshedOrder = await payload.findByID({ collection: 'orders', id: order.id, overrideAccess: true })
    expect(refreshedOrder.state).toBe('paid')

    const txn = await payload.find({
      collection: 'transactions', where: { uuid: { equals: uuid } }, overrideAccess: true,
    })
    expect(txn.docs[0].state).toBe('paid')
  })

  it('moves the order to cancelled on a CANCELLED webhook', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder()
    const uuid = await beginAndGetUuid(order.id, { id: user.id, email: user.email })

    await applyComgateWebhook(
      webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: uuid, status: 'CANCELLED' }),
    )
    const refreshedOrder = await payload.findByID({ collection: 'orders', id: order.id, overrideAccess: true })
    expect(refreshedOrder.state).toBe('cancelled')
  })

  it('is idempotent — a duplicate PAID webhook does not re-run the order transition', async () => {
    const payload = await getTestPayload()
    const { user, order } = await seedOrder()
    const uuid = await beginAndGetUuid(order.id, { id: user.id, email: user.email })

    await applyComgateWebhook(webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: uuid, status: 'PAID' }))
    const secondResponse = await applyComgateWebhook(
      webhookRequest({ merchant: 'M123', secret: 's3cr3t', refId: uuid, status: 'PAID' }),
    )
    expect(secondResponse.status).toBe(200)
    const refreshedOrder = await payload.findByID({ collection: 'orders', id: order.id, overrideAccess: true })
    expect(refreshedOrder.state).toBe('paid') // not re-thrown as an invalid same-state transition
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/int/order-payment-service.int.spec.ts`
Expected: FAIL — cannot find module `@/payments/order-payment-service`.

- [ ] **Step 3: Write the service**

```typescript
// src/payments/order-payment-service.ts
/**
 * The only module that reads/writes both `transactions` and `orders`. Wraps
 * ComgateGateway with Payload persistence and owns the order-state chaining
 * that the gateway itself knows nothing about (see docs/superpowers/plans/
 * 2026-08-28-comgate-payment-gateway.md for why pending->paid needs two
 * `payload.update` calls, not one).
 */

import { randomUUID } from 'node:crypto'
import { getPayloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/url'
import { ComgateGateway } from './comgate/gateway'
import { comgateConfigFromEnv } from './comgate/config'
import type { Transaction as GatewayTransaction, TransactionState, PaymentMethod, TransactionStore } from './gateway'

type Currency = 'EUR' | 'CZK'
type OrderState = 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled'

interface OrderDoc {
  id: number
  orderNumber: string
  state: OrderState
  totalPrice: number
  vat: number
  currency: Currency
  user: number | { id: number; email: string }
}

interface TransactionDoc {
  id: number
  uuid: string
  order: number | { id: number }
  amount: number
  amountWithoutVat: number
  currency: Currency
  label: string
  email: string
  state: TransactionState
  paymentMethod: PaymentMethod
  payload: Record<string, unknown> | null
  callbackPayload: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

function toGatewayTransaction(doc: TransactionDoc): GatewayTransaction {
  return {
    id: String(doc.id),
    uuid: doc.uuid,
    money: {
      amount: doc.amount.toFixed(2),
      amountWithoutVat: doc.amountWithoutVat.toFixed(2),
      currency: doc.currency,
    },
    label: doc.label,
    email: doc.email,
    state: doc.state,
    paymentMethod: doc.paymentMethod,
    payload: doc.payload ?? {},
    callbackPayload: doc.callbackPayload,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

class PayloadTransactionStore implements TransactionStore {
  async findByUuid(uuid: string): Promise<GatewayTransaction | null> {
    const cms = await getPayloadClient()
    const { docs } = await cms.find({
      collection: 'transactions', where: { uuid: { equals: uuid } }, limit: 1, overrideAccess: true,
    })
    const doc = docs[0] as TransactionDoc | undefined
    return doc ? toGatewayTransaction(doc) : null
  }

  async findByGatewayTransactionId(gatewayTransactionId: string): Promise<GatewayTransaction | null> {
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

function comgateGateway() {
  return new ComgateGateway({
    ...comgateConfigFromEnv(),
    backendBaseUrl: siteUrl(),
    store: new PayloadTransactionStore(),
  })
}

/**
 * Starts a card payment for `orderId` on behalf of `user`. Creates the
 * transaction record, calls Comgate's begin(), and returns the URL to
 * redirect the payer to. Does not change the order's state — that only
 * happens once the webhook confirms the outcome.
 */
export async function beginComgatePayment(
  orderId: number | string,
  user: { id: number; email: string },
): Promise<{ redirectUrl: string }> {
  const cms = await getPayloadClient()
  const order = (await cms.findByID({
    collection: 'orders', id: orderId, depth: 0, overrideAccess: true,
  })) as OrderDoc

  const ownerId = typeof order.user === 'object' ? order.user.id : order.user
  if (ownerId !== user.id) {
    throw new Error('This order does not belong to you.')
  }
  if (order.state !== 'pending' && order.state !== 'confirmed') {
    throw new Error('This order cannot be paid online.')
  }

  const amountWithoutVat = order.totalPrice / (1 + order.vat / 100)
  const txnDoc = (await cms.create({
    collection: 'transactions',
    data: {
      uuid: randomUUID(),
      order: order.id,
      amount: order.totalPrice,
      amountWithoutVat,
      currency: order.currency,
      label: `Rockbusters ${order.orderNumber}`,
      email: user.email,
      state: 'created',
      paymentMethod: 'comgate-card',
    },
    overrideAccess: true,
  })) as TransactionDoc

  const gateway = comgateGateway()
  const result = await gateway.begin(toGatewayTransaction(txnDoc))

  await cms.update({
    collection: 'transactions',
    id: txnDoc.id,
    data: { state: 'begun', payload: result.payload },
    overrideAccess: true,
  })

  return { redirectUrl: result.redirectUrl }
}

/**
 * Handles an inbound Comgate webhook end to end: verifies + parses it via
 * the gateway, persists the outcome on the transaction, and advances the
 * linked order. Returns the HTTP response Comgate expects.
 */
export async function applyComgateWebhook(request: Request): Promise<Response> {
  const gateway = comgateGateway()
  const result = await gateway.handleWebhook(request)

  const cms = await getPayloadClient()
  const { docs } = await cms.find({
    collection: 'transactions', where: { uuid: { equals: result.transactionUuid } }, limit: 1, overrideAccess: true,
  })
  const txnDoc = docs[0] as TransactionDoc | undefined
  if (!txnDoc) {
    return new Response('Transaction not found', { status: 404 })
  }

  // Already applied (duplicate webhook) — ack without re-running the order transition.
  if (txnDoc.state === result.outcome.state) {
    return new Response(result.acknowledgement.body, { status: result.acknowledgement.status })
  }

  await cms.update({
    collection: 'transactions',
    id: txnDoc.id,
    data: { state: result.outcome.state, callbackPayload: result.outcome.callbackPayload },
    overrideAccess: true,
  })

  const orderId = typeof txnDoc.order === 'object' ? txnDoc.order.id : txnDoc.order
  const order = (await cms.findByID({ collection: 'orders', id: orderId, overrideAccess: true })) as OrderDoc

  if (result.outcome.state === 'paid' && order.state !== 'paid') {
    if (order.state === 'pending') {
      await cms.update({ collection: 'orders', id: orderId, data: { state: 'confirmed' }, overrideAccess: true })
    }
    await cms.update({ collection: 'orders', id: orderId, data: { state: 'paid' }, overrideAccess: true })
  } else if (result.outcome.state === 'cancelled' && order.state !== 'cancelled') {
    await cms.update({ collection: 'orders', id: orderId, data: { state: 'cancelled' }, overrideAccess: true })
  }

  return new Response(result.acknowledgement.body, { status: result.acknowledgement.status })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/int/order-payment-service.int.spec.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/payments/order-payment-service.ts tests/int/order-payment-service.int.spec.ts
git commit -m "feat(payments): add OrderPaymentService (begin + webhook glue)"
```

---

### Task 5: Route handlers

**Files:**
- Create: `src/app/api/payments/comgate/webhook/route.ts`
- Create: `src/app/api/payments/comgate/return/route.ts`

No new tests here — both handlers are one-line wrappers around functions already covered by Task 4's tests (`applyComgateWebhook`) and simple enough to verify by reading (the return handler is a straight lookup + redirect with two guard clauses). Verify manually against the Comgate sandbox before going live (see the "Before going live" checklist at the end of this plan).

- [ ] **Step 1: Webhook route**

```typescript
// src/app/api/payments/comgate/webhook/route.ts
import { applyComgateWebhook } from '@/payments/order-payment-service'

export async function POST(request: Request): Promise<Response> {
  return applyComgateWebhook(request)
}
```

- [ ] **Step 2: Return route**

```typescript
// src/app/api/payments/comgate/return/route.ts
import { getPayloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/url'

export async function GET(request: Request): Promise<Response> {
  const refId = new URL(request.url).searchParams.get('refId')
  if (!refId) {
    return Response.redirect(siteUrl('/'), 302)
  }

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'transactions', where: { uuid: { equals: refId } }, limit: 1, overrideAccess: true,
  })
  const txn = docs[0] as { order: number | { id: number } } | undefined
  if (!txn) {
    return Response.redirect(siteUrl('/'), 302)
  }

  const orderId = typeof txn.order === 'object' ? txn.order.id : txn.order
  return Response.redirect(siteUrl(`/account/orders/${orderId}`), 302)
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors from the two new files.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/payments/comgate/webhook/route.ts src/app/api/payments/comgate/return/route.ts
git commit -m "feat(payments): add Comgate webhook and return routes"
```

---

### Task 6: "Pay by card" on the booking confirmation page

**Files:**
- Create: `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/actions.ts`
- Modify: `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/page.tsx`

- [ ] **Step 1: Write the server action**

```typescript
// src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { beginComgatePayment } from '@/payments/order-payment-service'

export async function payByCardAction(orderId: number): Promise<void> {
  const user = await requireUser()
  const { redirectUrl } = await beginComgatePayment(orderId, { id: user.id, email: user.email })
  redirect(redirectUrl)
}
```

- [ ] **Step 2: Add the button to the confirmation page**

In `src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/page.tsx`, add the import:

```typescript
import { payByCardAction } from './actions'
```

And right after the closing `</div>` of the order-details box (after the `<p><strong>Total:</strong> ...` line, before the final `<p>` with the "View in your account" links), add:

```tsx
      {o.state === 'pending' && (
        <form action={payByCardAction.bind(null, o.id)} style={{ margin: '24px 0' }}>
          <button type="submit">Pay by card</button>
        </form>
      )}
```

- [ ] **Step 3: Manual check**

Run the dev server, book a trip end to end as a test user, and confirm the "Pay by card" button appears on the confirmation page and that submitting it redirects to a Comgate URL (this will fail with real credentials until `COMGATE_MERCHANT`/`COMGATE_SECRET` are set in `.env` — that's expected before Task 7).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/actions.ts" "src/app/(frontend)/book/[eventDateId]/confirmation/[orderId]/page.tsx"
git commit -m "feat(payments): add Pay by card to the booking confirmation page"
```

---

### Task 7: Env vars and docs

**Files:**
- Modify: `.env.example`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add to `.env.example`**

Append after the `RESEND`/email block:

```
# Comgate payment gateway (card payments). Sandbox credentials from the
# Comgate merchant portal; COMGATE_TEST_MODE defaults to sandbox (true)
# unless explicitly set to "false" — never let a missing/mistyped value
# accidentally enable real charges.
COMGATE_MERCHANT=
COMGATE_SECRET=
COMGATE_TEST_MODE=true
```

- [ ] **Step 2: Add to `CLAUDE.md`'s Deployment section**

In the bullet list of required Vercel env vars (right after the `BANK_TRANSFER_DETAILS` line), add:

```markdown
- `COMGATE_MERCHANT` — Comgate merchant ID (from the Comgate merchant portal).
- `COMGATE_SECRET` — Comgate merchant secret, used both to sign requests and to verify inbound webhooks.
- `COMGATE_TEST_MODE` — `true` routes through the Comgate sandbox; set to `false` only once the integration is verified against a live Comgate account. Defaults to `true` if unset.
```

- [ ] **Step 3: Commit**

```bash
git add .env.example CLAUDE.md
git commit -m "docs(payments): document Comgate env vars"
```

---

### Task 8: Full verification

- [ ] **Step 1: Run the full integration suite**

Run: `pnpm run test:int`
Expected: all tests pass, including the 4 new spec files.

- [ ] **Step 2: Typecheck and lint**

```bash
pnpm exec tsc --noEmit
pnpm run lint
```

Expected: no errors.

- [ ] **Step 3: Confirm no accidental prod DB usage**

```bash
grep -n "DATABASE_URL" .env
```

Confirm the host is the `dev` branch, not `ep-weathered-pine-alvc3sdj` (see the database-branches warning in `CLAUDE.md`) — this task didn't touch `.env`, but it's a cheap check before running anything against it.

---

## Before going live (not part of this plan's tasks — flag for the user)

- Get real `COMGATE_MERCHANT`/`COMGATE_SECRET` from the Comgate merchant portal and set them in Vercel (production + preview as appropriate).
- Run one real payment through the **Comgate sandbox** end-to-end (begin → redirect → pay → webhook → order state) before flipping `COMGATE_TEST_MODE` to `false` anywhere.
- Confirm the webhook URL (`https://rockbusters.net/api/payments/comgate/webhook`) is reachable from Comgate's servers on the deployed Vercel domain — no auth/allowlist in front of it.
- The `method: 'ALL'` sent in `begin()` (Task 3) lets Comgate present its own payment-method picker (card + bank transfer) rather than forcing one — confirm this is the desired customer experience with real sandbox screenshots; if a single method should be forced, that's a one-line change to the `method` param, not a redesign.
- Once volume justifies it, revisit the deferred `checkStatus` cron (covers a webhook that never arrives) and `cancel` (refunds) — both were explicitly cut from this plan's scope.
