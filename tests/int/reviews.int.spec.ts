import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('reviews collection', () => {
  it('creates a global review (no event, no type) with defaults', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'reviews',
      data: {
        quote: `It changed how I climb. ${Date.now()}`,
        reviewerName: 'Martin H.',
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.event).toBeFalsy()
    expect(doc.type).toBeFalsy()
    expect(doc.position).toBe(0)
    expect(doc.active).toBe(false)
  })

  it('attaches a review to a specific event', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state defaulted
    const event = await payload.create({
      collection: 'events',
      data: { title: `Review Event ${Date.now()}` },
    })
    const doc = await payload.create({
      collection: 'reviews',
      data: {
        quote: `Best week ever. ${Date.now()}`,
        reviewerName: 'Sophie R.',
        reviewerLocation: 'UK',
        resultLine: '7a → 7b+ in one week',
        event: event.id,
        active: true,
      },
    })
    const eventId = typeof doc.event === 'object' ? doc.event?.id : doc.event
    expect(eventId).toBe(event.id)
    expect(doc.reviewerLocation).toBe('UK')
    expect(doc.resultLine).toContain('7a')
  })

  it('attaches a review to a type (category-level)', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state defaulted
    const type = await payload.create({
      collection: 'types',
      data: { name: `Review Type ${Date.now()}`, active: true },
    })
    const doc = await payload.create({
      collection: 'reviews',
      data: {
        quote: `Whole program is a gem. ${Date.now()}`,
        reviewerName: 'Tomáš K.',
        type: type.id,
      },
    })
    const typeId = typeof doc.type === 'object' ? doc.type?.id : doc.type
    expect(typeId).toBe(type.id)
  })
})
