import { describe, expect, it } from 'vitest'
import {
  BLOCK_DEMO_MARKER,
  BLOCK_DEMO_PAGE_SLUG,
  BLOCK_DEMO_MEDIA_FILENAME,
  LEGACY_BLOCK_DEMO_PAGE_SLUG,
  LEGACY_BLOCK_DEMO_MEDIA_FILENAMES,
} from '@/lib/block-demo'

describe('block demo data hygiene', () => {
  it('uses one deterministic marker for demo page and media records', () => {
    expect(BLOCK_DEMO_MARKER).toBe('cms-block-system-poc')
    expect(BLOCK_DEMO_PAGE_SLUG).toContain(BLOCK_DEMO_MARKER)
    expect(BLOCK_DEMO_MEDIA_FILENAME).toContain(BLOCK_DEMO_MARKER)
  })

  it('keeps legacy POC identifiers available for cleanup', () => {
    expect(LEGACY_BLOCK_DEMO_PAGE_SLUG).toBe('cms-page-builder-poc')
    expect(LEGACY_BLOCK_DEMO_MEDIA_FILENAMES).toEqual([
      'cms-page-builder-poc-visual.png',
      'cms-page-builder-poc.png',
      'cms-page-builder-poc-1.png',
    ])
  })
})
