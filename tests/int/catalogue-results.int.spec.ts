import { describe, expect, it } from 'vitest'
import { CatalogueResultsBlockConfig } from '@/blocks/CatalogueResults/config'
import {
  filterCatalogueResults,
  groupCatalogueResultsByMonth,
  parseCatalogueFilters,
  sortCatalogueResults,
  assignCatalogueImageVariants,
  updateCatalogueSearch,
  type CatalogueResult,
  toCatalogueResult,
} from '@/lib/catalogue-results'

const results: CatalogueResult[] = [
  {
    id: 1, eventId: 1, href: '/trips/fontainebleau', title: 'Fontainebleau', dateFrom: '2026-10-12T00:00:00.000Z', dateTo: '2026-10-18T00:00:00.000Z', price: 900, currency: 'EUR',
    categories: [{ value: 'bouldering', label: 'Bouldering' }], difficulties: [{ value: '2', label: 'Intermediate' }], locations: [{ value: 'fontainebleau', label: 'Fontainebleau' }], guides: [{ value: 'jany', label: 'Jany' }],
  },
  {
    id: 2, eventId: 2, href: '/trips/albarracin', title: 'Albarracin', dateFrom: '2026-11-02T00:00:00.000Z', dateTo: '2026-11-08T00:00:00.000Z', price: 700, currency: 'EUR',
    categories: [{ value: 'bouldering', label: 'Bouldering' }], difficulties: [{ value: '3', label: 'Advanced' }], locations: [{ value: 'albarracin', label: 'Albarracin' }], guides: [{ value: 'jan', label: 'Jan' }],
  },
]

describe('Catalogue Results URL contract', () => {
  it('exposes the page-editor controls for the catalogue presentation', () => {
    expect(CatalogueResultsBlockConfig.slug).toBe('catalogueResults')
    expect(CatalogueResultsBlockConfig.fields.map((field) => 'name' in field ? field.name : null)).toEqual(expect.arrayContaining([
      'eyebrow', 'heading', 'intro', 'enabledFacets', 'defaultSort', 'resultLimit', 'paginationMode', 'presentation', 'stickyFilters',
    ]))
  })

  it('accepts only available, well-formed enabled facets', () => {
    const filters = parseCatalogueFilters(new URLSearchParams('category=bouldering&difficulty=2&location=missing&month=2026-10&guide=jany'), results, ['category', 'difficulty', 'location', 'month', 'guide'])
    expect(filters).toEqual({ category: 'bouldering', difficulty: '2', month: '2026-10', guide: 'jany' })
  })

  it('maps type from event categories, rather than programs, in the compact server DTO', () => {
    const result = toCatalogueResult({
      id: 10,
      event: {
        id: 20,
        slug: 'fontainebleau-week',
        title: 'Fontainebleau week',
        state: 'published',
        categories: [{ id: 1, slug: 'bouldering', name: 'Bouldering', active: true }],
        difficulties: [{ id: 2, name: 'Intermediate', active: true }],
        locations: [{ id: 3, slug: 'fontainebleau', name: 'Fontainebleau', active: true }],
        programs: [{ id: 4, slug: 'ignored-program', name: 'Ignored program', active: true, state: 'published' }],
      },
      dateFrom: '2026-10-12T00:00:00.000Z',
      dateTo: '2026-10-18T00:00:00.000Z',
      price: 900,
      currency: 'EUR',
      capacity: 8,
      active: true,
      locations: [],
      guides: [{ id: 5, slug: 'jany', name: 'Jany', active: true }],
    } as unknown as Parameters<typeof toCatalogueResult>[0])

    expect(result).toMatchObject({
      href: '/trips/fontainebleau-week',
      categories: [{ value: 'bouldering', label: 'Bouldering' }],
      difficulties: [{ value: '2', label: 'Intermediate' }],
      locations: [{ value: 'fontainebleau', label: 'Fontainebleau' }],
      guides: [{ value: 'jany', label: 'Jany' }],
    })
  })

  it('ignores malformed and disabled facets', () => {
    const filters = parseCatalogueFilters(new URLSearchParams('month=October&category=bouldering'), results, ['month'])
    expect(filters).toEqual({})
  })

  it('composes filters with AND semantics and groups sorted results by month', () => {
    const filtered = filterCatalogueResults(results, { category: 'bouldering', difficulty: '2', month: '2026-10' })
    expect(filtered.map((result) => result.id)).toEqual([1])
    expect(groupCatalogueResultsByMonth(sortCatalogueResults(results, 'priceAsc'))).toMatchObject([
      { value: '2026-11', items: [{ id: 2 }] },
      { value: '2026-10', items: [{ id: 1 }] },
    ])
  })

  it('updates only catalogue filter keys while retaining unrelated query values', () => {
    expect(updateCatalogueSearch(new URLSearchParams('ref=partner&category=bouldering'), { location: 'albarracin' })).toBe('ref=partner&location=albarracin')
  })

  it('rotates suitable gallery images across chronological occurrences of the same trip', () => {
    const images = [
      { url: 'https://example.test/gallery-1.jpg', alt: 'First gallery image' },
      { url: 'https://example.test/gallery-2.jpg', alt: 'Second gallery image' },
    ]
    const variants = assignCatalogueImageVariants([
      { result: { ...results[0], eventId: 9 }, images },
      { result: { ...results[1], eventId: 9 }, images },
      { result: { ...results[0], id: 3, eventId: 9 }, images },
    ])

    expect(variants.map((result) => result.image?.url)).toEqual([
      'https://example.test/gallery-1.jpg',
      'https://example.test/gallery-2.jpg',
      'https://example.test/gallery-1.jpg',
    ])
  })
})
