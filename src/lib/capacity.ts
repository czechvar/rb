import type { PayloadRequest } from 'payload'
import { getPayloadClient } from './payload'

interface Options {
  req?: PayloadRequest
}

/**
 * Returns the seats still available for `eventDateId`. Sums `participantCount`
 * over orders in non-terminal states (pending, confirmed, paid) and subtracts
 * from the event-date capacity. Pass `req` to share the caller's Payload
 * transaction (required when called from a beforeChange hook).
 */
export async function getRemainingCapacity(
  eventDateId: number | string,
  opts: Options = {},
): Promise<number> {
  const payload = opts.req?.payload ?? (await getPayloadClient())
  const eventDate = await payload.findByID({
    collection: 'event-dates',
    id: eventDateId,
    depth: 0,
    req: opts.req,
  })
  const capacity = (eventDate as { capacity: number }).capacity ?? 0
  const taken = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { eventDate: { equals: eventDateId } },
        { state: { in: ['pending', 'confirmed', 'paid'] } },
      ],
    },
    limit: 10_000,
    depth: 0,
    req: opts.req,
  })
  const used = taken.docs.reduce(
    (sum, o) => sum + ((o as { participantCount?: number }).participantCount ?? 0),
    0,
  )
  return Math.max(0, capacity - used)
}
