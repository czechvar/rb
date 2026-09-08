/**
 * The single place a gateway outcome is turned into order + transaction
 * state. Comgate reaches it from a webhook, Benefit+ from a status poll —
 * the chaining, the idempotency, and the write ordering are identical, and
 * subtle enough that they must not be duplicated.
 */

import type { Payload } from 'payload'
import { getPayloadClient } from '@/lib/payload'
import { isTerminalState, type OrderState } from '@/collections/orders/state-machine'
import type { PaymentOutcome } from './gateway'
import type { OrderDoc, TransactionDoc } from './transaction-store'

/**
 * The single legal next step from `current` toward `target` (or `null` if
 * `current` already IS `target`, or `current` is terminal and can't move any
 * further). `target` is always one of the two terminal outcomes
 * `applyOutcome` ever drives the order toward — `paid` goes through
 * `confirmed` first when starting from `pending`, `cancelled` is one hop from
 * anywhere non-terminal.
 */
function nextStepToward(current: OrderState, target: 'paid' | 'cancelled'): OrderState | null {
  if (current === target) return null
  // A terminal order (`completed` or `cancelled`) never moves again. For
  // target `cancelled` this just means an already-`completed` order is left
  // alone. For target `paid` it covers both: an already-`completed` order is
  // left alone (it's already past `paid` — see the note in applyOutcome), and
  // an already-`cancelled` order is left alone too, but the caller must treat
  // that second case as loud, not silent — see `advanceOrderToward`.
  if (isTerminalState(current)) return null
  if (target === 'cancelled') return 'cancelled'
  // target === 'paid'
  if (current === 'pending') return 'confirmed'
  if (current === 'confirmed') return 'paid'
  return null
}

/**
 * A `paid` outcome resolved against an order that is already `cancelled`:
 * the money genuinely arrived, but there is no live order left to advance.
 * This is never silent — a human needs to see it and decide whether to
 * refund the payment or reinstate the order. It is not thrown, because both
 * callers that can reach this (the Comgate webhook, the Benefit+ cron sweep)
 * would treat a throw as "retry me", and no retry ever succeeds: the order
 * stays terminal forever, so retrying only turns this into a permanent
 * Comgate webhook retry loop or a transaction re-checked every cron tick.
 */
function warnPaidOutcomeOnCancelledOrder(orderId: number, txnUuid: string): void {
  console.error(
    `[payments] transaction ${txnUuid} resolved as 'paid' but order ${orderId} is already ` +
      `'cancelled' — the payment succeeded against a dead order. This will not self-heal; a ` +
      `human must reconcile it (refund the payment or reinstate the order).`,
  )
}

/**
 * Advance the order at `orderId` toward `target`, one legal step at a time,
 * re-reading the order before each step so the step is always computed from
 * current truth rather than a snapshot that may be stale by the time it's
 * used. At most two iterations are ever needed (`pending -> confirmed ->
 * paid` is the longest chain `applyOutcome` drives).
 *
 * Each write is wrapped so that if it's refused (a concurrent caller — the
 * cron sweep and the payer's return hitting at once, say — already advanced
 * the order past the step we're attempting), we re-read the order: if it has
 * already reached `target`, that concurrent caller did the work and this call
 * returns quietly. If instead the order turns out to be terminal (dead)
 * without having reached `target`, that's the same dead-order case
 * `nextStepToward` reports at the top of the loop, and gets the same
 * treatment — warn (for `paid`) and return, never rethrow. Any other state
 * after the failed write is a genuine error and gets rethrown. This is
 * decided from the re-read state, never by matching on the error message.
 */
async function advanceOrderToward(
  cms: Payload,
  orderId: number,
  target: 'paid' | 'cancelled',
  txnUuid: string,
): Promise<void> {
  for (let i = 0; i < 2; i++) {
    const order = (await cms.findByID({
      collection: 'orders',
      id: orderId,
      overrideAccess: true,
    })) as OrderDoc

    const next = nextStepToward(order.state, target)
    if (!next) {
      if (target === 'paid' && order.state === 'cancelled') {
        warnPaidOutcomeOnCancelledOrder(orderId, txnUuid)
      }
      return
    }

    try {
      await cms.update({
        collection: 'orders',
        id: orderId,
        data: { state: next },
        overrideAccess: true,
      })
    } catch (err) {
      const current = (await cms.findByID({
        collection: 'orders',
        id: orderId,
        overrideAccess: true,
      })) as OrderDoc
      if (current.state === target) return
      if (isTerminalState(current.state)) {
        if (target === 'paid' && current.state === 'cancelled') {
          warnPaidOutcomeOnCancelledOrder(orderId, txnUuid)
        }
        return
      }
      throw err
    }
  }
}

export async function applyOutcome(
  txnDoc: TransactionDoc,
  outcome: PaymentOutcome,
): Promise<void> {
  const cms = await getPayloadClient()

  // `txnDoc` is a snapshot the caller fetched, possibly well before this call
  // (e.g. across a slow gateway.checkStatus() round trip) — by now another
  // caller (the return URL vs. the cron sweep) may have already applied this
  // exact outcome. Re-read the transaction's authoritative current state
  // rather than trusting the stale snapshot for this decision; this narrows,
  // but does not close, the race — two callers can still interleave between
  // this fresh read and their writes below (closing that fully needs
  // locking, which is out of scope here).
  const freshTxnDoc = await cms.findByID({
    collection: 'transactions',
    id: txnDoc.id,
    overrideAccess: true,
  })
  const currentTxnState = (freshTxnDoc as { state?: TransactionDoc['state'] } | null)?.state

  // Already applied (duplicate webhook, or a poll racing the return URL) —
  // return without re-running the order transition.
  if (currentTxnState === outcome.state || txnDoc.state === outcome.state) return

  // Apply the order-state transition(s) BEFORE marking the transaction terminal
  // (see below) — if this throws (e.g. the order was independently cancelled
  // between begin() and now, making the transition invalid), the transaction
  // stays in `begun`/`pending-payment`, so a retry will not short-circuit on the
  // idempotency check above and will retry the order chain.
  const orderId = typeof txnDoc.order === 'object' ? txnDoc.order.id : txnDoc.order

  if (outcome.state === 'paid') {
    // Deliberate behaviour change: if the order is already `completed`, this
    // is now a quiet no-op rather than an attempted (and rejected)
    // `completed -> paid` write — a `completed` order is simply past the
    // point `paid` outcomes have anything to say about. If the order is
    // already `cancelled`, though, this is not quiet — see
    // `warnPaidOutcomeOnCancelledOrder`.
    await advanceOrderToward(cms, orderId, 'paid', txnDoc.uuid)
  } else if (outcome.state === 'cancelled') {
    await advanceOrderToward(cms, orderId, 'cancelled', txnDoc.uuid)
  }
  // `failed` deliberately leaves the order alone: it stays `pending`, so both
  // pay buttons remain live and the customer can retry with either method.

  // Persisted last: if this write fails after the order already transitioned,
  // that's self-healing too — the order-update above is idempotently skipped as
  // already-applied on the next attempt, and the transaction gets marked
  // correctly then. This write is unconditional even in the dead-order case
  // above (a `paid` outcome against a `cancelled` order): the money genuinely
  // arrived, so the transaction record must say `paid` regardless of what the
  // order could do with that fact — the loud warning above is what flags it
  // for a human, not withholding this write.
  await cms.update({
    collection: 'transactions',
    id: txnDoc.id,
    data: { state: outcome.state, callbackPayload: outcome.callbackPayload },
    overrideAccess: true,
  })
}
