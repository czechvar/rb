import { describe, expect, it } from 'vitest'
import { toMinorUnits } from '@/payments/money'

describe('toMinorUnits', () => {
  it('converts a two-decimal string', () => {
    expect(toMinorUnits('199.00')).toBe(19900)
  })

  it('converts a whole-number string', () => {
    expect(toMinorUnits('199')).toBe(19900)
  })

  it('truncates beyond two decimals rather than rounding', () => {
    expect(toMinorUnits('82.6446')).toBe(8264)
  })

  it('pads a single decimal', () => {
    expect(toMinorUnits('9.5')).toBe(950)
  })

  it('handles an amount large enough to expose float error', () => {
    // 1234567.89 * 100 in floating point is 123456788.99999999
    expect(toMinorUnits('1234567.89')).toBe(123456789)
  })

  it('handles zero', () => {
    expect(toMinorUnits('0.00')).toBe(0)
  })
})
