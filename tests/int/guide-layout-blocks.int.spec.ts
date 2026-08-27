import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { type BlockRenderContext, RenderBlocks } from '@/components/blocks/RenderBlocks'
import { getTestPayload } from '../helpers/payload'
import type { Guide } from '@/payload-types'

type RenderBlocksInput = Parameters<typeof RenderBlocks>[0]

const trackedIds: Record<string, number[]> = {}

const richText = (text: string): Record<string, unknown> => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', version: 1, text }],
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
})

describe('Guide layout blocks', () => {
  afterEach(async () => {
    const payload = await getTestPayload()

    for (const collection of ['events', 'guides']) {
      const ids = trackedIds[collection]
      if (!ids?.length) continue
      await payload.delete({ collection: collection as never, where: { id: { in: ids } } })
      trackedIds[collection] = []
    }
  })

  it('renders guide-specific blocks from the current Guide context', async () => {
    const guide = {
      id: 9301,
      name: 'POC Guide Layout',
      slug: 'poc-guide-layout',
      role: 'Head coach',
      tagline: 'Movement detail without noise.',
      heroSub: 'Guide hero subcopy from the current Guide record.',
      content: richText('Guide biography from the current Guide record.'),
      active: true,
      stats: [{ value: '20+', label: 'Years on rock' }],
      about: {
        headline: '*Precise coaching*\nfor real rock',
        facts: [{ label: 'Base', value: 'Prague' }],
        quote: 'Good coaching starts with seeing what is really happening.',
      },
      coaching: {
        intro: 'Pillars intro from Guide data.',
        pillars: [{ title: 'Footwork', body: 'Climb quieter and waste less energy.' }],
      },
      achievements: {
        intro: 'Achievement intro from Guide data.',
        items: [{ route: 'Test Route', location: 'Test Crag', grade: '8a' }],
      },
      testimonial: {
        quote: 'The coaching finally made movement click.',
        name: 'POC Client',
        tripLine: 'Rockbusters client',
      },
    } as Guide

    const element = await RenderBlocks({
      blocks: [
        { blockType: 'guideHero' },
        { blockType: 'guideStats' },
        { blockType: 'guideAbout' },
        { blockType: 'guidePillars' },
        { blockType: 'guideAchievements' },
        { blockType: 'guideTestimonial' },
        { blockType: 'guideCTA' },
      ] as RenderBlocksInput['blocks'],
      context: { guide } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('POC')
    expect(markup).toContain('Guide Layout')
    expect(markup).toContain('Head coach')
    expect(markup).toContain('20+')
    expect(markup).toContain('Guide biography from the current Guide record.')
    expect(markup).toContain('Footwork')
    expect(markup).toContain('Test Route')
    expect(markup).toContain('The coaching finally made movement click.')
  })

  it('uses the current Guide context for current-guide trip binding', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const guide = await payload.create({
      collection: 'guides',
      data: {
        name: `POC Context Guide ${stamp}`,
        slug: `poc-context-guide-${stamp}`,
        section: 'team',
        active: true,
      },
    })
    track('guides', guide.id)

    const event = await payload.create({
      collection: 'events',
      data: {
        title: `POC Guide Trip ${stamp}`,
        slug: `poc-guide-trip-${stamp}`,
        coaches: [guide.id],
        state: 'published',
      },
    })
    track('events', event.id)

    const element = await RenderBlocks({
      blocks: [
        { blockType: 'guideTripsSection' },
        { blockType: 'guideTrips', source: 'currentGuide', heading: 'Guide trip cards', limit: 3 },
      ] as RenderBlocksInput['blocks'],
      context: { guide } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain(`POC Guide Trip ${stamp}`)
    expect(markup).toContain(`/trips/poc-guide-trip-${stamp}`)
    expect(markup).toContain('Guide trip cards')
  })
})

function track(collection: string, id: number) {
  trackedIds[collection] ??= []
  trackedIds[collection].push(id)
}
