import type { Event, EventDate } from '@/payload-types'

export const catalogueFacetKeys = ['category', 'difficulty', 'location', 'month', 'guide'] as const

export type CatalogueFacetKey = (typeof catalogueFacetKeys)[number]
export type CatalogueSort = 'date' | 'priceAsc' | 'priceDesc' | 'title'

export type CatalogueOption = { value: string; label: string }

export type CatalogueImage = {
  url: string
  alt: string
}

export type CatalogueResult = {
  id: number
  eventId: number
  href: string
  title: string
  description?: string | null
  dateFrom: string
  dateTo: string
  price: number
  currency: string
  capacity?: number | null
  image?: CatalogueImage | null
  categories: CatalogueOption[]
  difficulties: CatalogueOption[]
  locations: CatalogueOption[]
  guides: CatalogueOption[]
}

export type CatalogueFilters = Partial<Record<CatalogueFacetKey, string>>

export function toCatalogueResult(date: EventDate): CatalogueResult | null {
  const event = typeof date.event === 'object' ? date.event : null
  if (!event?.slug || event.state !== 'published') return null

  return {
    id: date.id,
    eventId: event.id,
    href: `/trips/${event.slug}`,
    title: event.catalogueCard?.title || event.title,
    description: event.catalogueCard?.description || event.shortDescription,
    dateFrom: date.dateFrom,
    dateTo: date.dateTo,
    price: date.price,
    currency: date.currency,
    capacity: date.capacity,
    image: catalogueImageCandidates(date)[0] ?? null,
    categories: relationOptions(event.categories, 'slug'),
    difficulties: relationOptions(event.difficulties, 'id'),
    locations: relationOptions(date.locations?.length ? date.locations : event.locations, 'slug'),
    guides: relationOptions(date.guides, 'slug'),
  }
}

export function catalogueImageCandidates(date: EventDate): CatalogueImage[] {
  const event = typeof date.event === 'object' ? date.event : null
  if (!event) return []

  return [...(event.gallery ?? []), event.mainPicture]
    .map(mediaOption)
    .filter((image): image is CatalogueImage => image !== null)
    .filter((image, index, images) => images.findIndex((candidate) => candidate.url === image.url) === index)
}

export function assignCatalogueImageVariants(
  entries: Array<{ result: CatalogueResult; images: CatalogueImage[] }>,
): CatalogueResult[] {
  const occurrenceByEvent = new Map<number, number>()

  return entries.map(({ result, images }) => {
    const occurrence = occurrenceByEvent.get(result.eventId) ?? 0
    occurrenceByEvent.set(result.eventId, occurrence + 1)
    return { ...result, image: images[occurrence % images.length] ?? result.image }
  })
}

function mediaOption(media: Event['mainPicture'] | NonNullable<Event['gallery']>[number]): CatalogueImage | null {
  if (!media || typeof media !== 'object' || !media.url) return null

  const width = media.width ?? 0
  const height = media.height ?? 0
  const aspectRatio = height ? width / height : 1
  if (width < 960 || height < 640 || aspectRatio < 0.65 || aspectRatio > 2.8) return null

  return { url: media.url, alt: media.alt || '' }
}

export function isCatalogueFacetKey(value: string): value is CatalogueFacetKey {
  return catalogueFacetKeys.includes(value as CatalogueFacetKey)
}

export function isMonthValue(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

export function monthValue(date: string) {
  return date.slice(0, 7)
}

export function parseCatalogueFilters(
  params: Pick<URLSearchParams, 'get'>,
  results: CatalogueResult[],
  enabledFacets: readonly CatalogueFacetKey[] = catalogueFacetKeys,
): CatalogueFilters {
  const available = facetOptions(results)
  const filters: CatalogueFilters = {}

  for (const facet of enabledFacets) {
    const value = params.get(facet)?.trim()
    if (!value) continue
    if (facet === 'month') {
      if (isMonthValue(value) && available.month.some((option) => option.value === value)) filters.month = value
      continue
    }
    if (available[facet].some((option) => option.value === value)) filters[facet] = value
  }

  return filters
}

export function facetOptions(results: CatalogueResult[]): Record<CatalogueFacetKey, CatalogueOption[]> {
  return {
    category: uniqueOptions(results.flatMap((result) => result.categories)),
    difficulty: uniqueOptions(results.flatMap((result) => result.difficulties)),
    location: uniqueOptions(results.flatMap((result) => result.locations)),
    month: uniqueOptions(results.map((result) => ({ value: monthValue(result.dateFrom), label: formatMonth(result.dateFrom) }))),
    guide: uniqueOptions(results.flatMap((result) => result.guides)),
  }
}

export function filterCatalogueResults(results: CatalogueResult[], filters: CatalogueFilters) {
  return results.filter((result) =>
    (!filters.category || result.categories.some((option) => option.value === filters.category)) &&
    (!filters.difficulty || result.difficulties.some((option) => option.value === filters.difficulty)) &&
    (!filters.location || result.locations.some((option) => option.value === filters.location)) &&
    (!filters.guide || result.guides.some((option) => option.value === filters.guide)) &&
    (!filters.month || monthValue(result.dateFrom) === filters.month),
  )
}

export function sortCatalogueResults(results: CatalogueResult[], sort: CatalogueSort = 'date') {
  return [...results].sort((left, right) => {
    if (sort === 'priceAsc') return left.price - right.price || left.dateFrom.localeCompare(right.dateFrom)
    if (sort === 'priceDesc') return right.price - left.price || left.dateFrom.localeCompare(right.dateFrom)
    if (sort === 'title') return left.title.localeCompare(right.title) || left.dateFrom.localeCompare(right.dateFrom)
    return left.dateFrom.localeCompare(right.dateFrom)
  })
}

export function groupCatalogueResultsByMonth(results: CatalogueResult[]) {
  const groups = new Map<string, CatalogueResult[]>()
  for (const result of results) {
    const value = monthValue(result.dateFrom)
    groups.set(value, [...(groups.get(value) ?? []), result])
  }
  return [...groups.entries()].map(([value, items]) => ({ value, label: formatMonth(`${value}-01`), items }))
}

export function updateCatalogueSearch(
  current: Pick<URLSearchParams, 'toString' | 'set' | 'delete'>,
  filters: CatalogueFilters,
) {
  const next = new URLSearchParams(current.toString())
  for (const facet of catalogueFacetKeys) {
    const value = filters[facet]
    if (value) next.set(facet, value)
    else next.delete(facet)
  }
  return next.toString()
}

function uniqueOptions(options: CatalogueOption[]) {
  return [...new Map(options.map((option) => [option.value, option])).values()].sort((left, right) =>
    left.label.localeCompare(right.label),
  )
}

function relationOptions<T extends { id: number }>(
  relations: Array<number | T> | null | undefined,
  valueKey: 'id' | 'slug',
): CatalogueOption[] {
  return (relations ?? []).flatMap((relation) => {
    if (typeof relation !== 'object' || !relation) return []
    const item = relation as T & { slug?: string; name?: string }
    const value = valueKey === 'id' ? String(item.id) : item.slug
    return value && item.name ? [{ value, label: item.name }] : []
  })
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 7)}-01T00:00:00.000Z`))
}
