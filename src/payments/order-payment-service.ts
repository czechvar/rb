/**
 * The public entry points for taking a payment. Wraps both gateways with
 * Payload persistence: ComgateGateway for card payments and MuzaPayGateway
 * for Benefit+.
 *
 * The two differ in how an outcome arrives, and that shapes this file.
 * Comgate confirms by webhook, so `applyComgateWebhook` is the whole story.
 * Benefit+ sends no webhook, so its outcome is polled from a status endpoint
 * by two callers that overlap by design — `resolveBenefitPlusPayment` from
 * the payer's return URL, and `sweepBenefitPlusPayments` from a cron sweep
 * for payers who never came back.
 *
 * Both paths converge on `applyOutcome` (src/payments/order-transitions.ts),
 * which owns the order-state chaining the gateways know nothing about — see
 * docs/superpowers/plans/2026-08-28-comgate-payment-gateway.md for why
 * pending->paid needs two `payload.update` calls, not one, and
 * docs/superpowers/specs/2026-09-02-benefit-plus-gateway-design.md for the
 * Benefit+ polling design.
 */

import { randomUUID } from 'node:crypto'
import { getPayloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/url'
import { ComgateGateway } from './comgate/gateway'
import { comgateConfigFromEnv } from './comgate/config'
import { MuzaPayGateway } from './muzapay/gateway'
import { muzapayConfigFromEnv } from './muzapay/config'
import {
  PayloadTransactionStore,
  toGatewayTransaction,
  type OrderDoc,
  type TransactionDoc,
} from './transaction-store'
import { applyOutcome } from './order-transitions'

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
    collection: 'orders',
    id: orderId,
    depth: 0,
    overrideAccess: true,
  })) as OrderDoc

  const ownerId = typeof order.user === 'object' ? order.user.id : order.user
  if (ownerId !== user.id) {
    throw new Error('This order does not belong to you.')
  }
  if (order.state !== 'pending' && order.state !== 'confirmed') {
    throw new Error('This order cannot be paid online.')
  }

  // Rounded to 2dp before persisting — this is a stored financial field (shown in
  // admin, exported for accounting), not just an intermediate value, so it must not
  // carry raw floating-point noise the way an unrounded division would.
  const amountWithoutVat = Math.round((order.totalPrice / (1 + order.vat / 100)) * 100) / 100
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

function benefitPlusGateway() {
  return new MuzaPayGateway({
    ...muzapayConfigFromEnv(),
    backendBaseUrl: siteUrl(),
    store: new PayloadTransactionStore(),
  })
}

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

/**
 * How long a payment may sit `begun` before the sweep tries to cancel it.
 *
 * Deliberately independent of how often the sweep runs: on the Vercel Hobby
 * plan the cron fires once a day, so the first pass to see an abandoned
 * payment is already far past this threshold and cancels on that pass. On a
 * ten-minute schedule (Vercel Pro) the same threshold instead gives the payer
 * a full hour to finish before anything tries to cancel on them.
 */
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
      // states. Their "at most three attempts at progressive intervals" comes
      // from successive cron passes rather than a retry loop here — which
      // means three days apart on the daily Hobby schedule, and thirty minutes
      // apart on Pro. Either satisfies "progressive"; neither hammers them.
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

/**
 * Handles an inbound Comgate webhook end to end: verifies + parses it via
 * the gateway, persists the outcome on the transaction, and advances the
 * linked order. Returns the HTTP response Comgate expects.
 */
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
