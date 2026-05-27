import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('airports collection', () => {
  it('creates an airport', async () => {
    const payload = await getTestPayload()
    // iata is unique, so suffix the timestamp to avoid cross-run collisions
    const iata = `X${Date.now()}`
    const doc = await payload.create({
      collection: 'airports',
      data: {
        name: `Kos Island ${Date.now()}`,
        iata,
        country: 'Greece',
        continent: 'Europe',
        coordinates: [27.09, 36.79],
        size: 3,
        active: true,
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.iata).toBe(iata)
    expect(doc.active).toBe(true)
    expect(doc.coordinates).toEqual([27.09, 36.79])
  })
})
