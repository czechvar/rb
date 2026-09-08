/**
 * Import legacy event-date gallery placements into Payload entity galleries.
 *
 * Per ADR-0007:
 * - single-location date placements append to locations.gallery
 * - all event-date placements roll up to events.gallery
 * - existing gallery order is preserved and missing legacy media is appended
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getPayload, type Payload } from 'payload'

const SEED_DIR = path.resolve(import.meta.dirname, 'seed')
const PLACEMENTS_FILE = path.join(SEED_DIR, 'legacy-gallery-placements.json')
const DEFAULT_MEDIA_LOOKUP_FILE =
  '/media/czechspekk/ws-backup-data-1/xbusters/rockbusters/media-transfer/payload-media-lookup.json'
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type Args = {
  allowProduction: boolean
  dryRun: boolean
}

type SeedFile<Row> = {
  generatedAt: string
  source: string
  rows: Row[]
}

type LegacyGalleryPlacementRow = {
  eventDateId: number
  eventId: number
  eventSlug: string
  eventDateSlug: string
  start: string
  galleryId: number
  locationSlugs: string[]
  galleryMediaIds: Array<number | null>
}

type MediaLookupFile = {
  byLegacyMediaId?: Record<string, string>
}

type GalleryTarget = {
  slug: string
  mediaIds: string[]
}

type GalleryReport = {
  eventTargets: number
  locationTargets: number
  eventsUpdated: number
  locationsUpdated: number
  eventMediaAppended: number
  locationMediaAppended: number
  skippedAmbiguousLocationPlacements: number
  skippedEmptyPlacements: number
  missingEvents: Set<string>
  missingLocations: Set<string>
  missingMedia: Set<string>
}

function parseArgs(argv: string[]): Args {
  return {
    allowProduction: argv.includes('--allow-production'),
    dryRun: argv.includes('--dry-run'),
  }
}

function assertNotProduction({ allowProduction }: Args) {
  const dbUrl = process.env.DATABASE_URL ?? ''
  if (dbUrl.includes(PRODUCTION_DB_HOST) && !allowProduction) {
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

async function readPlacements() {
  return await readJson<SeedFile<LegacyGalleryPlacementRow>>(PLACEMENTS_FILE)
}

async function readPayloadMediaLookup(): Promise<Map<string, string>> {
  const file = process.env.PAYLOAD_MEDIA_LOOKUP_FILE ?? DEFAULT_MEDIA_LOOKUP_FILE
  try {
    const lookup = await readJson<MediaLookupFile>(file)
    return new Map(Object.entries(lookup.byLegacyMediaId ?? {}))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`Media lookup not found at ${file}; gallery media cannot be resolved.`)
      return new Map()
    }
    throw err
  }
}

function appendUnique(target: string[], values: string[]) {
  const seen = new Set(target)
  for (const value of values) {
    if (seen.has(value)) continue
    seen.add(value)
    target.push(value)
  }
}

function relationId(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return id
  }
  return null
}

function existingGalleryIds(doc: { gallery?: unknown[] | null }) {
  return (doc.gallery ?? [])
    .map(relationId)
    .filter((id): id is string | number => id !== null)
    .map(String)
}

function buildLegacyGalleryTargets(
  placements: LegacyGalleryPlacementRow[],
  mediaLookup: Map<string, string>,
  report: GalleryReport,
) {
  const eventTargets = new Map<string, string[]>()
  const locationTargets = new Map<string, string[]>()

  for (const placement of placements) {
    const mediaIds: string[] = []
    for (const legacyMediaId of placement.galleryMediaIds) {
      if (legacyMediaId === null) continue
      const payloadMediaId = mediaLookup.get(String(legacyMediaId))
      if (!payloadMediaId) {
        report.missingMedia.add(String(legacyMediaId))
        continue
      }
      mediaIds.push(payloadMediaId)
    }

    if (!mediaIds.length) {
      report.skippedEmptyPlacements += 1
      continue
    }

    const eventMedia = eventTargets.get(placement.eventSlug) ?? []
    appendUnique(eventMedia, mediaIds)
    eventTargets.set(placement.eventSlug, eventMedia)

    if (placement.locationSlugs.length === 1) {
      const locationSlug = placement.locationSlugs[0]
      const locationMedia = locationTargets.get(locationSlug) ?? []
      appendUnique(locationMedia, mediaIds)
      locationTargets.set(locationSlug, locationMedia)
    } else {
      report.skippedAmbiguousLocationPlacements += 1
    }
  }

  return {
    events: [...eventTargets.entries()].map(([slug, mediaIds]) => ({ slug, mediaIds })),
    locations: [...locationTargets.entries()].map(([slug, mediaIds]) => ({ slug, mediaIds })),
  }
}

async function mergeGallery(
  payload: Payload,
  args: Args,
  collection: 'events' | 'locations',
  target: GalleryTarget,
) {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: target.slug } },
    limit: 1,
    depth: 0,
  })
  const doc = existing.docs[0] as ({ id: number | string; gallery?: unknown[] | null } | undefined)
  if (!doc) return { found: false, appended: 0 }

  const merged = existingGalleryIds(doc)
  const before = merged.length
  appendUnique(merged, target.mediaIds)
  const appended = merged.length - before

  if (!args.dryRun && appended > 0) {
    await payload.update({
      collection,
      id: doc.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { gallery: merged } as any,
    })
  }

  return { found: true, appended }
}

function emptyReport(): GalleryReport {
  return {
    eventTargets: 0,
    locationTargets: 0,
    eventsUpdated: 0,
    locationsUpdated: 0,
    eventMediaAppended: 0,
    locationMediaAppended: 0,
    skippedAmbiguousLocationPlacements: 0,
    skippedEmptyPlacements: 0,
    missingEvents: new Set(),
    missingLocations: new Set(),
    missingMedia: new Set(),
  }
}

function printSet(label: string, values: Set<string>) {
  if (values.size) console.warn(`${label}: ${[...values].sort().join(', ')}`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertNotProduction(args)

  const [seed, mediaLookup] = await Promise.all([readPlacements(), readPayloadMediaLookup()])
  const report = emptyReport()
  const targets = buildLegacyGalleryTargets(seed.rows, mediaLookup, report)
  report.eventTargets = targets.events.length
  report.locationTargets = targets.locations.length

  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config })

  for (const target of targets.locations) {
    const result = await mergeGallery(payload, args, 'locations', target)
    if (!result.found) {
      report.missingLocations.add(target.slug)
      continue
    }
    if (result.appended > 0) report.locationsUpdated += 1
    report.locationMediaAppended += result.appended
  }

  for (const target of targets.events) {
    const result = await mergeGallery(payload, args, 'events', target)
    if (!result.found) {
      report.missingEvents.add(target.slug)
      continue
    }
    if (result.appended > 0) report.eventsUpdated += 1
    report.eventMediaAppended += result.appended
  }

  console.log(
    [
      `legacy galleries: ${args.dryRun ? 'would-update' : 'updated'}`,
      `location-targets=${report.locationTargets}`,
      `locations-updated=${report.locationsUpdated}`,
      `location-media-appended=${report.locationMediaAppended}`,
      `event-targets=${report.eventTargets}`,
      `events-updated=${report.eventsUpdated}`,
      `event-media-appended=${report.eventMediaAppended}`,
      `skipped-ambiguous-location-placements=${report.skippedAmbiguousLocationPlacements}`,
      `skipped-empty-placements=${report.skippedEmptyPlacements}`,
    ].join(' '),
  )
  printSet('missing locations', report.missingLocations)
  printSet('missing events', report.missingEvents)
  printSet('missing media', report.missingMedia)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('legacy gallery import failed:', err)
      process.exit(1)
    })
}

export { buildLegacyGalleryTargets, emptyReport, existingGalleryIds }
