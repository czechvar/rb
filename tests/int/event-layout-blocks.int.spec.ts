import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { type BlockRenderContext, RenderBlocks } from '@/components/blocks/RenderBlocks'
import { getTestPayload } from '../helpers/payload'
import type { Event } from '@/payload-types'

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

describe('Event layout blocks', () => {
  afterEach(async () => {
    const payload = await getTestPayload()

    for (const collection of ['faqs', 'reviews', 'event-dates', 'events']) {
      const ids = trackedIds[collection]
      if (!ids?.length) continue
      await payload.delete({ collection: collection as never, where: { id: { in: ids } } })
      trackedIds[collection] = []
    }
  })

  it('renders trip-specific blocks from the current Event context', async () => {
    const event = {
      id: 9001,
      title: 'POC Event Layout Trip',
      slug: 'poc-event-layout-trip',
      shortDescription: 'A block-composed trip page.',
      state: 'published',
      highlights: [{ text: 'Reusable highlight from Event data' }],
    } as Event

    const element = await RenderBlocks({
      blocks: [
        { blockType: 'tripPitch' },
        { blockType: 'tripHighlights', heading: 'Reusable Proof' },
        { blockType: 'tripBookingCTA', heading: 'Book the reusable page' },
      ] as RenderBlocksInput['blocks'],
      context: { event } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('POC Event Layout Trip')
    expect(markup).toContain('A block-composed trip page.')
    expect(markup).toContain('Reusable Proof')
    expect(markup).toContain('Reusable highlight from Event data')
    expect(markup).toContain('/trips/poc-event-layout-trip/dates')
  })

  it('uses the current Event context for byEvent social and date blocks', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const event = await payload.create({
      collection: 'events',
      data: {
        title: `POC Context Event ${stamp}`,
        slug: `poc-context-event-${stamp}`,
        state: 'published',
      },
    })
    track('events', event.id)

    const eventDate = await payload.create({
      collection: 'event-dates',
      data: {
        event: event.id,
        dateFrom: '2028-04-10T00:00:00.000Z',
        dateTo: '2028-04-17T00:00:00.000Z',
        price: 1190,
        vat: 0,
        currency: 'EUR',
        capacity: 8,
        minParticipants: 2,
        active: true,
      },
    })
    track('event-dates', eventDate.id)

    const faq = await payload.create({
      collection: 'faqs',
      data: {
        question: `POC context FAQ ${stamp}?`,
        answer: richText('Context FAQ answer.'),
        event: event.id,
        active: true,
      },
    })
    track('faqs', faq.id)

    const review = await payload.create({
      collection: 'reviews',
      data: {
        quote: `POC context review ${stamp}`,
        reviewerName: 'Context Reviewer',
        event: event.id,
        active: true,
      },
    })
    track('reviews', review.id)

    const element = await RenderBlocks({
      blocks: [
        { blockType: 'calendar', source: 'byEvent', heading: 'Context dates', limit: 3 },
        { blockType: 'faq', source: 'byEvent', heading: 'Context FAQ', limit: 3 },
        { blockType: 'reviewGrid', source: 'byEvent', heading: 'Context reviews', limit: 3 },
      ] as RenderBlocksInput['blocks'],
      context: { event } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('Context dates')
    expect(markup).toContain(`POC Context Event ${stamp}`)
    expect(markup).toContain(`POC context FAQ ${stamp}?`)
    expect(markup).toContain('Context FAQ answer.')
    expect(markup).toContain(`POC context review ${stamp}`)
    expect(markup).toContain('Context Reviewer')
  })
})

function track(collection: string, id: number) {
  trackedIds[collection] ??= []
  trackedIds[collection].push(id)
}
