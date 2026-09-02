/**
 * Import curated legacy destination research into Payload locations.
 *
 * Source data is a committed snapshot under:
 *   scripts/data-import/seed/legacy-destinations/*.curated.json
 *
 * This is intentionally separate from `data-import:locations`, which keeps the
 * older raw legacy location import skip-if-exists behavior.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { locationTaxonomy, type LocationTaxonomyField } from '../../src/lib/taxonomy/location'

const SEED_DIR = path.resolve(import.meta.dirname, 'seed')
const LEGACY_DESTINATION_DIR = path.join(SEED_DIR, 'legacy-destinations')
const DEFAULT_MEDIA_LOOKUP_FILE =
  '/media/czechspekk/ws-backup-data-1/xbusters/rockbusters/media-transfer/payload-media-lookup.json'
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type LegacyLocationSeed = {
  rows: Array<{
    slug: string
    body?: string | null
    latitude: number
    longitude: number
    country_nicename?: string | null
    keywords?: string | null
    description?: string | null
  }>
}

type CuratedDestination = {
  slug: string
  title: string
  status: 'enriched' | 'partial' | 'insufficient-source'
  sources: Array<{
    id: string
    url?: string | null
    title?: string | null
    publisher?: string | null
    accessedAt?: string | null
    notes?: string | null
  }>
  facts: {
    locationKind?: string | null
    destinationScope?: string | null
    climbingStyles?: string[]
    rockTypes?: string[]
    rockFeatures?: string[]
    settingTags?: string[]
    bestSeasons?: string[]
    avoidSeasons?: string[]
    nearestAirports?: string[]
    accommodationTags?: string[]
    transportTags?: string[]
    gradeRange?: string | null
    routeCount?: number | null
    problemCount?: number | null
    sectorCount?: number | null
  }
  media?: {
    mainImage?: {
      legacyMediaId?: number | null
    } | null
  }
  sections: Array<{
    key: string
    heading: string
    status: string
    body?: string | null
    sourceRefs?: string[]
    warnings?: string[]
  }>
}

type PayloadMediaLookup = {
  byLegacyMediaId?: Record<string, string>
}

export type BuiltLocationData = {
  slug: string
  data: Record<string, unknown>
}

function assertNotProduction() {
  const dbUrl = process.env.DATABASE_URL ?? ''
  if (dbUrl.includes(PRODUCTION_DB_HOST) && !process.argv.includes('--allow-production')) {
    console.error(
      'DATABASE_URL points at the PRODUCTION Neon branch. ' +
        'Re-run with --allow-production only if that is intentional.',
    )
    process.exit(1)
  }
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, 'utf8')) as T
}

async function readCuratedDestinations(inputDir = LEGACY_DESTINATION_DIR) {
  const stat = await fs.stat(inputDir)
  if (stat.isFile()) return [await readJson<CuratedDestination>(inputDir)]

  const entries = await fs.readdir(inputDir)
  const files = entries.filter((entry) => entry.endsWith('.curated.json')).sort()
  if (!files.length) {
    throw new Error(`No *.curated.json files found in ${path.relative(process.cwd(), inputDir)}`)
  }

  return Promise.all(files.map((file) => readJson<CuratedDestination>(path.join(inputDir, file))))
}

function parseArgs(argv: string[]) {
  const parsed: { input?: string } = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--input') {
      parsed.input = argv[++index]
    } else if (arg === '--allow-production') {
      continue
    } else if (arg === '--help') {
      console.log(
        'Usage: pnpm data-import:legacy-destinations [--input FILE_OR_DIR] [--allow-production]',
      )
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return parsed
}

async function readLegacyLocationSeed() {
  const seed = await readJson<LegacyLocationSeed>(path.join(SEED_DIR, 'locations.json'))
  return new Map(seed.rows.map((row) => [row.slug, row]))
}

async function readPayloadMediaLookup() {
  const file = process.env.PAYLOAD_MEDIA_LOOKUP_FILE ?? DEFAULT_MEDIA_LOOKUP_FILE
  try {
    const lookup = await readJson<PayloadMediaLookup>(file)
    return new Map(Object.entries(lookup.byLegacyMediaId ?? {}))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return new Map<string, string>()
    throw err
  }
}

function assertKnownValue(field: LocationTaxonomyField, value: string | null | undefined) {
  if (!value) return
  if (!(value in locationTaxonomy[field])) {
    throw new Error(`Unknown taxonomy value for ${field}: ${value}`)
  }
}

function assertKnownValues(field: LocationTaxonomyField, values: string[] | null | undefined) {
  for (const value of values ?? []) assertKnownValue(field, value)
}

function cleanText(value: string | null | undefined): string | undefined {
  const cleaned = value?.replace(/\s+/g, ' ').trim()
  return cleaned || undefined
}

function cleanMultilineText(value: string | null | undefined): string | undefined {
  const cleaned = value
    ?.split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')

  return cleaned || undefined
}

function sectionBody(record: CuratedDestination, key: string): string | undefined {
  const section = record.sections.find((candidate) => candidate.key === key)
  if (!section || section.status === 'missing' || section.status === 'not-applicable')
    return undefined
  return cleanMultilineText(section.body)
}

function contentSections(record: CuratedDestination) {
  return record.sections.map((section) => ({
    key: section.key,
    heading: section.heading,
    status: section.status,
    body: cleanMultilineText(section.body) ?? null,
    sourceRefs: section.sourceRefs ?? [],
    warnings: section.warnings ?? [],
  }))
}

function normalizeDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

export function buildLocationData(
  record: CuratedDestination,
  legacySeed: LegacyLocationSeed['rows'][number] | undefined,
  mediaLookup = new Map<string, string>(),
): BuiltLocationData {
  const facts = record.facts ?? {}

  assertKnownValue('locationKind', facts.locationKind)
  assertKnownValue('destinationScope', facts.destinationScope)
  assertKnownValues('climbingStyles', facts.climbingStyles)
  assertKnownValues('rockTypes', facts.rockTypes)
  assertKnownValues('rockFeatures', facts.rockFeatures)
  assertKnownValues('settingTags', facts.settingTags)
  assertKnownValues('seasons', facts.bestSeasons)
  assertKnownValues('seasons', facts.avoidSeasons)
  assertKnownValues('accommodationTags', facts.accommodationTags)
  assertKnownValues('transportTags', facts.transportTags)

  const data: Record<string, unknown> = {
    name: record.title,
    slug: record.slug,
    active: true,
    contentCompleteness: record.status,
    locationKind: facts.locationKind ?? null,
    destinationScope: facts.destinationScope ?? null,
    climbingStyles: facts.climbingStyles ?? [],
    rockTypes: facts.rockTypes ?? [],
    rockFeatures: facts.rockFeatures ?? [],
    settingTags: facts.settingTags ?? [],
    bestSeasons: facts.bestSeasons ?? [],
    avoidSeasons: facts.avoidSeasons ?? [],
    accommodationTags: facts.accommodationTags ?? [],
    transportTags: facts.transportTags ?? [],
    nearestAirports: (facts.nearestAirports ?? []).map((name) => ({ name })),
    gradeRange: facts.gradeRange ?? null,
    routeCount: facts.routeCount ?? null,
    problemCount: facts.problemCount ?? null,
    sectorCount: facts.sectorCount ?? null,
    seasonSummary: sectionBody(record, 'season') ?? null,
    transportSummary: sectionBody(record, 'transport') ?? null,
    accommodationSummary: sectionBody(record, 'stay') ?? null,
    content: null,
    contentSections: contentSections(record),
    sourceReferences: record.sources.map((source) => ({
      sourceId: source.id,
      title: cleanText(source.title) ?? null,
      url: cleanText(source.url) ?? null,
      publisher: cleanText(source.publisher) ?? null,
      accessedAt: normalizeDate(source.accessedAt) ?? null,
      notes: cleanText(source.notes) ?? null,
    })),
  }

  const legacyMainImageId = record.media?.mainImage?.legacyMediaId
  const mainPictureId = legacyMainImageId ? mediaLookup.get(String(legacyMainImageId)) : undefined
  if (mainPictureId) data.mainPicture = mainPictureId
  if (legacySeed?.country_nicename) data.country = legacySeed.country_nicename
  if (legacySeed && (legacySeed.latitude !== 0 || legacySeed.longitude !== 0)) {
    data.coordinates = [legacySeed.longitude, legacySeed.latitude]
  }

  const seo: Record<string, unknown> = {}
  if (legacySeed?.keywords) seo.keywords = legacySeed.keywords
  if (legacySeed?.description) seo.description = legacySeed.description
  if (Object.keys(seo).length) data.seo = seo

  return { slug: record.slug, data }
}

async function upsertLocation(
  payload: Payload,
  slug: string,
  data: Record<string, unknown>,
): Promise<'created' | 'updated'> {
  const existing = await payload.find({
    collection: 'locations',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })

  const existingDoc = existing.docs[0]
  if (existingDoc) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.update({ collection: 'locations', id: existingDoc.id, data: data as any })
    return 'updated'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.create({ collection: 'locations', data: data as any })
  return 'created'
}

async function main() {
  assertNotProduction()
  const args = parseArgs(process.argv.slice(2))

  const payload = await getPayload({ config })
  const legacyLocations = await readLegacyLocationSeed()
  const mediaLookup = await readPayloadMediaLookup()
  const records = await readCuratedDestinations(args.input)

  const totals = { created: 0, updated: 0 }
  for (const record of records) {
    const built = buildLocationData(record, legacyLocations.get(record.slug), mediaLookup)
    const result = await upsertLocation(payload, built.slug, built.data)
    totals[result] += 1
  }

  console.log(
    `legacy destinations: created=${totals.created} updated=${totals.updated} total=${records.length}`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('legacy destination import failed:', err)
      process.exit(1)
    })
}
