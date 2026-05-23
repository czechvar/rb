import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('categories collection', () => {
  it('creates a category and auto-fills the slug', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'categories',
      data: { name: `Sport Climbing ${Date.now()}`, active: true },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^sport-climbing-/)
    expect(doc.active).toBe(true)
    expect(doc.position).toBe(0)
  })
})
