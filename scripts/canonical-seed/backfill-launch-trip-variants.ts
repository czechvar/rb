/** Guarded existing-database backfill using public identities, never snapshot IDs. */
import { isDeepStrictEqual } from 'node:util'
import { pathToFileURL } from 'node:url'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import { remapRelationships, type SeedIDMap } from '../seed'
import {
  assertNotProduction,
  CANONICAL_SEED_FILE,
  readCanonicalSeed,
  type CanonicalSeed,
} from './shared'
import { migrateLaunchTripVariants } from './migrate-launch-trip-variants'

type Row = Record<string, unknown>
type BackfillOccurrence = {
  eventSlug: string
  occurrenceSlug: string
  publicDateKey: string
  dateFrom: string
  dateTo: string
  locationSlugs: string[]
}
type BackfillVariant = {
  eventSlug: string
  variantSlug: string
  locationSlugs: string[]
  occurrences: BackfillOccurrence[]
}

const EXPECTED = {
  launchEvents: 10,
  launchEventDates: 64,
  tripVariants: 31,
  indexableVariants: 25,
  inheritedVariants: 6,
} as const

function rows(seed: CanonicalSeed, slug: string) {
  return seed.collections.find((collection) => collection.slug === slug)?.rows ?? []
}

function id(value: unknown) {
  return String(value && typeof value === 'object' && 'id' in value ? (value as { id: unknown }).id : value)
}

function normalizedSlugSet(values: string[]) {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))].sort()
}

function assertReviewedDataset(seed: CanonicalSeed) {
  const result = migrateLaunchTripVariants(seed)
  for (const [key, expected] of Object.entries(EXPECTED)) {
    if (result.report[key as keyof typeof EXPECTED] !== expected) {
      throw new Error(`Reviewed Trip Variant precondition failed: ${key}`)
    }
  }
  return result.seed
}

export function buildExistingDBBackfillPlan(input: CanonicalSeed): BackfillVariant[] {
  const seed = assertReviewedDataset(input)
  const events = new Map(rows(seed, 'events').map((row) => [id(row.id), String(row.slug)]))
  const locations = new Map(rows(seed, 'locations').map((row) => [id(row.id), String(row.slug)]))
  const dates = rows(seed, 'event-dates')
  return rows(seed, 'trip-variants').map((variant) => {
    const sourceVariantID = id(variant.id)
    const eventSlug = events.get(id(variant.event))
    if (!eventSlug) throw new Error('Reviewed Trip Variant precondition failed: event identity')
    const occurrenceRows = dates.filter((date) => id(date.tripVariant) === sourceVariantID)
    return {
      eventSlug,
      variantSlug: String(variant.slug),
      locationSlugs: normalizedSlugSet((Array.isArray(variant.locations) ? variant.locations : []).map((location) => {
        const slug = locations.get(id(location))
        if (!slug) throw new Error('Reviewed Trip Variant precondition failed: location identity')
        return slug
      })),
      occurrences: occurrenceRows.map((date) => ({
        eventSlug,
        occurrenceSlug: String(date.slug),
        publicDateKey: String(date.publicDateKey),
        dateFrom: String(date.dateFrom),
        dateTo: String(date.dateTo),
        locationSlugs: normalizedSlugSet((Array.isArray(date.locations) ? date.locations : []).map((location) => {
          const slug = locations.get(id(location))
          if (!slug) throw new Error('Reviewed Trip Variant precondition failed: location identity')
          return slug
        })),
      })),
    }
  })
}

type TransactionRequest = { transactionID: string | number }

async function findAll(payload: Payload, collection: CollectionSlug, req: TransactionRequest) {
  const result = await payload.find({ collection, depth: 0, limit: 1000, pagination: false, req })
  return result.docs as unknown as Row[]
}

function mapBySlug(source: Row[], target: Row[], collection: CollectionSlug, maps: SeedIDMap) {
  const targetBySlug = new Map(target.map((row) => [String(row.slug), row.id]))
  const mapped = new Map<string, string | number>()
  for (const row of source) {
    const targetID = targetBySlug.get(String(row.slug))
    if (targetID == null) throw new Error(`Existing database precondition failed: ${collection}`)
    mapped.set(id(row.id), targetID as string | number)
  }
  maps.set(collection, mapped)
}

async function resolveOccurrence(payload: Payload, eventID: unknown, slug: string, req: TransactionRequest) {
  const result = await payload.find({
    collection: 'event-dates',
    depth: 0,
    limit: 2,
    where: { and: [{ event: { equals: eventID } }, { slug: { equals: slug } }] },
    req,
  })
  if (result.docs.length !== 1) throw new Error('Existing database precondition failed: occurrence identity')
  return result.docs[0] as unknown as Row
}

function normalizedDate(value: unknown) {
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString()
}

function normalizedRelationshipIDs(value: unknown) {
  return (Array.isArray(value) ? value : []).map(id).sort()
}

export function occurrenceMatchesReviewedFacts(
  expected: BackfillOccurrence,
  actual: Row,
  targetLocationSlugByID: Map<string, string>,
) {
  const actualLocations = normalizedSlugSet(normalizedRelationshipIDs(actual.locations).map((locationID) =>
    targetLocationSlugByID.get(locationID) ?? `missing-location-${locationID}`,
  ))
  return (
    normalizedDate(actual.dateFrom) === normalizedDate(expected.dateFrom) &&
    normalizedDate(actual.dateTo) === normalizedDate(expected.dateTo) &&
    isDeepStrictEqual(actualLocations, expected.locationSlugs)
  )
}

function semantic(value: unknown, key?: string): unknown {
  if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || value == null || value === '') return undefined
  if (Array.isArray(value)) {
    const entries = value.map((entry) => semantic(entry)).filter((entry) => entry !== undefined)
    return entries.length ? entries : undefined
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Row)
      .map(([childKey, entry]) => [childKey, semantic(entry, childKey)] as const)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
    return entries.length ? Object.fromEntries(entries) : undefined
  }
  return value
}

function comparableVariant(row: Row) {
  return semantic({
    event: id(row.event),
    title: row.title,
    slug: row.slug,
    slugAliases: row.slugAliases,
    locations: normalizedRelationshipIDs(row.locations),
    active: row.active,
    indexable: row.indexable,
    extraContent: row.extraContent,
    editorial: row.editorial,
    logisticsOverrides: row.logisticsOverrides,
  })
}

export function classifyExistingVariantSet(expected: Row[], actual: Row[]): 'empty' | 'complete' {
  if (actual.length === 0) return 'empty'
  if (actual.length !== expected.length) throw new Error('Existing database precondition failed: variant set')
  const actualByIdentity = new Map(actual.map((row) => [`${id(row.event)}:${String(row.slug)}`, row]))
  for (const row of expected) {
    const match = actualByIdentity.get(`${id(row.event)}:${String(row.slug)}`)
    if (!match || !isDeepStrictEqual(comparableVariant(row), comparableVariant(match))) {
      throw new Error('Existing database precondition failed: variant set')
    }
  }
  return 'complete'
}

async function applyBackfill(payload: Payload, seed: CanonicalSeed) {
  const plan = buildExistingDBBackfillPlan(seed)
  const sourceEvents = rows(seed, 'events')
  const sourceLocations = rows(seed, 'locations')
  const sourceGuides = rows(seed, 'guides')
  const maps: SeedIDMap = new Map()
  const totals = { variantsCreated: 0, variantsUpdated: 0, variantsUnchanged: 0, datesUpdated: 0, datesUnchanged: 0 }
  const transactionID = await payload.db.beginTransaction()
  if (!transactionID) throw new Error('Existing database precondition failed: transaction')
  const req = { transactionID } as TransactionRequest
  try {
    const targetEvents = await findAll(payload, 'events', req)
    const targetLocations = await findAll(payload, 'locations', req)
    mapBySlug(sourceEvents, targetEvents, 'events', maps)
    mapBySlug(sourceLocations, targetLocations, 'locations', maps)
    mapBySlug(sourceGuides, await findAll(payload, 'guides', req), 'guides', maps)
    const targetLocationSlugByID = new Map(targetLocations.map((row) => [id(row.id), String(row.slug)]))

    // Resolve and verify all 64 occurrences before the first mutation.
    const resolvedDates = new Map<string, Row>()
    for (const variant of plan) {
      const sourceEvent = sourceEvents.find((event) => event.slug === variant.eventSlug)!
      const targetEventID = maps.get('events')!.get(id(sourceEvent.id))
      for (const occurrence of variant.occurrences) {
        const actual = await resolveOccurrence(payload, targetEventID, occurrence.occurrenceSlug, req)
        if (!occurrenceMatchesReviewedFacts(occurrence, actual, targetLocationSlugByID)) {
          throw new Error('Existing database precondition failed: occurrence facts')
        }
        resolvedDates.set(`${occurrence.eventSlug}:${occurrence.occurrenceSlug}`, actual)
      }
    }
    if (resolvedDates.size !== EXPECTED.launchEventDates) {
      throw new Error('Existing database precondition failed: occurrence count')
    }

    const sourceVariants = rows(seed, 'trip-variants')
    const expectedVariants = sourceVariants.map((variant) =>
      remapRelationships(maps, 'trip-variants', variant) as Row,
    )
    const existingVariants = await findAll(payload, 'trip-variants', req)
    const destinationState = classifyExistingVariantSet(expectedVariants, existingVariants)
    if (destinationState === 'complete') {
      const existingByIdentity = new Map(existingVariants.map((row) => [`${id(row.event)}:${String(row.slug)}`, row]))
      sourceVariants.forEach((variant, index) => {
        maps.set('trip-variants', maps.get('trip-variants') ?? new Map())
        maps.get('trip-variants')!.set(id(variant.id), existingByIdentity.get(`${id(expectedVariants[index].event)}:${String(variant.slug)}`)!.id as number)
        totals.variantsUnchanged += 1
      })
    } else {
      for (let index = 0; index < sourceVariants.length; index += 1) {
        const data = { ...expectedVariants[index] }
        delete data.id
        delete data.createdAt
        delete data.updatedAt
        const created = await payload.create({
          collection: 'trip-variants',
          // Seed rows are checked against the reviewed collection contract above.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: data as any,
          depth: 0, overrideAccess: true, req,
          context: { disableRevalidate: true },
        })
        maps.set('trip-variants', maps.get('trip-variants') ?? new Map())
        maps.get('trip-variants')!.set(id(sourceVariants[index].id), (created as { id: number }).id)
        totals.variantsCreated += 1
      }
    }

    for (const sourceDate of rows(seed, 'event-dates').filter((date) => date.tripVariant != null)) {
      const sourceEvent = sourceEvents.find((event) => id(event.id) === id(sourceDate.event))!
      const target = resolvedDates.get(`${String(sourceEvent.slug)}:${String(sourceDate.slug)}`)!
      const data = remapRelationships(maps, 'event-dates', {
        tripVariant: sourceDate.tripVariant,
        publicDateKey: sourceDate.publicDateKey,
      }) as Row
      if (isDeepStrictEqual(id(target.tripVariant), id(data.tripVariant)) && target.publicDateKey === data.publicDateKey) {
        totals.datesUnchanged += 1
        continue
      }
      await payload.update({
        collection: 'event-dates', id: target.id as number, data, depth: 0,
        overrideAccess: true, req, context: { disableRevalidate: true },
      })
      totals.datesUpdated += 1
    }
    await payload.db.commitTransaction(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
  return totals
}

async function main() {
  const seed = await readCanonicalSeed(CANONICAL_SEED_FILE)
  const plan = buildExistingDBBackfillPlan(seed)
  if (!process.argv.includes('--apply')) {
    console.log(JSON.stringify({ mode: 'review', ...EXPECTED, eventDates: plan.flatMap((entry) => entry.occurrences).length }))
    return
  }
  await import('dotenv/config')
  assertNotProduction({ allowProduction: false })
  process.env.PAYLOAD_DISABLE_DB_PUSH = 'true'
  const config = await (await import('../../src/payload.config')).default
  config.logger = { options: { level: 'silent' } } as typeof config.logger
  const payload = await getPayload({ config })
  console.log(JSON.stringify({ mode: 'apply', ...(await applyBackfill(payload, seed)) }))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const safe = error instanceof Error && /^(Reviewed Trip Variant precondition failed|Existing database precondition failed): [a-z-]+$/.test(error.message)
      ? error.message
      : 'Existing database Trip Variant backfill failed'
    console.error(safe)
    process.exitCode = 1
  })
}
