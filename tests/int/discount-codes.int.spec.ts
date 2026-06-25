import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

const uniq = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}`

describe('discount-codes collection', () => {
  it('creates a code with required fields and snapshots them', async () => {
    const payload = await getTestPayload()
    const raw = uniq('spring').toLowerCase()
    const code = await payload.create({
      collection: 'discount-codes',
      data: {
        code: raw,
        title: 'Spring 25',
        discountPercent: 25,
        validFrom: '2026-03-01',
        validUntil: '2026-05-31',
        commissionPercent: 10,
      } as never,
      overrideAccess: true,
    })
    expect(code.code).toBe(raw.toUpperCase()) // normalized uppercase
    expect(code.discountPercent).toBe(25)
    expect(code.active).toBe(true)
  })

  it('rejects discountPercent outside 1..99', async () => {
    const payload = await getTestPayload()
    await expect(
      payload.create({
        collection: 'discount-codes',
        data: {
          code: uniq('bad1'),
          title: 'Bad 1',
          discountPercent: 100,
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'discount-codes',
        data: {
          code: uniq('bad2'),
          title: 'Bad 2',
          discountPercent: 0,
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('rejects validUntil <= validFrom', async () => {
    const payload = await getTestPayload()
    await expect(
      payload.create({
        collection: 'discount-codes',
        data: {
          code: uniq('bad3'),
          title: 'Bad 3',
          discountPercent: 10,
          validFrom: '2026-06-01',
          validUntil: '2026-05-01',
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('rejects duplicate codes (case-insensitive via normalization)', async () => {
    const payload = await getTestPayload()
    const dupe = uniq('dupe')
    await payload.create({
      collection: 'discount-codes',
      data: {
        code: dupe,
        title: 'First',
        discountPercent: 10,
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
      } as never,
      overrideAccess: true,
    })
    await expect(
      payload.create({
        collection: 'discount-codes',
        data: {
          code: dupe.toLowerCase(),
          title: 'Second',
          discountPercent: 10,
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })
})
