import { describe, expect, it, vi } from 'vitest'
import type { EventDate } from '@/payload-types'
import { getTripDetailEventDates } from '@/lib/queries'

const { find, cachedQuery } = vi.hoisted(() => ({ find: vi.fn(), cachedQuery: vi.fn() }))
// Never initialize Payload or load database/environment configuration.
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ find }) }))
vi.mock('@/lib/cache', () => ({ cachedQuery, TAGS: {} }))

const date = (id: number, capacity: number, bookedSeats?: number, remainingSeats?: number): EventDate => ({
  id, event: 10, dateFrom: '2999-10-12T00:00:00.000Z', dateTo: '2999-10-19T00:00:00.000Z',
  price: 1150, vat: 0, currency: 'EUR', capacity, bookedSeats, remainingSeats,
  active: true, createdAt: '', updatedAt: '',
})

describe('trip occurrence query availability', () => {
  it('recomputes remaining seats after all field hooks finish and clamps oversold capacity', async () => {
    // The virtual remainingSeats hook can run before bookedSeats finishes.
    // Completed documents may therefore still carry the original capacity.
    const docs = [date(1, 8, 3, 8), date(2, 4, 4, 4), date(3, 4, 6, 4), date(4, 0), date(5, 5)]
    const before = structuredClone(docs)
    find.mockResolvedValueOnce({ docs })
    const result = await getTripDetailEventDates(10)
    expect(result.map(item => item.remainingSeats)).toEqual([5, 0, 0, 0, 5])
    expect(docs).toEqual(before)
    expect(result[0].bookedSeats).toBe(3)
    expect(cachedQuery).not.toHaveBeenCalled()
    expect(find).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'event-dates',
      select: expect.objectContaining({ capacity: true, bookedSeats: true }),
    }))
  })
})
