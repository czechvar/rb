import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventDate } from '@/payload-types'
import { getPublicEventDatesForEvent, getPublicOccurrenceBySlugs, getTripDetailEventDates } from '@/lib/queries'
import {
  deriveOccurrenceSlug,
  normalizeOccurrenceSlug,
  tripOccurrencePath,
} from '@/lib/occurrence-routing'

const { find, cachedQuery } = vi.hoisted(() => ({ find: vi.fn(), cachedQuery: vi.fn() }))
// Never initialize Payload or load database/environment configuration.
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ find }) }))
vi.mock('@/lib/cache', () => ({ cachedQuery, TAGS: {} }))

beforeEach(() => {
  find.mockReset()
  cachedQuery.mockReset()
})

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

  it('loads all active public occurrences without a date floor or long-lived cache', async () => {
    find.mockResolvedValueOnce({ docs: [
      { ...date(1, 8, 3), slug: 'past-date', dateFrom: '2000-10-12T00:00:00.000Z', dateTo: '2000-10-19T00:00:00.000Z' },
    ] })

    const result = await getPublicEventDatesForEvent(10)

    expect(result[0]).toMatchObject({ slug: 'past-date', remainingSeats: 5 })
    expect(find).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'event-dates',
      where: { and: [{ event: { equals: 10 } }, { active: { equals: true } }] },
      sort: 'dateFrom',
      limit: 1000,
    }))
    expect(cachedQuery).not.toHaveBeenCalled()
  })
})

describe('public occurrence identity', () => {
  it('derives one stable path segment from the selected Location slug and UTC calendar date', () => {
    expect(deriveOccurrenceSlug('El Chorro', '2027-01-31T23:30:00.000-02:00')).toBe(
      'el-chorro-2027-02-01',
    )
  })

  it('normalizes an explicit editorial qualifier and builds its public URL', () => {
    expect(normalizeOccurrenceSlug(' Kalymnos 2027-10-12 Advanced ')).toBe(
      'kalymnos-2027-10-12-advanced',
    )
    expect(tripOccurrencePath('europe-rock-trip', 'kalymnos-2027-10-12-advanced')).toBe(
      '/trips/europe-rock-trip/kalymnos-2027-10-12-advanced',
    )
  })

  it('rejects empty or malformed public path inputs', () => {
    expect(() => deriveOccurrenceSlug('', '2027-10-12T00:00:00.000Z')).toThrow()
    expect(() => deriveOccurrenceSlug('kalymnos', 'not-a-date')).toThrow()
    expect(() => tripOccurrencePath('', 'kalymnos-2027-10-12')).toThrow()
  })

  it.each(['dates', 'faq', 'logistics'])('reserves the legacy trip subroute slug %s', (slug) => {
    expect(() => tripOccurrencePath('europe-rock-trip', slug)).toThrow(/reserved/i)
  })
})

describe('public occurrence resolver', () => {
  it('requires a published parent and an active occurrence under that exact parent', async () => {
    const event = { id: 10, slug: 'europe-trip', state: 'published' }
    const occurrence = { ...date(77, 8, 2, 6), slug: 'kalymnos-2999-10-12' }
    find.mockResolvedValueOnce({ docs: [event] }).mockResolvedValueOnce({ docs: [occurrence] })

    await expect(getPublicOccurrenceBySlugs(event.slug, occurrence.slug)).resolves.toEqual({
      event,
      occurrence: { ...occurrence, remainingSeats: 6 },
      canonicalPath: '/trips/europe-trip/kalymnos-2999-10-12',
      requestedAlias: false,
    })
    expect(find.mock.calls[0][0].where).toEqual({
      and: [{ slug: { equals: event.slug } }, { state: { equals: 'published' } }],
    })
    expect(find.mock.calls[1][0].where).toEqual({
      and: [
        { event: { equals: event.id } },
        { active: { equals: true } },
        { or: [{ slug: { equals: occurrence.slug } }, { 'slugAliases.slug': { equals: occurrence.slug } }] },
      ],
    })
  })

  it('marks an old alias for a direct redirect and returns null for an unknown parent', async () => {
    const event = { id: 10, slug: 'europe-trip', state: 'published' }
    const occurrence = { ...date(77, 8), slug: 'kalymnos-final', slugAliases: [{ slug: 'kalymnos-old' }] }
    find.mockResolvedValueOnce({ docs: [event] }).mockResolvedValueOnce({ docs: [occurrence] })
    await expect(getPublicOccurrenceBySlugs(event.slug, 'kalymnos-old')).resolves.toMatchObject({
      canonicalPath: '/trips/europe-trip/kalymnos-final',
      requestedAlias: true,
    })
    find.mockResolvedValueOnce({ docs: [] })
    await expect(getPublicOccurrenceBySlugs('unknown', 'kalymnos-old')).resolves.toBeNull()
  })
})
