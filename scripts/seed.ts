/**
 * Canonical content seed for a freshly provisioned Payload database.
 *
 * Reads a Payload-level snapshot exported from a known-good database. This is
 * the normal seed path; legacy importers are only for refreshing that snapshot.
 */
import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { sql } from '@payloadcms/db-postgres'
import { getPayload, type CollectionSlug, type Payload, type Where } from 'payload'
import config from '../src/payload.config'
import {
  assertNotProduction,
  CANONICAL_SEED_COLLECTIONS,
  parseSeedArgs,
  readCanonicalSeed,
  type CanonicalSeed,
} from './canonical-seed/shared'

type ImportTotals = {
  created: number
  updated: number
  skipped: number
}

type SeedID = string | number
type SeedIDMap = Map<CollectionSlug, Map<string, SeedID>>

function collectionRows(seed: CanonicalSeed, slug: CollectionSlug) {
  return seed.collections.find((collection) => collection.slug === slug)?.rows ?? []
}

function idKey(id: unknown) {
  return String(id)
}

function rememberID(
  maps: SeedIDMap,
  collection: CollectionSlug,
  sourceID: unknown,
  targetID: unknown,
) {
  if (sourceID === null || sourceID === undefined || targetID === null || targetID === undefined) return
  const collectionMap = maps.get(collection) ?? new Map<string, SeedID>()
  collectionMap.set(idKey(sourceID), targetID as SeedID)
  maps.set(collection, collectionMap)
}

function mappedID(maps: SeedIDMap, collection: CollectionSlug, value: unknown) {
  if (value === null || value === undefined) return value
  return maps.get(collection)?.get(idKey(value)) ?? value
}

function remapRelationValue(maps: SeedIDMap, collection: CollectionSlug, value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => remapRelationValue(maps, collection, entry))
  if (value && typeof value === 'object' && 'value' in value) {
    return {
      ...value,
      value: mappedID(maps, collection, (value as { value?: unknown }).value),
    }
  }
  return mappedID(maps, collection, value)
}

function relationForField(parentCollection: CollectionSlug, fieldName: string): CollectionSlug | undefined {
  if (fieldName === 'airportRefs' || fieldName === 'airportFrom' || fieldName === 'airportTo') {
    return 'airports'
  }
  if (fieldName === 'airports') return 'airports'
  if (fieldName === 'event') return 'events'
  if (fieldName === 'events') return 'events'
  if (fieldName === 'eventDate') return 'event-dates'
  if (fieldName === 'eventDates') return 'event-dates'
  if (fieldName === 'location') return 'locations'
  if (fieldName === 'locations') return 'locations'
  if (fieldName === 'guide') return 'guides'
  if (fieldName === 'guides') return 'guides'
  if (fieldName === 'program') return 'programs'
  if (fieldName === 'programs') return 'programs'
  if (fieldName === 'difficulty') return 'difficulties'
  if (fieldName === 'difficulties') return 'difficulties'
  if (fieldName === 'partner') return 'partners'
  if (fieldName === 'partners') return 'partners'
  if (fieldName === 'review') return 'reviews'
  if (fieldName === 'reviews') return 'reviews'
  if (fieldName === 'faq') return 'faqs'
  if (fieldName === 'faqs') return 'faqs'
  if (fieldName === 'post') return 'posts'
  if (fieldName === 'posts') return 'posts'
  if (fieldName === 'category') return 'post-categories'
  if (fieldName === 'categories' && parentCollection === 'posts') return 'post-categories'
  if (fieldName === 'categories' && parentCollection === 'events') return 'categories'
  return undefined
}

function remapRelationships(
  maps: SeedIDMap,
  parentCollection: CollectionSlug,
  value: unknown,
  fieldName?: string,
): unknown {
  if (fieldName) {
    const relation = relationForField(parentCollection, fieldName)
    if (relation) return remapRelationValue(maps, relation, value)
  }

  if (Array.isArray(value)) {
    return value.map((entry) => remapRelationships(maps, parentCollection, entry))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        remapRelationships(maps, parentCollection, entry, key),
      ]),
    )
  }

  return value
}

function relationArrayKey(value: unknown) {
  const values = Array.isArray(value) ? value : value === null || value === undefined ? [] : [value]
  return values.map((entry) => idKey(entry)).sort().join(',')
}

function dateKey(value: unknown) {
  if (typeof value !== 'string') return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function eventDateFingerprint(row: Record<string, unknown>) {
  return [
    idKey(row.event),
    dateKey(row.dateFrom),
    dateKey(row.dateTo),
    String(row.price ?? ''),
    String(row.vat ?? ''),
    String(row.currency ?? ''),
    String(row.capacity ?? ''),
    String(row.minParticipants ?? ''),
    String(row.active ?? ''),
    idKey(row.airportFrom),
    idKey(row.airportTo),
    relationArrayKey(row.locations),
    relationArrayKey(row.guides),
  ].join('|')
}

async function findOne(
  payload: Payload,
  collection: CollectionSlug,
  where: Where,
): Promise<Record<string, unknown> | undefined> {
  const result = await payload.find({
    collection,
    where,
    depth: 0,
    limit: 1,
  })
  return result.docs[0] as unknown as Record<string, unknown> | undefined
}

async function existsById(payload: Payload, collection: CollectionSlug, id: unknown) {
  if (id === null || id === undefined) return false
  const result = await payload.find({
    collection,
    where: { id: { equals: id } },
    depth: 0,
    limit: 1,
  })
  return Boolean(result.docs[0])
}

async function findExistingRow(
  payload: Payload,
  collection: CollectionSlug,
  row: Record<string, unknown>,
  options: { forceCreateWhenMissingID?: boolean } = {},
): Promise<Record<string, unknown> | undefined> {
  if (typeof row.slug === 'string') {
    const bySlug = await findOne(payload, collection, { slug: { equals: row.slug } })
    if (bySlug) return bySlug
  }

  if (collection === 'airports' && typeof row.iata === 'string') {
    const byIata = await findOne(payload, collection, { iata: { equals: row.iata } })
    if (byIata) return byIata
  }

  if (
    (collection === 'difficulties' || collection === 'categories' || collection === 'post-categories') &&
    typeof row.name === 'string'
  ) {
    const byName = await findOne(payload, collection, { name: { equals: row.name } })
    if (byName) return byName
  }

  if (collection === 'faqs' && typeof row.question === 'string') {
    const byQuestion = await findOne(payload, collection, { question: { equals: row.question } })
    if (byQuestion) return byQuestion
  }

  if (collection === 'reviews' && typeof row.reviewerName === 'string' && typeof row.quote === 'string') {
    const byReviewerAndQuote = await findOne(payload, collection, {
      and: [
        { reviewerName: { equals: row.reviewerName } },
        { quote: { equals: row.quote } },
      ],
    })
    if (byReviewerAndQuote) return byReviewerAndQuote
  }

  if (options.forceCreateWhenMissingID) return undefined

  if (collection === 'event-dates' && row.event && row.dateFrom && row.dateTo) {
    const result = await payload.find({
      collection,
      where: {
        and: [
          { event: { equals: row.event } },
          { dateFrom: { equals: row.dateFrom } },
          { dateTo: { equals: row.dateTo } },
        ],
      },
      depth: 0,
      limit: 100,
    })
    const expected = eventDateFingerprint(row)
    const match = (result.docs as unknown as Array<Record<string, unknown>>).find(
      (doc) => eventDateFingerprint(doc) === expected,
    )
    if (match) return match
  }

  if (row.id !== null && row.id !== undefined) {
    const byID = await findOne(payload, collection, { id: { equals: row.id } })
    if (byID) return byID
  }

  return undefined
}

async function upsertRow(
  payload: Payload,
  collection: CollectionSlug,
  row: Record<string, unknown>,
  maps: SeedIDMap,
  options: { forceCreateWhenMissingID?: boolean } = {},
): Promise<'created' | 'updated' | 'skipped'> {
  const id = row.id
  if (id === null || id === undefined) return 'skipped'

  const data = remapRelationships(maps, collection, row) as Record<string, unknown>
  const existing = await findExistingRow(payload, collection, data, options)
  const existingID = existing?.id
  if (existingID !== null && existingID !== undefined) {
    rememberID(maps, collection, id, existingID)
  }

  const exists = existingID !== null && existingID !== undefined
  if (exists) {
    await payload.update({
      collection,
      id: existingID as string | number,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
      depth: 0,
    })
    return 'updated'
  }

  const created = await payload.create({
    collection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data as any,
    depth: 0,
  })
  rememberID(maps, collection, id, (created as { id?: unknown }).id)
  return 'created'
}

function dateValue(value: unknown): Date {
  const date = new Date(typeof value === 'string' ? value : Date.now())
  if (Number.isNaN(date.getTime())) return new Date()
  return date
}

async function importMediaRow(
  payload: Payload,
  row: Record<string, unknown>,
  maps: SeedIDMap,
): Promise<'created' | 'updated' | 'skipped'> {
  if (typeof row.id !== 'string') return 'skipped'
  const exists = await existsById(payload, 'media', row.id)
  rememberID(maps, 'media', row.id, row.id)

  await payload.db.drizzle.execute(sql`
    insert into media (
      id,
      alt,
      url,
      thumbnail_u_r_l,
      filename,
      mime_type,
      filesize,
      width,
      height,
      focal_x,
      focal_y,
      created_at,
      updated_at
    )
    values (
      ${row.id},
      ${String(row.alt ?? '')},
      ${typeof row.url === 'string' ? row.url : null},
      ${typeof row.thumbnailURL === 'string' ? row.thumbnailURL : null},
      ${typeof row.filename === 'string' ? row.filename : null},
      ${typeof row.mimeType === 'string' ? row.mimeType : null},
      ${typeof row.filesize === 'number' ? row.filesize : null},
      ${typeof row.width === 'number' ? row.width : null},
      ${typeof row.height === 'number' ? row.height : null},
      ${typeof row.focalX === 'number' ? row.focalX : null},
      ${typeof row.focalY === 'number' ? row.focalY : null},
      ${dateValue(row.createdAt)},
      ${dateValue(row.updatedAt)}
    )
    on conflict (id) do update set
      alt = excluded.alt,
      url = excluded.url,
      thumbnail_u_r_l = excluded.thumbnail_u_r_l,
      filename = excluded.filename,
      mime_type = excluded.mime_type,
      filesize = excluded.filesize,
      width = excluded.width,
      height = excluded.height,
      focal_x = excluded.focal_x,
      focal_y = excluded.focal_y,
      updated_at = excluded.updated_at
  `)

  return exists ? 'updated' : 'created'
}

async function importCollection(
  payload: Payload,
  seed: CanonicalSeed,
  collection: CollectionSlug,
  maps: SeedIDMap,
): Promise<ImportTotals> {
  const totals: ImportTotals = { created: 0, updated: 0, skipped: 0 }
  const rows = collectionRows(seed, collection)
  const initialCount =
    collection === 'media' ? { totalDocs: 0 } : await payload.count({ collection })

  for (const row of rows) {
    try {
      const result =
        collection === 'media'
          ? await importMediaRow(payload, row, maps)
          : await upsertRow(payload, collection, row, maps, {
              forceCreateWhenMissingID:
                collection === 'event-dates' && initialCount.totalDocs === 0,
            })
      totals[result] += 1
    } catch (error) {
      console.error('canonical seed row failed:', {
        collection,
        id: row.id,
        slug: row.slug,
        title: row.title ?? row.name ?? row.question ?? row.reviewerName,
      })
      throw error
    }
  }

  return totals
}

async function main() {
  const args = parseSeedArgs(process.argv.slice(2))
  assertNotProduction(args)

  const seed = await readCanonicalSeed(args.file)
  const payload = await getPayload({ config })
  const maps: SeedIDMap = new Map()

  for (const { slug } of CANONICAL_SEED_COLLECTIONS) {
    const totals = await importCollection(payload, seed, slug, maps)
    console.log(
      [
        `canonical seed: ${slug}`,
        `created=${totals.created}`,
        `updated=${totals.updated}`,
        `skipped=${totals.skipped}`,
      ].join(' '),
    )
  }

  console.log(`canonical seed complete: ${args.file}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('canonical seed failed:', err)
      process.exit(1)
    })
}
