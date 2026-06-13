import { afterEach, describe, expect, it, vi } from 'vitest'

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }))
vi.mock('next/cache', () => ({
  revalidateTag,
  unstable_cache: (fn: unknown) => fn,
}))

import { revalidateOnChange } from '@/collections/hooks/revalidate'
import { TAGS } from '@/lib/cache'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('revalidateOnChange', () => {
  it('returns one afterChange and one afterDelete hook', () => {
    const hooks = revalidateOnChange(TAGS.guides)
    expect(hooks.afterChange).toHaveLength(1)
    expect(hooks.afterDelete).toHaveLength(1)
  })

  it('afterChange revalidates the tag in production and returns the doc', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const hooks = revalidateOnChange(TAGS.events)
    const doc = { id: 1 }
    const out = hooks.afterChange[0]({ doc } as never)
    expect(revalidateTag).toHaveBeenCalledWith('events')
    expect(out).toBe(doc)
  })

  it('afterDelete revalidates the tag in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const hooks = revalidateOnChange(TAGS.posts)
    hooks.afterDelete[0]({ doc: { id: 2 } } as never)
    expect(revalidateTag).toHaveBeenCalledWith('posts')
  })

  it('is a no-op outside production', () => {
    vi.stubEnv('NODE_ENV', 'test')
    const hooks = revalidateOnChange(TAGS.locations)
    hooks.afterChange[0]({ doc: {} } as never)
    hooks.afterDelete[0]({ doc: {} } as never)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
