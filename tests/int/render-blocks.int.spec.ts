import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { type BlockRenderContext, RenderBlocks } from '@/components/blocks/RenderBlocks'

type RenderBlocksInput = Parameters<typeof RenderBlocks>[0]

describe('RenderBlocks', () => {
  it('renders nothing for an empty layout', async () => {
    await expect(RenderBlocks({ blocks: [] })).resolves.toBeNull()
    await expect(RenderBlocks({ blocks: null })).resolves.toBeNull()
  })

  it('ignores unknown block types and preserves rendered block order', async () => {
    const element = await RenderBlocks({
      blocks: [
        {
          id: 'first',
          blockType: 'cta',
          heading: 'First CTA',
          variant: 'dark',
        },
        {
          id: 'ignored',
          blockType: 'unsupported',
          heading: 'Do not render',
        },
        {
          id: 'second',
          blockType: 'hero',
          heading: 'Second Hero',
          variant: 'simple',
        },
      ] as RenderBlocksInput['blocks'],
      context: { page: { id: 123, slug: 'test-page' } } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('First CTA')
    expect(markup).toContain('Second Hero')
    expect(markup).not.toContain('Do not render')
    expect(markup.indexOf('First CTA')).toBeLessThan(markup.indexOf('Second Hero'))
  })

  it('renders generic content and media blocks', async () => {
    const element = await RenderBlocks({
      blocks: [
        {
          blockType: 'section-intro',
          eyebrow: 'Generic content',
          heading: 'Reusable intro',
          body: 'Short lead copy.',
          alignment: 'left',
        },
        {
          blockType: 'stats',
          heading: 'Proof points',
          items: [
            { value: '12', label: 'Locations' },
            { value: '98%', label: 'Would return' },
          ],
        },
        {
          blockType: 'video',
          heading: 'Training film',
          videoUrl: 'https://vimeo.com/123456',
          caption: 'A safe external video.',
        },
      ] as RenderBlocksInput['blocks'],
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('Reusable intro')
    expect(markup).toContain('Short lead copy.')
    expect(markup).toContain('12')
    expect(markup).toContain('Would return')
    expect(markup).toContain('https://player.vimeo.com/video/123456')
    expect(markup).toContain('A safe external video.')
  })
})
