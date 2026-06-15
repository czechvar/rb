import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('referrals collection', () => {
  it('creates a referral with required fields and normalizes the code', async () => {
    const payload = await getTestPayload()
    const ref = await payload.create({
      collection: 'referrals',
      data: {
        code: 'petra',
        name: 'Petra Nováková',
        email: 'petra@example.com',
        discountPercent: 10,
        commissionPercent: 15,
      } as never,
      overrideAccess: true,
    })
    expect(ref.code).toBe('PETRA')
    expect(ref.active).toBe(true)
  })

  it('rejects duplicate codes (case-insensitive)', async () => {
    const payload = await getTestPayload()
    await payload.create({
      collection: 'referrals',
      data: {
        code: 'DUPE',
        name: 'First',
        email: 'first@example.com',
        discountPercent: 0,
        commissionPercent: 5,
      } as never,
      overrideAccess: true,
    })
    await expect(
      payload.create({
        collection: 'referrals',
        data: {
          code: 'dupe',
          name: 'Second',
          email: 'second@example.com',
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
        code: 'COMMONLY',
        name: 'Only Commission',
        email: 'only@example.com',
        discountPercent: 0,
        commissionPercent: 20,
      } as never,
      overrideAccess: true,
    })
    expect(ref.discountPercent).toBe(0)
    expect(ref.commissionPercent).toBe(20)
  })
})
