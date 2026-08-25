import { describe, expect, it } from 'vitest'
import {
  catalogueBlocks,
  contentBlocks,
  conversionBlocks,
  mediaBlocks,
  pageBlocks,
  socialProofBlocks,
} from '@/blocks'

describe('block registry groups', () => {
  it('keeps the current page block contract while exposing grouped registries', () => {
    expect(contentBlocks.map((block) => block.slug)).toEqual([
      'hero',
      'section-intro',
      'rich-text',
      'stats',
    ])
    expect(conversionBlocks.map((block) => block.slug)).toEqual(['cta'])
    expect(catalogueBlocks.map((block) => block.slug)).toEqual(['tripGrid'])
    expect(mediaBlocks.map((block) => block.slug)).toEqual(['mediaBlock', 'gallery', 'video'])
    expect(socialProofBlocks.map((block) => block.slug)).toEqual(['faq'])

    expect(pageBlocks.map((block) => block.slug)).toEqual([
      'hero',
      'section-intro',
      'rich-text',
      'stats',
      'cta',
      'tripGrid',
      'mediaBlock',
      'gallery',
      'video',
      'faq',
    ])
  })

  it('does not register duplicate page block slugs', () => {
    const slugs = pageBlocks.map((block) => block.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
