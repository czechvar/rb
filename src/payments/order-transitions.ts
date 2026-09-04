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
 * `current` already IS `target`). `target` is always one of the two terminal
 * outcomes `applyOutcome` ever drives the order toward — `paid` goes through
 * `confirmed` first when starting from `pending`, `cancelled` is one hop from
 * anywhere non-terminal.
 */
function nextStepToward(current: OrderState, target: 'paid' | 'cancelled'): OrderState | null {
  if (current === target) return null
  if (target === 'cancelled') return isTerminalState(current) ? null : 'cancelled'
  // target === 'paid'. An order already past `paid` (i.e. `completed`) is
  // left alone rather than driven backwards — see the note in applyOutcome.
  if (current === 'pending') return 'confirmed'
  if (current === 'confirmed') return 'paid'
  return null
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
 * returns quietly. Any other state after the failed write is a genuine error
 * and gets rethrown. This is decided from the re-read state, never by
 * matching on the error message.
 */
async function advanceOrderToward(
  cms: Payload,
  orderId: number,
  target: 'paid' | 'cancelled',
): Promise<void> {
  for (let i = 0; i < 2; i++) {
    const order = (await cms.findByID({
      collection: 'orders',
      id: orderId,
      overrideAccess: true,
    })) as OrderDoc

    const next = nextStepToward(order.state, target)
    if (!next) return

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
      throw err
    }
  }
}

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

  if (outcome.state === 'paid') {
    // Deliberate behaviour change: if the order is already `completed`, this
    // is now a quiet no-op rather than an attempted (and rejected)
    // `completed -> paid` write — a `completed` order is simply past the
    // point `paid` outcomes have anything to say about.
    await advanceOrderToward(cms, orderId, 'paid')
  } else if (outcome.state === 'cancelled') {
    await advanceOrderToward(cms, orderId, 'cancelled')
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
