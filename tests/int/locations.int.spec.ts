import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('locations collection', () => {
  it('creates a location with coordinates', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug is auto-filled by the slugField beforeValidate hook
    const doc = await payload.create({
      collection: 'locations',
      data: {
        name: `Kalymnos ${Date.now()}`,
        city: 'Kalymnos',
        country: 'Greece',
        coordinates: [26.98, 36.95],
        active: true,
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^kalymnos-/)
    expect(doc.active).toBe(true)
    expect(doc.coordinates).toEqual([26.98, 36.95])
  })
})
