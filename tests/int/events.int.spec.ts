import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('events collection', () => {
  it('creates an event with default draft state and auto slug', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state is intentionally omitted to verify the collection's defaultValue
    const doc = await payload.create({
      collection: 'events',
      data: {
        title: `Multi-Pitch Course ${Date.now()}`,
        shortDescription: 'Learn multi-pitch climbing.',
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^multi-pitch-course-/)
    expect(doc.state).toBe('draft')
    expect(doc.featured).toBe(false)
  })
})
