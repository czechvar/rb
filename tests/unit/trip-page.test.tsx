import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Event } from '@/payload-types'
import TripPage, { metadata as parentMetadata } from '@/app/(frontend)/trips/[slug]/page'
import OccurrencePage, { generateMetadata as generateOccurrenceMetadata } from '@/app/(frontend)/trips/[slug]/[occurrenceSlug]/page'
import TripDatesPage from '@/app/(frontend)/trips/[slug]/dates/page'
import TripFaqPage from '@/app/(frontend)/trips/[slug]/faq/page'
import TripLogisticsPage from '@/app/(frontend)/trips/[slug]/logistics/page'

const mocks = vi.hoisted(() => ({
  event: vi.fn(), dates: vi.fn(), occurrence: vi.fn(), blocks: vi.fn(),
  notFound: vi.fn(() => { throw new Error('NOT_FOUND') }),
  redirect: vi.fn((path: string) => { throw new Error(`TEMP_REDIRECT:${path}`) }),
  permanentRedirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`) }),
}))
vi.mock('@/lib/queries', () => ({
  getPublishedEventBySlug: mocks.event,
  getPublicEventDatesForEvent: mocks.dates,
  getPublicOccurrenceBySlugs: mocks.occurrence,
}))
vi.mock('next/navigation', () => ({ notFound: mocks.notFound, redirect: mocks.redirect, permanentRedirect: mocks.permanentRedirect }))
vi.mock('@/components/marketing/MarketingShell', () => ({ MarketingShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('@/lib/jsonld', () => ({ occurrenceGraphJsonLd: () => ({}) }))
vi.mock('@/components/JsonLd', () => ({ JsonLd: () => null }))
vi.mock('@/components/blocks/RenderBlocks', () => ({
  RenderBlocks: (props: unknown) => { mocks.blocks(props); return <div data-rendered-blocks /> },
}))

// The route uses real trip resolution and default composition with in-memory queries.
// No Payload client, environment setup, browser or database is loaded.
const event = { id: -1, title: 'Original trip', slug: 'unit-trip-page', state: 'published', createdAt: '', updatedAt: '', layout: [], tripDetail: { sections: [] } } as Event
const props = (date?: string | string[]) => ({
  params: Promise.resolve({ slug: event.slug }),
  searchParams: Promise.resolve(date === undefined ? {} : { date }),
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.event.mockResolvedValue(event)
  mocks.dates.mockResolvedValue([])
})

describe('trip parent route selection', () => {
  const occurrence = (id: number, overrides: Record<string, unknown> = {}) => ({
    id,
    event: event.id,
    slug: `venue-${id}`,
    dateFrom: '2999-10-12T00:00:00.000Z',
    dateTo: '2999-10-19T00:00:00.000Z',
    price: 100,
    vat: 0,
    currency: 'EUR',
    capacity: 8,
    remainingSeats: 3,
    active: true,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  })

  it('temporarily redirects to the deterministic earliest truly bookable occurrence', async () => {
    mocks.dates.mockResolvedValue([
      occurrence(3, { slug: 'z-venue' }),
      occurrence(1, { remainingSeats: 0, slug: 'sold-out' }),
      occurrence(2, { slug: 'a-venue' }),
    ])
    await expect(TripPage(props())).rejects.toThrow(`TEMP_REDIRECT:/trips/${event.slug}/a-venue`)
    expect(mocks.redirect).toHaveBeenCalledWith(`/trips/${event.slug}/a-venue`)
  })

  it('permanently redirects a valid numeric compatibility selector to the exact public occurrence', async () => {
    mocks.dates.mockResolvedValue([occurrence(77, { slug: 'kalymnos-2999-10-12' })])
    await expect(TripPage(props('77'))).rejects.toThrow(`REDIRECT:/trips/${event.slug}/kalymnos-2999-10-12`)
  })

  it.each(['', 'x77', '-1', '1.5', '9007199254740992', ['77']])('404s malformed selector %j without falling back', async (selector) => {
    mocks.dates.mockResolvedValue([occurrence(77)])
    await expect(TripPage(props(selector))).rejects.toThrow('NOT_FOUND')
    expect(mocks.redirect).not.toHaveBeenCalled()
    expect(mocks.permanentRedirect).not.toHaveBeenCalled()
  })

  it('404s an inactive, absent or wrong-parent numeric selector without fallback', async () => {
    mocks.dates.mockResolvedValue([occurrence(77, { active: false }), occurrence(78, { event: 999 })])
    await expect(TripPage(props('77'))).rejects.toThrow('NOT_FOUND')
    await expect(TripPage(props('78'))).rejects.toThrow('NOT_FOUND')
    await expect(TripPage(props('79'))).rejects.toThrow('NOT_FOUND')
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it('renders a useful noindex page with exact public links when no occurrence is bookable', async () => {
    mocks.dates.mockResolvedValue([
      occurrence(1, { slug: 'past-date', dateFrom: '2000-10-12T00:00:00.000Z', dateTo: '2000-10-19T00:00:00.000Z' }),
      occurrence(2, { slug: 'sold-out', remainingSeats: 0 }),
    ])
    const html = renderToStaticMarkup(await TripPage(props()))
    expect(html).toContain('No bookable dates are available')
    expect(html).toContain(`/trips/${event.slug}/past-date`)
    expect(html).toContain(`/trips/${event.slug}/sold-out`)
    expect(html).toContain('/contact')
    expect(parentMetadata.robots).toEqual({ index: false, follow: true })
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it.each([
    ['no public dates', []],
    ['all dates sold out', [occurrence(1, { remainingSeats: 0 }), occurrence(2, { remainingSeats: 0 })]],
  ])('does not invent a fallback when %s', async (_case, dates) => {
    mocks.dates.mockResolvedValue(dates)
    const html = renderToStaticMarkup(await TripPage(props()))
    expect(html).toContain('No bookable dates are available')
    expect(mocks.redirect).not.toHaveBeenCalled()
  })
})

describe('direct occurrence route', () => {
  const occurrence = {
    id: 77,
    event: event.id,
    slug: 'kalymnos-2999-10-12',
    dateFrom: '2999-10-12T00:00:00.000Z',
    dateTo: '2999-10-19T00:00:00.000Z',
    price: 100,
    vat: 0,
    currency: 'EUR',
    capacity: 8,
    active: true,
    createdAt: '',
    updatedAt: '',
  }

  it('renders the exact active occurrence under its published parent', async () => {
    mocks.occurrence.mockResolvedValueOnce({
      event,
      occurrence,
      canonicalPath: `/trips/${event.slug}/${occurrence.slug}`,
      requestedAlias: false,
    })
    renderToStaticMarkup(await OccurrencePage({
      params: Promise.resolve({ slug: event.slug, occurrenceSlug: occurrence.slug }),
    }))
    expect(mocks.occurrence).toHaveBeenCalledWith(event.slug, occurrence.slug)
    expect(mocks.blocks.mock.calls.at(-1)?.[0].context.trip.selectedDate.id).toBe(occurrence.id)
  })

  it('keeps an explicitly addressed active occurrence renderable after its date has passed', async () => {
    const past = { ...occurrence, dateFrom: '2000-10-12T00:00:00.000Z', dateTo: '2000-10-19T00:00:00.000Z' }
    mocks.occurrence.mockResolvedValueOnce({
      event,
      occurrence: past,
      canonicalPath: `/trips/${event.slug}/${past.slug}`,
      requestedAlias: false,
    })
    renderToStaticMarkup(await OccurrencePage({
      params: Promise.resolve({ slug: event.slug, occurrenceSlug: past.slug }),
    }))
    const trip = mocks.blocks.mock.calls.at(-1)?.[0].context.trip
    expect(trip.selectedDate.id).toBe(past.id)
    expect(trip.bookingHref).toBeNull()
  })

  it('isolates canonical and robots metadata to the exact occurrence', async () => {
    mocks.occurrence.mockResolvedValueOnce({
      event,
      occurrence: {
        ...occurrence,
        indexable: false,
        editorial: { content: { title: 'Date-specific trip', shortDescription: 'Date-specific description.' } },
      },
      canonicalPath: `/trips/${event.slug}/${occurrence.slug}`,
      requestedAlias: false,
    })
    await expect(generateOccurrenceMetadata({
      params: Promise.resolve({ slug: event.slug, occurrenceSlug: occurrence.slug }),
    })).resolves.toMatchObject({
      title: expect.stringContaining('Date-specific trip'),
      description: expect.stringContaining('Date-specific description.'),
      alternates: { canonical: `/trips/${event.slug}/${occurrence.slug}` },
      robots: { index: false, follow: true },
    })
  })

  it('redirects an alias directly to the stored slug and 404s unresolved combinations', async () => {
    const canonicalPath = `/trips/${event.slug}/${occurrence.slug}`
    mocks.occurrence.mockResolvedValueOnce({ event, occurrence, canonicalPath, requestedAlias: true })
    await expect(OccurrencePage({
      params: Promise.resolve({ slug: event.slug, occurrenceSlug: 'kalymnos-old' }),
    })).rejects.toThrow(`REDIRECT:${canonicalPath}`)
    expect(mocks.permanentRedirect).toHaveBeenCalledWith(canonicalPath)

    mocks.occurrence.mockResolvedValueOnce(null)
    await expect(OccurrencePage({
      params: Promise.resolve({ slug: 'wrong-parent', occurrenceSlug: occurrence.slug }),
    })).rejects.toThrow('NOT_FOUND')
  })
})

describe('legacy trip subroutes', () => {
  const occurrence = {
    id: 88, event: event.id, slug: 'kalymnos-2999-10-12',
    dateFrom: '2999-10-12T00:00:00.000Z', dateTo: '2999-10-19T00:00:00.000Z',
    price: 100, vat: 0, currency: 'EUR', capacity: 8, remainingSeats: 3,
    active: true, createdAt: '', updatedAt: '',
  }
  const routeProps = { params: Promise.resolve({ slug: event.slug }) }

  it.each([
    [TripDatesPage, '#dates'],
    [TripFaqPage, ''],
    [TripLogisticsPage, ''],
  ])('redirects directly to the selected canonical occurrence', async (Page, fragment) => {
    mocks.dates.mockResolvedValue([occurrence])
    await expect(Page(routeProps)).rejects.toThrow(
      `TEMP_REDIRECT:/trips/${event.slug}/${occurrence.slug}${fragment}`,
    )
  })

  it.each([TripDatesPage, TripFaqPage, TripLogisticsPage])(
    'redirects to the noindex parent fallback when no occurrence is selectable',
    async (Page) => {
      mocks.dates.mockResolvedValue([])
      await expect(Page(routeProps)).rejects.toThrow(`TEMP_REDIRECT:/trips/${event.slug}`)
    },
  )
})
