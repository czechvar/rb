import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Event } from '@/payload-types'
import TripPage from '@/app/(frontend)/trips/[slug]/page'

const mocks = vi.hoisted(() => ({ event: vi.fn(), dates: vi.fn(), blocks: vi.fn() }))
vi.mock('@/lib/queries', () => ({ getPublishedEventBySlug: mocks.event, getTripDetailEventDates: mocks.dates }))
vi.mock('@/components/marketing/MarketingShell', () => ({ MarketingShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('@/lib/jsonld', () => ({ eventDetailGraphJsonLd: () => ({}) }))
vi.mock('@/components/JsonLd', () => ({ JsonLd: () => null }))
vi.mock('@/components/blocks/RenderBlocks', () => ({
  RenderBlocks: (props: unknown) => { mocks.blocks(props); return <div data-rendered-blocks /> },
}))

// The route uses real trip resolution and default composition with in-memory queries.
// No Payload client, environment setup, browser or database is loaded.
const event = { id: -1, title: 'Original trip', slug: 'unit-trip-page', layout: [], tripDetail: { sections: [] } } as Event
const props = () => ({ params: Promise.resolve({ slug: event.slug }), searchParams: Promise.resolve({}) })

beforeEach(() => {
  vi.clearAllMocks()
  mocks.event.mockResolvedValue(event)
  mocks.dates.mockResolvedValue([])
})

describe('trip page layout selection', () => {
  it('uses the shared editorial template when both saved layout and mined sections are empty', async () => {
    renderToStaticMarkup(await TripPage(props()))
    expect(mocks.blocks).toHaveBeenCalledOnce()
    const rendered = mocks.blocks.mock.calls[0][0]
    expect(rendered.blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ blockType: 'tripHero', variant: 'editorial' }),
      expect.objectContaining({ blockType: 'tripDates', variant: 'rows' }),
      expect.objectContaining({ blockType: 'gallery', variant: 'featureLead' }),
      expect.objectContaining({ blockType: 'tripBookingCTA', variant: 'image' }),
    ]))
    expect(rendered.context.event).toBe(event)
    expect(rendered.context.trip.sections).toEqual([])
    expect(mocks.event).toHaveBeenCalledWith(event.slug)
    expect(mocks.dates).toHaveBeenCalledWith(event.id)
  })

  it('respects a saved custom layout without replacing or appending default blocks', async () => {
    const layout: NonNullable<Event['layout']> = [{ blockType: 'tripHero', variant: 'default' }]
    const custom = { ...event, layout }
    mocks.event.mockResolvedValue(custom)
    renderToStaticMarkup(await TripPage(props()))
    expect(mocks.blocks).toHaveBeenCalledOnce()
    const rendered = mocks.blocks.mock.calls[0][0]
    expect(rendered.blocks).toBe(layout)
    expect(rendered.blocks).toHaveLength(1)
    expect(rendered.context.event).toBe(custom)
  })
})
