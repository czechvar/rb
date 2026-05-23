import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('airports collection', () => {
  it('creates an airport', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'airports',
      data: {
        name: `Kos Island ${Date.now()}`,
        iata: 'KGS',
        country: 'Greece',
        continent: 'Europe',
        coordinates: [27.09, 36.79],
        size: 3,
        active: true,
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.iata).toBe('KGS')
    expect(doc.active).toBe(true)
  })
})
