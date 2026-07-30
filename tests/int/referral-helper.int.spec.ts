import { describe, expect, it, vi } from 'vitest'
import { resolveReferralFromQuery } from '@/lib/referral'

describe('resolveReferralFromQuery', () => {
  it('returns null when the URL has no ?ref param', async () => {
    const r = await resolveReferralFromQuery(
      new URL('https://example.com/trips/foo'),
      vi.fn(),
    )
    expect(r).toBeNull()
  })

  it('returns the normalized code + redirect URL when the code is active', async () => {
    const lookup = vi.fn(async (code: string) =>
      code === 'PETRA' ? { code: 'PETRA' } : null,
    )
    const r = await resolveReferralFromQuery(
      new URL('https://example.com/trips/foo?ref=petra&x=1'),
      lookup,
    )
    expect(r).toEqual({
      code: 'PETRA',
      cleanUrl: 'https://example.com/trips/foo?x=1',
    })
    expect(lookup).toHaveBeenCalledWith('PETRA')
  })

  it('strips the ?ref param even when the code is invalid (silent failure)', async () => {
    const lookup = vi.fn(async () => null)
    const r = await resolveReferralFromQuery(
      new URL('https://example.com/path?ref=NOPE'),
      lookup,
    )
    expect(r).toEqual({
      code: null,
      cleanUrl: 'https://example.com/path',
    })
  })

  it('trims and uppercases the code before lookup', async () => {
    const lookup = vi.fn(async () => ({ code: 'X' }))
    await resolveReferralFromQuery(
      new URL('https://example.com/?ref=%20x%20'),
      lookup,
    )
    expect(lookup).toHaveBeenCalledWith('X')
  })
})
