import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

const uniq = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}`

describe('referrals collection', () => {
  it('creates a referral with required fields and normalizes the code', async () => {
    const payload = await getTestPayload()
    const raw = uniq('petra').toLowerCase()
    const ref = await payload.create({
      collection: 'referrals',
      data: {
        code: raw,
        name: 'Petra Nováková',
        email: `petra-${Math.random()}@example.com`,
        discountPercent: 10,
        commissionPercent: 15,
      } as never,
      overrideAccess: true,
    })
    expect(ref.code).toBe(raw.toUpperCase())
    expect(ref.active).toBe(true)
  })

  it('rejects duplicate codes (case-insensitive)', async () => {
    const payload = await getTestPayload()
    const dupe = uniq('dupe')
    await payload.create({
      collection: 'referrals',
      data: {
        code: dupe,
        name: 'First',
        email: `first-${Math.random()}@example.com`,
        discountPercent: 0,
        commissionPercent: 5,
      } as never,
      overrideAccess: true,
    })
    await expect(
      payload.create({
        collection: 'referrals',
        data: {
          code: dupe.toLowerCase(),
          name: 'Second',
          email: `second-${Math.random()}@example.com`,
          discountPercent: 0,
          commissionPercent: 5,
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('allows discountPercent=0 (commission-only referral)', async () => {
    const payload = await getTestPayload()
    const ref = await payload.create({
      collection: 'referrals',
      data: {
        code: uniq('commonly'),
        name: 'Only Commission',
        email: `only-${Math.random()}@example.com`,
        discountPercent: 0,
        commissionPercent: 20,
      } as never,
      overrideAccess: true,
    })
    expect(ref.discountPercent).toBe(0)
    expect(ref.commissionPercent).toBe(20)
  })
})
