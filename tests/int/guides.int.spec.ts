import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('guides collection', () => {
  it('creates a guide and auto-fills the slug', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug is auto-filled by the slugField beforeValidate hook
    const doc = await payload.create({
      collection: 'guides',
      data: { name: `Jane Doe ${Date.now()}`, email: 'jane@example.com', active: true },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^jane-doe-/)
    expect(doc.active).toBe(true)
    expect(doc.featured).toBe(false)
  })
})
