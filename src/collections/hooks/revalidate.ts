import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'
import { safeRevalidateTag, type CacheTag } from '@/lib/cache'

/**
 * afterChange + afterDelete hooks that revalidate a single cache tag.
 * Wire into a collection config: `hooks: revalidateOnChange(TAGS.guides)`.
 * safeRevalidateTag is a no-op outside production, so seed/test mutations
 * (which run outside a Next request scope) are safe.
 */
export function revalidateOnChange(tag: CacheTag): {
  afterChange: CollectionAfterChangeHook[]
  afterDelete: CollectionAfterDeleteHook[]
} {
  return {
    afterChange: [
      ({ doc }) => {
        safeRevalidateTag(tag)
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        safeRevalidateTag(tag)
        return doc
      },
    ],
  }
}
