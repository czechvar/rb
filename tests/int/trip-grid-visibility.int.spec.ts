import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Event } from '@/payload-types'

const { payload } = vi.hoisted(() => ({
  payload: {
    find: vi.fn(),
    findByID: vi.fn(),
  },
}))

vi.mock('@/lib/payload', () => ({
  getPayloadClient: vi.fn(async () => payload),
}))

import { resolveTripGridEvents } from '@/lib/block-resolvers/trip-grid'

const currentEvent = event({ id: 1, title: 'Current Trip' })
const pastEvent = event({ id: 2, title: 'Past Trip' })

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-02T15:30:00.000Z'))
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('trip-grid public event visibility', () => {
  it('filters manual event selections to events with upcoming active dates', async () => {
    payload.find.mockResolvedValueOnce({
      docs: [{ event: currentEvent.id }],
    })

    const events = await resolveTripGridEvents({
      source: 'manual',
      events: [currentEvent, pastEvent],
      limit: 10,
    })

    expect(events.map((item) => item.id)).toEqual([currentEvent.id])
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'event-dates',
        where: {
          and: [
            { event: { in: [currentEvent.id, pastEvent.id] } },
            { active: { equals: true } },
            { dateFrom: { greater_than_equal: '2026-09-02T00:00:00.000Z' } },
          ],
        },
      }),
    )
  })

  it('loads upcoming event dates deeply enough for trip card media', async () => {
    payload.find.mockResolvedValueOnce({
      docs: [
        {
          event: currentEvent,
        },
      ],
    })

    const events = await resolveTripGridEvents({
      source: 'upcoming',
      limit: 3,
    })

    expect(events.map((item) => item.id)).toEqual([currentEvent.id])
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'event-dates',
        depth: 2,
      }),
    )
  })
})

function event(input: { id: number; title: string }): Event {
  return {
    id: input.id,
    title: input.title,
    slug: input.title.toLowerCase().replaceAll(' ', '-'),
    state: 'published',
    updatedAt: '2026-09-02T00:00:00.000Z',
    createdAt: '2026-09-02T00:00:00.000Z',
  } as Event
}
