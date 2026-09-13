import { describe, it, expect } from 'vitest'
import {
  normalizeCart,
  balanceDeadline,
  initialAmount,
  minorUnits,
  discountedMinor,
} from '../../src/lib/checkout/pricing'
describe('checkout price and capacity inputs', () => {
  it('merges duplicate dated trips and orders locks consistently', () =>
    expect(
      normalizeCart([
        { eventDateId: 2, quantity: 2 },
        { eventDateId: 1, quantity: 1 },
        { eventDateId: 2, quantity: 3 },
      ]),
    ).toEqual([
      { eventDateId: 1, quantity: 1 },
      { eventDateId: 2, quantity: 5 },
    ]))
  it('rejects malformed or unbounded quantities', () => {
    for (const quantity of [0, -1, 1.5, 101, NaN])
      expect(() => normalizeCart([{ eventDateId: 1, quantity }])).toThrow()
    expect(() => normalizeCart([])).toThrow()
  })
  it('charges cents exactly and conserves deposit plus balance', () => {
    const total = minorUnits(199.99)
    const deposit = initialAmount(total, '2027-06-01T00:00:00Z', new Date('2027-01-01'))
    expect(deposit).toBe(5000)
    expect(deposit + (total - deposit)).toBe(19999)
    expect(discountedMinor(total, 10)).toBe(2000)
  })
  it('uses calendar days across month and year boundaries', () =>
    expect(balanceDeadline('2027-01-15T00:00:00Z')).toBe('2026-12-16T00:00:00.000Z'))
  it('requires full payment at the balance deadline', () =>
    expect(initialAmount(19999, '2027-01-01T00:00:00Z', new Date('2027-01-01T00:00:00Z'))).toBe(
      19999,
    ))
})
