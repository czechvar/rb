import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('difficulty and type collections', () => {
  it('creates a difficulty', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'difficulties',
      data: { name: `Beginner ${Date.now()}`, active: true },
    })
    expect(doc.id).toBeDefined()
  })

  it('creates a type', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'types',
      data: { name: `Multi-pitch ${Date.now()}`, active: true },
    })
    expect(doc.id).toBeDefined()
  })
})
