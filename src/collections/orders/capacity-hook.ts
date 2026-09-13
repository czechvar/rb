import type { CollectionBeforeChangeHook } from 'payload'
import { lockEventDates } from '../../lib/checkout/transaction'
import { getRemainingCapacity } from '../../lib/capacity'

/**
 * Capacity check on create only. State changes after create never increase the
 * counted-against-capacity total (the matrix doesn't allow it), so capacity is
 * only at risk at the moment of insert.
 *
 * Concurrency: two simultaneous creates for the last seat would race. We take a
 * Postgres transaction-scoped advisory lock keyed on the eventDate id, which
 * serializes all booking creates for the same event-date. The lock auto-releases
 * at transaction end (commit OR rollback).
 */
export const capacityCheck: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data) return data
  const eventDateId = (data as { eventDate?: number | string }).eventDate
  const participantCount = (data as { participantCount?: number }).participantCount ?? 0
  if (!eventDateId || participantCount <= 0) return data

  await lockEventDates(req, [Number(eventDateId)])

  const remaining = await getRemainingCapacity(eventDateId, { req })
  if (participantCount > remaining) {
    throw new Error(
      `Sold out: ${participantCount} seat(s) requested but only ${remaining} remaining for this date.`,
    )
  }
  return data
}
