import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('difficulty and type collections', () => {
  it('creates a difficulty', async () => {
    const payload = await getTestPayload()
    const name = `Beginner ${Date.now()}`
    const doc = await payload.create({
      collection: 'difficulties',
      data: { name, active: true },
    })
    expect(doc.id).toBeDefined()
    expect(doc.name).toBe(name)
    expect(doc.active).toBe(true)
  })

  it('creates a program', async () => {
    const payload = await getTestPayload()
    const name = `Multi-pitch ${Date.now()}`
    // @ts-expect-error state is intentionally omitted to verify the collection's defaultValue
    const doc = await payload.create({
      collection: 'programs',
      data: { name, active: true },
    })
    expect(doc.id).toBeDefined()
    expect(doc.name).toBe(name)
    expect(doc.active).toBe(true)
  })
})
