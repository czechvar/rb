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
