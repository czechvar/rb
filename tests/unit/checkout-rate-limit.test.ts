import { describe, expect, it } from 'vitest'
import { resolveCheckoutRateLimitConfig } from '@/lib/checkout/rate-limit'

describe('checkout identity rate-limit configuration', () => {
  it('uses forgiving one-minute limits outside production', () => {
    expect(resolveCheckoutRateLimitConfig({ NODE_ENV: 'development' })).toEqual({
      emailMax: 100,
      networkMax: 100,
      globalMax: 1000,
      windowSeconds: 60,
    })
  })

  it('keeps the existing production limits as safe defaults', () => {
    expect(resolveCheckoutRateLimitConfig({ NODE_ENV: 'production' })).toEqual({
      emailMax: 3,
      networkMax: 10,
      globalMax: 100,
      windowSeconds: 600,
    })
  })

  it('accepts positive integer environment overrides and rejects invalid ones', () => {
    expect(
      resolveCheckoutRateLimitConfig({
        NODE_ENV: 'production',
        CHECKOUT_RATE_LIMIT_EMAIL_MAX: '7',
        CHECKOUT_RATE_LIMIT_NETWORK_MAX: '20',
        CHECKOUT_RATE_LIMIT_GLOBAL_MAX: '250',
        CHECKOUT_RATE_LIMIT_WINDOW_SECONDS: '90',
      }),
    ).toEqual({ emailMax: 7, networkMax: 20, globalMax: 250, windowSeconds: 90 })

    expect(
      resolveCheckoutRateLimitConfig({
        NODE_ENV: 'production',
        CHECKOUT_RATE_LIMIT_EMAIL_MAX: '0',
        CHECKOUT_RATE_LIMIT_WINDOW_SECONDS: 'not-a-number',
      }),
    ).toMatchObject({ emailMax: 3, windowSeconds: 600 })
  })
})
