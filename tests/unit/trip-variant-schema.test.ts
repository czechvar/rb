import { describe, expect, it, vi } from 'vitest'
import { EventDates } from '@/collections/EventDates'
import { TripVariants } from '@/collections/TripVariants'
import { protectOccurrenceIdentity } from '@/collections/hooks/occurrenceIdentity'
import { protectTripVariantIdentity } from '@/collections/hooks/tripVariantIdentity'
import { derivePublicDateKey } from '@/lib/occurrence-routing'

const field = (name: string) => EventDates.fields.find((candidate) => 'name' in candidate && candidate.name === name)
const variantField = (name: string) => TripVariants.fields.find((candidate) => 'name' in candidate && candidate.name === name)

const request = (variant: { id: number; event: number | { id: number } }) => {
  const execute = vi.fn().mockResolvedValue(undefined)
  return {
    transactionID: Promise.resolve('fixture'),
    payload: {
      db: { sessions: { fixture: { db: { execute } } } },
      findByID: vi.fn().mockResolvedValue(variant),
      find: vi.fn().mockResolvedValue({ totalDocs: 0, docs: [] }),
    },
  }
}

describe('Trip Variant schema', () => {
  it('registers additive ownership fields without replacing Event Date data', () => {
    expect(TripVariants.slug).toBe('trip-variants')
    expect(variantField('event')).toMatchObject({ type: 'relationship', relationTo: 'events', required: true })
    expect(variantField('title')).toMatchObject({ type: 'text', required: true })
    expect(variantField('slug')).toMatchObject({ type: 'text', required: true, index: true })
    expect(variantField('locations')).toMatchObject({ type: 'relationship', relationTo: 'locations', hasMany: true })
    expect(variantField('editorial')).toMatchObject({ type: 'group' })
    expect(variantField('extraContent')).toMatchObject({ type: 'richText' })
    expect(variantField('logisticsOverrides')).toMatchObject({ type: 'group' })
    expect(field('tripVariant')).toMatchObject({ type: 'relationship', relationTo: 'trip-variants', index: true })
    expect(field('publicDateKey')).toMatchObject({ type: 'text', index: true })
    expect(field('price')).toBeDefined()
    expect(field('editorial')).toBeDefined()
  })

  it('derives a UTC start-to-end key', () => {
    expect(derivePublicDateKey('2026-09-26T23:30:00-02:00', '2026-10-10T01:00:00Z')).toBe(
      '2026-09-27-to-2026-10-10',
    )
  })

  it('accepts numeric relationships, verifies their parent, and stores the public key', async () => {
    const req = request({ id: 9, event: 4 })
    const data = {
      event: 4,
      tripVariant: 9,
      slug: 'kalymnos-2026-09-26',
      dateFrom: '2026-09-26T00:00:00.000Z',
      dateTo: '2026-10-03T00:00:00.000Z',
    }
    await protectOccurrenceIdentity({ data, operation: 'create', req } as never)
    expect(data).toMatchObject({ publicDateKey: '2026-09-26-to-2026-10-03' })
    expect(req.payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'trip-variants', id: 9 }))
  })

  it('accepts a populated matching variant and rejects a populated wrong-parent variant', async () => {
    const matchingReq = request({ id: 9, event: 4 })
    await protectOccurrenceIdentity({
      data: {
        event: { id: 4 },
        tripVariant: { id: 9, event: { id: 4 } },
        slug: 'kalymnos-2026-09-26',
        dateFrom: '2026-09-26T00:00:00.000Z',
        dateTo: '2026-10-03T00:00:00.000Z',
      },
      operation: 'create',
      req: matchingReq,
    } as never)
    expect(matchingReq.payload.findByID).not.toHaveBeenCalled()

    await expect(protectOccurrenceIdentity({
      data: {
        event: { id: 4 },
        tripVariant: { id: 10, event: { id: 5 } },
        slug: 'rodellar-2026-09-26',
        dateFrom: '2026-09-26T00:00:00.000Z',
        dateTo: '2026-10-03T00:00:00.000Z',
      },
      operation: 'create',
      req: request({ id: 10, event: 5 }),
    } as never)).rejects.toThrow()
  })

  it('prevents moving a variant to another Event after an Event Date references it', async () => {
    const req = request({ id: 9, event: 4 })
    req.payload.find.mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 20 }] })
    await expect(protectTripVariantIdentity({
      data: { event: 5, title: 'Kalymnos', slug: 'kalymnos' },
      operation: 'update',
      originalDoc: { id: 9, event: 4, slug: 'kalymnos' },
      req,
    } as never)).rejects.toThrow()
    expect(req.payload.find).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'event-dates',
      where: { tripVariant: { equals: 9 } },
    }))
  })
})
