import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkoutEnabled, checkoutEntryHref } from '@/lib/checkout/feature'

describe('checkout rollout strategy', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('uses grouped checkout by default', () => {
    vi.stubEnv('CHECKOUT_ENABLED', '')

    expect(checkoutEnabled()).toBe(true)
    expect(checkoutEntryHref(42)).toBe('/cart?add=42')
  })

  it('retains an explicit legacy fallback', () => {
    vi.stubEnv('CHECKOUT_ENABLED', 'false')

    expect(checkoutEnabled()).toBe(false)
    expect(checkoutEntryHref(42)).toBe('/book/42')
  })
})
