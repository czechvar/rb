import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('event-dates collection', () => {
  it('creates an event date linked to an event', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug is auto-filled by the slugField beforeValidate hook
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
        logisticsOverrides: {
          accommodation: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  version: 1,
                  children: [{ type: 'text', version: 1, text: 'Shared rooms in a local hostel.' }],
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
        },
        active: true,
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.capacity).toBe(12)
    expect(doc.active).toBe(true)
    // event relationship round-trips (Payload returns the id at depth 0)
    const eventRef = typeof doc.event === 'object' ? doc.event.id : doc.event
    expect(eventRef).toBe(event.id)
    // minParticipants defaults to 0
    expect(doc.minParticipants).toBe(0)
    expect(doc.logisticsOverrides?.accommodation).toBeDefined()
  })
})
