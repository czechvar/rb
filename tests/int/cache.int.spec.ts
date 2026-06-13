import { afterEach, describe, expect, it, vi } from 'vitest'

// vi.mock is hoisted above the file, so any fns its factory references must be
// created via vi.hoisted (which is hoisted with it).
const { revalidateTag, unstableCache } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  // unstable_cache(fn, keyParts, opts) returns a fn that, when called, runs fn.
  unstableCache: vi.fn(
    (fn: (...a: unknown[]) => unknown) =>
      (...a: unknown[]) =>
        fn(...a),
  ),
}))

vi.mock('next/cache', () => ({
  revalidateTag,
  unstable_cache: unstableCache,
}))

import { cachedQuery, safeRevalidateTag, TAGS } from '@/lib/cache'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('safeRevalidateTag', () => {
  it('calls revalidateTag in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    safeRevalidateTag(TAGS.guides)
    expect(revalidateTag).toHaveBeenCalledWith('guides')
  })

  it('is a no-op outside production', () => {
    vi.stubEnv('NODE_ENV', 'test')
    safeRevalidateTag(TAGS.guides)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('swallows revalidateTag errors in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    revalidateTag.mockImplementationOnce(() => {
      throw new Error('static generation store missing')
    })
    expect(() => safeRevalidateTag(TAGS.events)).not.toThrow()
  })
})

describe('cachedQuery', () => {
  it('calls fn directly and skips unstable_cache outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const fn = vi.fn(async () => 42)
    const result = await cachedQuery(['k'], [TAGS.guides], fn)
    expect(result).toBe(42)
    expect(fn).toHaveBeenCalledOnce()
    expect(unstableCache).not.toHaveBeenCalled()
  })

  it('wraps fn in unstable_cache with keyParts and tags in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const fn = vi.fn(async () => 7)
    const result = await cachedQuery(['guide-by-slug', 'x'], [TAGS.guides], fn)
    expect(unstableCache).toHaveBeenCalledWith(fn, ['guide-by-slug', 'x'], {
      tags: ['guides'],
    })
    expect(result).toBe(7)
  })
})
