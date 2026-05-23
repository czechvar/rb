import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('partners collection', () => {
  it('creates a partner and auto-fills the slug', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'partners',
      data: {
        name: `Climbing Co ${Date.now()}`,
        link: 'https://example.com',
        featured: true,
        active: true,
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^climbing-co-/)
    expect(doc.featured).toBe(true)
    expect(doc.active).toBe(true)
  })
})
