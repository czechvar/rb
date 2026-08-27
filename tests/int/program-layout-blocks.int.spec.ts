import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { type BlockRenderContext, RenderBlocks } from '@/components/blocks/RenderBlocks'
import { getTestPayload } from '../helpers/payload'
import type { Program } from '@/payload-types'

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

describe('Program layout blocks', () => {
  afterEach(async () => {
    const payload = await getTestPayload()

    for (const collection of ['faqs', 'reviews', 'events', 'programs']) {
      const ids = trackedIds[collection]
      if (!ids?.length) continue
      await payload.delete({ collection: collection as never, where: { id: { in: ids } } })
      trackedIds[collection] = []
    }
  })

  it('renders program-specific blocks from the current Program context', async () => {
    const program = {
      id: 9101,
      name: 'POC Program Layout',
      slug: 'poc-program-layout',
      shortDescription: 'A block-composed program page.',
      state: 'published',
      active: true,
      highlights: [{ text: 'Reusable program highlight' }],
      curriculumPillars: [
        { title: 'Movement', bullets: [{ text: 'Footwork drills' }] },
      ],
      flow: {
        framingParagraph: 'Daily coaching flow from Program data.',
      },
      weekVariants: [
        { title: 'One week', bullets: [{ text: 'Focused progression' }] },
      ],
      results: [{ text: 'Clear training plan' }],
    } as Program

    const element = await RenderBlocks({
      blocks: [
        { blockType: 'programHero' },
        { blockType: 'programHighlights', heading: 'Reusable program proof' },
        { blockType: 'programCurriculum' },
        { blockType: 'programFlow' },
        { blockType: 'programWeeks' },
        { blockType: 'programResults' },
        { blockType: 'programCTA' },
      ] as RenderBlocksInput['blocks'],
      context: { program } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('POC Program Layout')
    expect(markup).toContain('A block-composed program page.')
    expect(markup).toContain('Reusable program proof')
    expect(markup).toContain('Reusable program highlight')
    expect(markup).toContain('Movement')
    expect(markup).toContain('Daily coaching flow from Program data.')
    expect(markup).toContain('One week')
    expect(markup).toContain('Clear training plan')
  })

  it('uses the current Program context for byProgram social blocks and linked trips', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const program = await payload.create({
      collection: 'programs',
      data: {
        name: `POC Context Program ${stamp}`,
        slug: `poc-context-program-${stamp}`,
        active: true,
        state: 'published',
      },
    })
    track('programs', program.id)

    const event = await payload.create({
      collection: 'events',
      data: {
        title: `POC Program Trip ${stamp}`,
        slug: `poc-program-trip-${stamp}`,
        programs: [program.id],
        state: 'published',
      },
    })
    track('events', event.id)

    const faq = await payload.create({
      collection: 'faqs',
      data: {
        question: `POC program FAQ ${stamp}?`,
        answer: richText('Program FAQ answer.'),
        program: program.id,
        active: true,
      },
    })
    track('faqs', faq.id)

    const review = await payload.create({
      collection: 'reviews',
      data: {
        quote: `POC program review ${stamp}`,
        reviewerName: 'Program Reviewer',
        program: program.id,
        active: true,
      },
    })
    track('reviews', review.id)

    const element = await RenderBlocks({
      blocks: [
        { blockType: 'programTrips' },
        { blockType: 'tripGrid', source: 'byProgram', heading: 'Program trip cards', limit: 3 },
        { blockType: 'faq', source: 'byProgram', heading: 'Program FAQ', limit: 3 },
        { blockType: 'reviewGrid', source: 'byProgram', heading: 'Program reviews', limit: 3 },
      ] as RenderBlocksInput['blocks'],
      context: { program } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain(`POC Program Trip ${stamp}`)
    expect(markup).toContain(`/trips/poc-program-trip-${stamp}`)
    expect(markup).toContain('Program trip cards')
    expect(markup).toContain(`POC program FAQ ${stamp}?`)
    expect(markup).toContain('Program FAQ answer.')
    expect(markup).toContain(`POC program review ${stamp}`)
    expect(markup).toContain('Program Reviewer')
  })
})

function track(collection: string, id: number) {
  trackedIds[collection] ??= []
  trackedIds[collection].push(id)
}
