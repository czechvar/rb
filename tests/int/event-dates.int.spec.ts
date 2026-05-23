import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('event-dates collection', () => {
  it('creates an event date linked to an event', async () => {
    const payload = await getTestPayload()
    const event = await payload.create({
      collection: 'events',
      data: { title: `Parent Event ${Date.now()}` },
    })
    const doc = await payload.create({
      collection: 'event-dates',
      data: {
        event: event.id,
        dateFrom: '2026-07-01T08:00:00.000Z',
        dateTo: '2026-07-05T16:00:00.000Z',
        price: 499,
        vat: 21,
        currency: 'EUR',
        capacity: 12,
        active: true,
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.capacity).toBe(12)
    expect(doc.active).toBe(true)
  })
})
