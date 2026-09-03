import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { type BlockRenderContext, RenderBlocks } from '@/components/blocks/RenderBlocks'
import { getTestPayload } from '../helpers/payload'
import type { Location } from '@/payload-types'

type RenderBlocksInput = Parameters<typeof RenderBlocks>[0]

const trackedIds: Record<string, number[]> = {}

describe('Location layout blocks', () => {
  afterEach(async () => {
    const payload = await getTestPayload()

    for (const collection of ['event-dates', 'events', 'locations']) {
      const ids = trackedIds[collection]
      if (!ids?.length) continue
      await payload.delete({ collection: collection as never, where: { id: { in: ids } } })
      trackedIds[collection] = []
    }
  })

  it('renders location-specific blocks from the current Location context', async () => {
    const location = {
      id: 9201,
      name: 'POC Location Layout',
      slug: 'poc-location-layout',
      city: 'Test City',
      country: 'Test Country',
      coordinates: [14.41, 50.08],
      destinationDetail: {
        sections: [
          {
            id: 'intro',
            key: 'intro',
            heading: 'Introduction',
            body: 'Location body from the current Location record.',
          },
        ],
      },
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Location

    const element = await RenderBlocks({
      blocks: [
        { blockType: 'locationHero' },
        { blockType: 'locationContent', heading: 'Local climbing style' },
        { blockType: 'locationMap', heading: 'Where it is' },
      ] as RenderBlocksInput['blocks'],
      context: { location } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('POC Location Layout')
    expect(markup).toContain('Test City')
    expect(markup).toContain('Test Country')
    expect(markup).toContain('Location body from the current Location record.')
    expect(markup).toContain('Local climbing style')
    expect(markup).toContain('Where it is')
    expect(markup).toContain('openstreetmap.org')
  })

  it('uses the current Location context for byLocation trip blocks', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const location = await payload.create({
      collection: 'locations',
      data: {
        name: `POC Context Location ${stamp}`,
        slug: `poc-context-location-${stamp}`,
        active: true,
      },
    })
    track('locations', location.id)

    const event = await payload.create({
      collection: 'events',
      data: {
        title: `POC Location Trip ${stamp}`,
        slug: `poc-location-trip-${stamp}`,
        locations: [location.id],
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

    const element = await RenderBlocks({
      blocks: [
        { blockType: 'locationTrips' },
        { blockType: 'tripGrid', source: 'byLocation', heading: 'Trips here', limit: 3 },
      ] as RenderBlocksInput['blocks'],
      context: { location } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain(`POC Location Trip ${stamp}`)
    expect(markup).toContain(`/trips/poc-location-trip-${stamp}`)
    expect(markup).toContain('Trips here')
  })
})

function track(collection: string, id: number) {
  trackedIds[collection] ??= []
  trackedIds[collection].push(id)
}
