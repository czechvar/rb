import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EventDateCard } from '@/components/blocks/CatalogueCards'
import { UpcomingTrips } from '@/components/marketing/team/UpcomingTrips'
import { FeaturedTrips } from '@/components/marketing/homepage/FeaturedTrips'
import { FeaturedTripBlock } from '@/components/blocks/FeaturedCatalogueBlocks'
import { TripGridBlock } from '@/components/blocks/TripGridBlock'
import ProgramsIndex from '@/app/(frontend)/programs/page'
import { toCatalogueResult } from '@/lib/catalogue-results'
import type { Event, EventDate } from '@/payload-types'

const mocks = vi.hoisted(() => ({
  dates: vi.fn(),
  events: vi.fn(),
  resolveTripGrid: vi.fn(),
  resolveFeaturedTrip: vi.fn(),
}))

vi.mock('@/lib/queries', () => ({
  getActiveEventDatesForEvents: mocks.dates,
  getPublishedEventsWithLocations: mocks.events,
}))
vi.mock('@/lib/block-resolvers/trip-grid', () => ({
  resolveTripGridEvents: mocks.resolveTripGrid,
  resolveFeaturedTrip: mocks.resolveFeaturedTrip,
}))
vi.mock('@/lib/block-resolvers/domain-grids', () => ({
  resolveFeaturedGuide: vi.fn(),
  resolveFeaturedLocation: vi.fn(),
  resolveFeaturedProgram: vi.fn(),
}))
vi.mock('@/lib/block-resolvers/content-discovery', () => ({
  resolveFeaturedEventDate: vi.fn(),
  resolveFeaturedPost: vi.fn(),
}))
vi.mock('@/lib/jsonld', () => ({
  absoluteUrl: (path: string) => `https://rockbusters.net${path}`,
  collectionPageGraphJsonLd: () => ({}),
  tripListItems: () => [],
}))
vi.mock('@/components/JsonLd', () => ({ JsonLd: () => null }))
vi.mock('@/components/marketing/MarketingShell', () => ({ MarketingShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('next/image', () => ({ default: ({ fill: _fill, ...props }: React.ComponentProps<'img'> & { fill?: boolean }) => React.createElement('img', props) }))

const event = {
  id: 41,
  title: 'Kalymnos camp',
  slug: 'kalymnos-camp',
  state: 'published',
  createdAt: '',
  updatedAt: '',
} as Event

const occurrence = {
  id: 77,
  event,
  slug: 'kalymnos-2999-10-12',
  dateFrom: '2999-10-12T00:00:00.000Z',
  dateTo: '2999-10-19T00:00:00.000Z',
  price: 1290,
  vat: 0,
  currency: 'EUR',
  capacity: 8,
  remainingSeats: 3,
  active: true,
  createdAt: '',
  updatedAt: '',
} as EventDate

beforeEach(() => {
  vi.clearAllMocks()
  mocks.events.mockResolvedValue([event])
  mocks.dates.mockResolvedValue([occurrence])
  mocks.resolveTripGrid.mockResolvedValue([event])
  mocks.resolveFeaturedTrip.mockResolvedValue(event)
})

describe('known occurrence discovery links', () => {
  it('uses the canonical occurrence URL in Event Date cards and upcoming team trips', () => {
    const expected = '/trips/kalymnos-camp/kalymnos-2999-10-12'
    expect(renderToStaticMarkup(<EventDateCard eventDate={occurrence} />)).toContain(`href="${expected}"`)
    expect(renderToStaticMarkup(<UpcomingTrips dates={[occurrence]} />)).toContain(`href="${expected}"`)
  })

  it('uses the identified first occurrence on the programs index', async () => {
    const html = renderToStaticMarkup(await ProgramsIndex())
    expect(html).toContain('href="/trips/kalymnos-camp/kalymnos-2999-10-12"')
  })

  it.each(['cards', 'featureLead'] as const)('uses the identified first occurrence in %s trip grids', async (variant) => {
    const html = renderToStaticMarkup(await TripGridBlock({
      blockType: 'tripGrid', source: 'manual', events: [event], heading: 'Trips', limit: 3, variant,
    }))
    expect(html).toContain('href="/trips/kalymnos-camp/kalymnos-2999-10-12"')
  })

  it('uses identified occurrences in homepage and featured-trip cards', async () => {
    const homepage = renderToStaticMarkup(<FeaturedTrips events={[event]} datesByEvent={new Map([[event.id, [occurrence]]])} />)
    const featured = renderToStaticMarkup(await FeaturedTripBlock({ event }))
    expect(homepage).toContain('href="/trips/kalymnos-camp/kalymnos-2999-10-12"')
    expect(featured).toContain('href="/trips/kalymnos-camp/kalymnos-2999-10-12"')
  })

  it('links migrated trip cards and grids directly to the dated Trip Variant leaf', async () => {
    const migrated = {
      ...occurrence,
      tripVariant: { id: 51, event: event.id, slug: 'kalymnos', title: 'Kalymnos' },
      publicDateKey: '2999-10-12-to-2999-10-19',
    } as EventDate
    const expected = '/trips/kalymnos-camp/kalymnos?date=2999-10-12-to-2999-10-19'
    mocks.dates.mockResolvedValue([migrated])
    expect(renderToStaticMarkup(<EventDateCard eventDate={migrated} />)).toContain(`href="${expected.replace('&', '&amp;')}"`)
    expect(toCatalogueResult(migrated)?.href).toBe(expected)
    expect(renderToStaticMarkup(await ProgramsIndex())).toContain(expected.replace('&', '&amp;'))
    expect(renderToStaticMarkup(await TripGridBlock({
      blockType: 'tripGrid', source: 'manual', events: [event], heading: 'Trips', limit: 3, variant: 'cards',
    }))).toContain(expected.replace('&', '&amp;'))
  })

  it('uses the selected variant hero title parts and prefers its hero image for grid cards', async () => {
    const variantEvent = {
      ...event,
      title: 'European climbing road trip',
      mainPicture: { id: 'hero', url: '/hero.jpg', alt: 'Hero', width: 1200, height: 800, createdAt: '', updatedAt: '' },
      gallery: [{ id: 'gallery', url: '/gallery.jpg', alt: 'Gallery', width: 1200, height: 800, createdAt: '', updatedAt: '' }],
    } as Event
    const variantOccurrence = {
      ...occurrence,
      event: variantEvent,
      tripVariant: {
        id: 51,
        event: variantEvent.id,
        slug: 'gorges-du-tarn',
        title: 'Gorges du Tarn',
        editorial: {
          hero: {
            titleParts: [
              { text: 'ROCK & ROAD EUROPE: ' },
              { text: 'GORGES DU TARN', accent: true },
            ],
          },
        },
      },
    } as EventDate
    mocks.resolveTripGrid.mockResolvedValue([variantEvent])
    mocks.dates.mockResolvedValue([variantOccurrence])

    const html = renderToStaticMarkup(await TripGridBlock({
      blockType: 'tripGrid', source: 'manual', events: [variantEvent], heading: 'Trips', limit: 3, variant: 'featureLead',
    }))

    expect(html).toContain('ROCK &amp; ROAD EUROPE: ')
    expect(html).toContain('GORGES DU TARN')
    expect(html).not.toContain('European climbing road trip')
    expect(html).toContain('/hero.jpg')
    expect(html).not.toContain('/gallery.jpg')

    expect(toCatalogueResult(variantOccurrence)).toMatchObject({
      title: 'ROCK & ROAD EUROPE: GORGES DU TARN',
      titleParts: [
        { text: 'ROCK & ROAD EUROPE: ' },
        { text: 'GORGES DU TARN', accent: true },
      ],
      image: { url: '/hero.jpg', alt: 'Hero' },
    })
  })

  it('falls back to the first event gallery image when the event hero image is missing', async () => {
    const galleryEvent = {
      ...event,
      mainPicture: null,
      gallery: [{ id: 'gallery', url: '/gallery-fallback.jpg', alt: 'Gallery', createdAt: '', updatedAt: '' }],
    } as Event
    mocks.resolveTripGrid.mockResolvedValue([galleryEvent])
    mocks.dates.mockResolvedValue([{ ...occurrence, event: galleryEvent }])

    const html = renderToStaticMarkup(await TripGridBlock({
      blockType: 'tripGrid', source: 'manual', events: [galleryEvent], heading: 'Trips', limit: 3, variant: 'featureLead',
    }))

    expect(html).toContain('/gallery-fallback.jpg')
  })

  it('retains the parent selector when no occurrence identity is available', async () => {
    mocks.dates.mockResolvedValue([])
    const programs = renderToStaticMarkup(await ProgramsIndex())
    const grid = renderToStaticMarkup(await TripGridBlock({
      blockType: 'tripGrid', source: 'manual', events: [event], heading: 'Trips', limit: 3, variant: 'cards',
    }))
    expect(programs).toContain('href="/trips/kalymnos-camp"')
    expect(grid).toContain('href="/trips/kalymnos-camp"')
  })

  it('puts the canonical occurrence URL in catalogue result DTOs', () => {
    expect(toCatalogueResult(occurrence)?.href).toBe('/trips/kalymnos-camp/kalymnos-2999-10-12')
  })
})
