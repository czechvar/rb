import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

// Lexical rich-text root with one paragraph. Typed loosely; Payload accepts
// the shape and the strict literal types in payload-types.ts make the
// straightforward object form awkward in tests.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const richText = (text: string): any => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', version: 1, text }],
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
})

describe('faqs collection', () => {
  it('creates a global FAQ (no event, no type)', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'faqs',
      data: {
        question: `Global Q ${Date.now()}`,
        answer: richText('A reusable, library-style FAQ.'),
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.event).toBeFalsy()
    expect(doc.program).toBeFalsy()
    expect(doc.position).toBe(0)
    expect(doc.active).toBe(false)
  })

  it('creates an FAQ tied to an event', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state defaulted
    const event = await payload.create({
      collection: 'events',
      data: { title: `FAQ Event ${Date.now()}` },
    })
    const doc = await payload.create({
      collection: 'faqs',
      data: {
        question: `Event Q ${Date.now()}`,
        answer: richText('Answer for this trip.'),
        event: event.id,
        active: true,
      },
    })
    const eventId = typeof doc.event === 'object' ? doc.event?.id : doc.event
    expect(eventId).toBe(event.id)
    expect(doc.active).toBe(true)
  })

  it('creates an FAQ tied to a program (category-level)', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state defaulted
    const program = await payload.create({
      collection: 'programs',
      data: { name: `FAQ Program ${Date.now()}`, active: true },
    })
    const doc = await payload.create({
      collection: 'faqs',
      data: {
        question: `Type Q ${Date.now()}`,
        answer: richText('Answer for this program.'),
        program: program.id,
      },
    })
    const programId = typeof doc.program === 'object' ? doc.program?.id : doc.program
    expect(programId).toBe(program.id)
  })
})
