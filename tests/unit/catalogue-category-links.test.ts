import { describe, expect, it } from 'vitest'
import { facetOptions, filterCatalogueResults, parseCatalogueFilters, type CatalogueResult } from '@/lib/catalogue-results'

const categories = [{ value: 'custom-trips', label: 'Custom Trips' }]
const results: CatalogueResult[] = [{ id: 1, eventId: 1, href: "/trips/example", title: "Example", dateTo: "2030-01-08", price: 100, currency: "EUR", categories: [{ value: 'expeditions', label: 'Expeditions' }], difficulties: [], locations: [], guides: [], dateFrom: '2030-01-01' }]

describe('category navigation without scheduled trips', () => {
  it('preserves an authored empty category and does not return unrelated trips', () => {
    const filters = parseCatalogueFilters(new URLSearchParams('category=custom-trips'), results, ['category'], categories)
    expect(filters).toEqual({ category: 'custom-trips' })
    expect(filterCatalogueResults(results, filters)).toEqual([])
    expect(facetOptions(results, categories).category).toContainEqual(categories[0])
  })

  it('still ignores unknown or disabled category filters', () => {
    expect(parseCatalogueFilters(new URLSearchParams('category=unknown'), results, ['category'], categories)).toEqual({})
    expect(parseCatalogueFilters(new URLSearchParams('category=custom-trips'), results, [], categories)).toEqual({})
  })
})
