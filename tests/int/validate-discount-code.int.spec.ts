import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import { validateDiscountCodeAction } from '@/app/(frontend)/book/[eventDateId]/validate-discount'

async function seedCode(opts: {
  code: string
  active?: boolean
  validFrom?: string
  validUntil?: string
  discountPercent?: number
}) {
  const payload = await getTestPayload()
  return payload.create({
    collection: 'discount-codes',
    data: {
      code: opts.code,
      title: 'T',
      discountPercent: opts.discountPercent ?? 10,
      validFrom: opts.validFrom ?? '2020-01-01',
      validUntil: opts.validUntil ?? '2099-12-31',
      active: opts.active ?? true,
    } as never,
    overrideAccess: true,
  })
}

describe('validateDiscountCodeAction', () => {
  it('accepts a valid, active, in-window code (case-insensitive)', async () => {
    const code = `VALID${Date.now()}`
    await seedCode({ code, discountPercent: 15 })
    const r = await validateDiscountCodeAction({ code: ` ${code.toLowerCase()} `, eventDateId: 0 })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.code).toBe(code)
      expect(r.discountPercent).toBe(15)
    }
  })

  it('rejects an unknown code', async () => {
    const r = await validateDiscountCodeAction({ code: `NOPE${Date.now()}`, eventDateId: 0 })
    expect(r.ok).toBe(false)
  })

  it('rejects an inactive code', async () => {
    const code = `OFF${Date.now()}`
    await seedCode({ code, active: false })
    const r = await validateDiscountCodeAction({ code, eventDateId: 0 })
    expect(r.ok).toBe(false)
  })

  it('rejects a not-yet-active code', async () => {
    const code = `FUTURE${Date.now()}`
    await seedCode({ code, validFrom: '2099-01-01', validUntil: '2099-12-31' })
    const r = await validateDiscountCodeAction({ code, eventDateId: 0 })
    expect(r.ok).toBe(false)
  })

  it('rejects an expired code', async () => {
    const code = `OLD${Date.now()}`
    await seedCode({ code, validFrom: '2000-01-01', validUntil: '2001-01-01' })
    const r = await validateDiscountCodeAction({ code, eventDateId: 0 })
    expect(r.ok).toBe(false)
  })

  it('rejects empty input', async () => {
    const r = await validateDiscountCodeAction({ code: '   ', eventDateId: 0 })
    expect(r.ok).toBe(false)
  })
})
