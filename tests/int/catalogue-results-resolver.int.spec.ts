import { afterEach, describe, expect, it } from 'vitest'
import { getUpcomingCatalogueResults } from '@/lib/queries'
import { filterCatalogueResults, parseCatalogueFilters } from '@/lib/catalogue-results'
import { getTestPayload } from '../helpers/payload'

const trackedIds: Record<string, number[]> = {}

function track(collection: string, id: number) {
  ;(trackedIds[collection] ??= []).push(id)
}

afterEach(async () => {
  const payload = await getTestPayload()
  for (const collection of [
    'event-dates',
    'events',
    'categories',
    'difficulties',
    'locations',
    'guides',
  ]) {
    const ids = trackedIds[collection]
    if (!ids?.length) continue
    await payload.delete({ collection: collection as never, where: { id: { in: ids } } })
    trackedIds[collection] = []
  }
})

describe('upcoming catalogue results', () => {
  it('returns only published trips with active upcoming dates and resolves every supported facet', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const category = await payload.create({
      collection: 'categories',
      data: { name: `Catalogue Bouldering ${stamp}`, slug: `catalogue-bouldering-${stamp}`, active: true },
    })
    track('categories', category.id)
    const difficulty = await payload.create({
      collection: 'difficulties',
      data: { name: `Catalogue Intermediate ${stamp}`, active: true },
    })
    track('difficulties', difficulty.id)
    const location = await payload.create({
      collection: 'locations',
      data: { name: `Catalogue Albarracin ${stamp}`, slug: `catalogue-albarracin-${stamp}`, country: 'Spain', active: true },
    })
    track('locations', location.id)
    const guide = await payload.create({
      collection: 'guides',
      data: { name: `Catalogue Guide ${stamp}`, slug: `catalogue-guide-${stamp}`, section: 'team', active: true },
    })
    track('guides', guide.id)
    const published = await payload.create({
      collection: 'events',
      data: {
        title: `Catalogue Published ${stamp}`,
        slug: `catalogue-published-${stamp}`,
        state: 'published',
        categories: [category.id],
        difficulties: [difficulty.id],
        locations: [location.id],
      },
    })
    track('events', published.id)
    const draft = await payload.create({
      collection: 'events',
      data: { title: `Catalogue Draft ${stamp}`, slug: `catalogue-draft-${stamp}`, state: 'draft' },
    })
    track('events', draft.id)
    const upcoming = await payload.create({
      collection: 'event-dates',
      data: {
        event: published.id,
        dateFrom: '2030-10-12T00:00:00.000Z',
        dateTo: '2030-10-18T00:00:00.000Z',
        locations: [location.id],
        guides: [guide.id],
        price: 900,
        vat: 0,
        currency: 'EUR',
        capacity: 8,
        active: true,
      },
    })
    track('event-dates', upcoming.id)
    const inactive = await payload.create({
      collection: 'event-dates',
      data: {
        event: published.id,
        dateFrom: '2030-11-12T00:00:00.000Z',
        dateTo: '2030-11-18T00:00:00.000Z',
        price: 900,
        vat: 0,
        currency: 'EUR',
        capacity: 8,
        active: false,
      },
    })
    track('event-dates', inactive.id)
    const draftDate = await payload.create({
      collection: 'event-dates',
      data: {
        event: draft.id,
        dateFrom: '2030-12-12T00:00:00.000Z',
        dateTo: '2030-12-18T00:00:00.000Z',
        price: 900,
        vat: 0,
        currency: 'EUR',
        capacity: 8,
        active: true,
      },
    })
    track('event-dates', draftDate.id)

    const results = await getUpcomingCatalogueResults()
    const result = results.find((item) => item.id === upcoming.id)

    expect(result).toMatchObject({
      href: `/trips/${published.slug}`,
      categories: [{ value: category.slug, label: category.name }],
      difficulties: [{ value: String(difficulty.id), label: difficulty.name }],
      locations: [{ value: location.slug, label: location.name }],
      guides: [{ value: guide.slug, label: guide.name }],
    })
    expect(results.map((item) => item.id)).not.toContain(inactive.id)
    expect(results.map((item) => item.id)).not.toContain(draftDate.id)

    const filters = parseCatalogueFilters(
      new URLSearchParams(
        `category=${category.slug}&difficulty=${difficulty.id}&location=${location.slug}&month=2030-10&guide=${guide.slug}`,
      ),
      results,
    )
    expect(filterCatalogueResults(results, filters).map((item) => item.id)).toContain(upcoming.id)
  })
})
