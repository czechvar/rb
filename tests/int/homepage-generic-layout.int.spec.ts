import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'

type RenderBlocksInput = Parameters<typeof RenderBlocks>[0]

describe('Homepage generic layout', () => {
  it('can be composed from reusable generic page blocks', async () => {
    const element = await RenderBlocks({
      blocks: [
        {
          blockType: 'hero',
          eyebrow: 'Climbers for climbers',
          heading: 'Climb harder. Climb smarter.',
          body: 'Reusable hero content managed from Payload.',
          variant: 'brandEditorial',
          primaryAction: { label: 'Explore trips', href: '/programs' },
        },
        {
          blockType: 'stats',
          eyebrow: 'Proof points',
          heading: 'Rockbusters in numbers',
          variant: 'inlineDark',
          items: [
            { value: '15+', label: 'Years on the rock' },
            { value: '3000+', label: 'Climbers coached' },
          ],
        },
        {
          blockType: 'stats',
          eyebrow: 'Why climb with us',
          heading: 'Maximum climbing time',
          variant: 'numberedDark',
          items: [
            { value: '01', label: 'Technical coaching' },
            { value: '02', label: 'Local knowledge' },
          ],
        },
        {
          blockType: 'cta',
          eyebrow: 'Next step',
          heading: 'Find your trip.',
          variant: 'finalRed',
          primaryAction: { label: 'View trips', href: '/programs' },
        },
      ] as RenderBlocksInput['blocks'],
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))

    expect(markup).toContain('Climb ')
    expect(markup).toContain('harder. ')
    expect(markup).toContain('smarter.')
    expect(markup).toContain('Rockbusters in numbers')
    expect(markup).toContain('3000+')
    expect(markup).toContain('Maximum climbing time')
    expect(markup).toContain('Find your trip.')
  })
})
