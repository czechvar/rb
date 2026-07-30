import { describe, expect, it, beforeEach } from 'vitest'
import { rateLimit, __resetRateLimitForTests } from '../../src/lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    __resetRateLimitForTests()
  })

  it('allows up to limit requests, then blocks until window passes', () => {
    const opts = { key: 'forgot:1.2.3.4', limit: 3, windowMs: 1000 }
    expect(rateLimit(opts)).toEqual({ ok: true, remaining: 2 })
    expect(rateLimit(opts)).toEqual({ ok: true, remaining: 1 })
    expect(rateLimit(opts)).toEqual({ ok: true, remaining: 0 })
    expect(rateLimit(opts).ok).toBe(false)
  })

  it('isolates keys', () => {
    const a = { key: 'a', limit: 1, windowMs: 1000 }
    const b = { key: 'b', limit: 1, windowMs: 1000 }
    expect(rateLimit(a).ok).toBe(true)
    expect(rateLimit(b).ok).toBe(true)
    expect(rateLimit(a).ok).toBe(false)
  })
})
