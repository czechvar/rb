import { getPayloadClient } from '@/lib/payload'
import type { Where } from 'payload'
import type { Guide, Location, Program, Review } from '@/payload-types'
import { relationId, relationIds } from './helpers'

export type ProgramGridSource = 'featured' | 'all' | 'manual'
export type LocationGridSource = 'featured' | 'all' | 'byCountry' | 'manual'
export type GuideGridSource = 'team' | 'friends' | 'featured' | 'manual'
export type ReviewGridSource = 'global' | 'byEvent' | 'byProgram' | 'manual'
export type FeaturedCatalogueSource = 'manual' | 'currentContext'

export type ProgramGridResolverInput = {
  source?: ProgramGridSource | null
  programs?: Array<number | Program> | null
  limit?: number | null
}

export type LocationGridResolverInput = {
  source?: LocationGridSource | null
  locations?: Array<number | Location> | null
  country?: string | null
  limit?: number | null
}

export type GuideGridResolverInput = {
  source?: GuideGridSource | null
  guides?: Array<number | Guide> | null
  limit?: number | null
}

export type ReviewGridResolverInput = {
  source?: ReviewGridSource | null
  reviews?: Array<number | Review> | null
  event?: number | { id: number } | null
  program?: number | { id: number } | null
  limit?: number | null
}

export type FeaturedProgramResolverInput = {
  source?: FeaturedCatalogueSource | null
  program?: number | Program | null
  currentProgram?: Program | null
}

export type FeaturedLocationResolverInput = {
  source?: FeaturedCatalogueSource | null
  location?: number | Location | null
  currentLocation?: Location | null
}

export type FeaturedGuideResolverInput = {
  source?: FeaturedCatalogueSource | null
  guide?: number | Guide | null
  currentGuide?: Guide | null
}

export async function resolveProgramGridPrograms(input: ProgramGridResolverInput): Promise<Program[]> {
  const payload = await getPayloadClient()
  const limit = boundedLimit(input.limit, 6, 12)
  const source = input.source ?? 'featured'

  if (source === 'manual') {
    const expanded = (input.programs ?? []).filter(
      (program): program is Program =>
        typeof program === 'object' && program.active === true && program.state === 'published',
    )
    if (expanded.length > 0) return expanded.slice(0, limit)

    const ids = relationIds(input.programs)
    if (ids.length === 0) return []

    const { docs } = await payload.find({
      collection: 'programs',
      where: { and: [{ id: { in: ids } }, ...publishedProgramClauses] },
      sort: 'name',
      depth: 1,
      limit,
    })
    return docs
  }

  const whereClauses: Where[] = [...publishedProgramClauses]
  if (source === 'featured') whereClauses.push({ featured: { equals: true } })

  const { docs } = await payload.find({
    collection: 'programs',
    where: { and: whereClauses },
    sort: source === 'featured' ? '-featured' : 'name',
    depth: 1,
    limit,
  })
  return docs
}

export async function resolveFeaturedProgram(input: FeaturedProgramResolverInput): Promise<Program | null> {
  if (
    input.source === 'currentContext' &&
    input.currentProgram?.active === true &&
    input.currentProgram.state === 'published'
  ) {
    return input.currentProgram
  }

  const expanded = input.program
  if (typeof expanded === 'object' && expanded?.active === true && expanded.state === 'published') {
    return expanded
  }

  const programId = relationId(input.program)
  if (!programId) return null

  const payload = await getPayloadClient()
  const program = await payload.findByID({ collection: 'programs', id: programId, depth: 1 })
  return program.active === true && program.state === 'published' ? program : null
}

export async function resolveLocationGridLocations(input: LocationGridResolverInput): Promise<Location[]> {
  const payload = await getPayloadClient()
  const limit = boundedLimit(input.limit, 8, 24)
  const source = input.source ?? 'featured'

  if (source === 'manual') {
    const expanded = (input.locations ?? []).filter(
      (location): location is Location => typeof location === 'object' && location.active === true,
    )
    if (expanded.length > 0) return expanded.slice(0, limit)

    const ids = relationIds(input.locations)
    if (ids.length === 0) return []

    const { docs } = await payload.find({
      collection: 'locations',
      where: { and: [{ id: { in: ids } }, activeWhere] },
      sort: 'name',
      depth: 1,
      limit,
    })
    return docs
  }

  const whereClauses: Where[] = [activeWhere]
  if (source === 'featured') whereClauses.push({ featured: { equals: true } })
  if (source === 'byCountry') {
    const country = input.country?.trim()
    if (!country) return []
    whereClauses.push({ country: { equals: country } })
  }

  const { docs } = await payload.find({
    collection: 'locations',
    where: { and: whereClauses },
    sort: 'name',
    depth: 1,
    limit,
  })
  return docs
}

export async function resolveFeaturedLocation(input: FeaturedLocationResolverInput): Promise<Location | null> {
  if (input.source === 'currentContext' && input.currentLocation?.active === true) {
    return input.currentLocation
  }

  const expanded = input.location
  if (typeof expanded === 'object' && expanded?.active === true) return expanded

  const locationId = relationId(input.location)
  if (!locationId) return null

  const payload = await getPayloadClient()
  const location = await payload.findByID({ collection: 'locations', id: locationId, depth: 1 })
  return location.active === true ? location : null
}

export async function resolveGuideGridGuides(input: GuideGridResolverInput): Promise<Guide[]> {
  const payload = await getPayloadClient()
  const limit = boundedLimit(input.limit, 6, 12)
  const source = input.source ?? 'team'

  if (source === 'manual') {
    const expanded = (input.guides ?? []).filter(
      (guide): guide is Guide => typeof guide === 'object' && guide.active === true,
    )
    if (expanded.length > 0) return expanded.slice(0, limit)

    const ids = relationIds(input.guides)
    if (ids.length === 0) return []

    const { docs } = await payload.find({
      collection: 'guides',
      where: { and: [{ id: { in: ids } }, activeWhere] },
      sort: 'name',
      depth: 1,
      limit,
    })
    return docs
  }

  const whereClauses: Where[] = [activeWhere]
  if (source === 'team' || source === 'friends') whereClauses.push({ section: { equals: source } })
  if (source === 'featured') whereClauses.push({ featured: { equals: true } })

  const { docs } = await payload.find({
    collection: 'guides',
    where: { and: whereClauses },
    sort: 'name',
    depth: 1,
    limit,
  })
  return docs
}

export async function resolveFeaturedGuide(input: FeaturedGuideResolverInput): Promise<Guide | null> {
  if (input.source === 'currentContext' && input.currentGuide?.active === true) {
    return input.currentGuide
  }

  const expanded = input.guide
  if (typeof expanded === 'object' && expanded?.active === true) return expanded

  const guideId = relationId(input.guide)
  if (!guideId) return null

  const payload = await getPayloadClient()
  const guide = await payload.findByID({ collection: 'guides', id: guideId, depth: 1 })
  return guide.active === true ? guide : null
}

export async function resolveReviewGridReviews(input: ReviewGridResolverInput): Promise<Review[]> {
  const payload = await getPayloadClient()
  const limit = boundedLimit(input.limit, 3, 12)
  const source = input.source ?? 'global'

  if (source === 'manual') {
    const expanded = (input.reviews ?? []).filter(
      (review): review is Review => typeof review === 'object' && review.active === true,
    )
    if (expanded.length > 0) return expanded.slice(0, limit)

    const ids = relationIds(input.reviews)
    if (ids.length === 0) return []

    const { docs } = await payload.find({
      collection: 'reviews',
      where: { and: [{ id: { in: ids } }, activeWhere] },
      sort: 'position',
      limit,
    })
    return docs
  }

  const whereClauses: Where[] = [activeWhere]
  if (source === 'global') {
    whereClauses.push({ event: { exists: false } }, { program: { exists: false } })
  }
  if (source === 'byEvent') {
    const eventId = relationId(input.event)
    if (!eventId) return []
    whereClauses.push({ event: { equals: eventId } })
  }
  if (source === 'byProgram') {
    const programId = relationId(input.program)
    if (!programId) return []
    whereClauses.push({ program: { equals: programId } })
  }

  const { docs } = await payload.find({
    collection: 'reviews',
    where: { and: whereClauses },
    sort: 'position',
    limit,
  })
  return docs
}

const activeWhere: Where = { active: { equals: true } }
const publishedProgramClauses: Where[] = [{ active: { equals: true } }, { state: { equals: 'published' } }]

function boundedLimit(value: number | null | undefined, fallback: number, max: number) {
  return Math.min(Math.max(value ?? fallback, 1), max)
}
