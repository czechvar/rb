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

// OrderDoc/TransactionDoc below are hand-narrowed subsets of the generated Payload
// types, not a verified 1:1 mirror of payload-types.ts — e.g. `orderNumber` is
// treated as always-present because `allocateOrderNumber` sets it on create, and
// `payload`/`callbackPayload` are narrowed to object-only because nothing but this
// file ever writes them.
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
  // If gateway.begin() below throws, this `created`-state row is left behind as
  // harmless orphaned debris — no cleanup implemented, accepted tradeoff for this MVP.
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

  // Apply the order-state transition(s) BEFORE marking the transaction terminal
  // (see below) — if this throws (e.g. the order was independently cancelled
  // between begin() and this webhook, making the transition invalid), the
  // transaction stays in `begun`/`pending-payment`, so a webhook retry will not
  // short-circuit on the idempotency check above and will retry the order chain.
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

  // Persisted last: if this write fails after the order already transitioned,
  // that's self-healing too — the order-update above is idempotently skipped as
  // already-applied on the next webhook attempt, and the transaction gets marked
  // correctly then.
  await cms.update({
    collection: 'transactions',
    id: txnDoc.id,
    data: { state: result.outcome.state, callbackPayload: result.outcome.callbackPayload },
    overrideAccess: true,
  })

  return new Response(result.acknowledgement.body, { status: result.acknowledgement.status })
}
