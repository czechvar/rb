/**
 * Backfill missing Event mainPicture relationships from legacy event-date media.
 *
 * This is persistent catalogue import data. It only updates events that exist
 * without mainPicture and resolves every legacy media ID through the committed
 * legacy media lookup produced by the media import pipeline.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'

const SEED_DIR = path.resolve(import.meta.dirname, 'seed')
const EVENT_DATES_FILE = path.join(SEED_DIR, 'legacy-event-dates.json')
const DEFAULT_MEDIA_LOOKUP_FILE =
  '/media/czechspekk/ws-backup-data-1/xbusters/rockbusters/media-transfer/payload-media-lookup.json'
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type Args = {
  allowProduction: boolean
  dryRun: boolean
}

type SeedFile<Row> = {
  rows: Row[]
}

type LegacyEventDateRow = {
  eventSlug: string
  title: string | null
  coverImageId: number | null
  coverImageDetailPageId: number | null
  galleryMediaIds: number[]
}

type MediaLookupFile = {
  byLegacyMediaId?: Record<string, string>
}

type Candidate = {
  legacyMediaId: number
  payloadMediaId: string
  score: number
  source: string
}

type CuratedFallback = {
  legacyMediaId?: number
  sourceEventSlug?: string
  titleIncludes?: string[]
}

const CURATED_FALLBACKS: Record<string, CuratedFallback> = {
  'deep-blue-psicobloc': {
    sourceEventSlug: 'deep-water-solo-mallorca',
    titleIncludes: ['deep blue', 'psicobloc'],
  },
  'dolomite-dolce-vita': {
    sourceEventSlug: 'sport-climbing',
    titleIncludes: ['dolomite', 'dolce vita'],
  },
  'sport-climbing-basics': {
    legacyMediaId: 759,
  },
}

const SKIP_SLUG_PREFIXES = ['mcp-smoke-']

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

function titleMatches(row: LegacyEventDateRow, terms: string[]): boolean {
  const title = (row.title ?? '').toLowerCase()
  return terms.every((term) => title.includes(term))
}

function mediaCandidate(
  legacyMediaId: number | null | undefined,
  mediaByLegacyId: Map<string, string>,
  score: number,
  source: string,
): Candidate | null {
  if (!legacyMediaId) return null
  const payloadMediaId = mediaByLegacyId.get(String(legacyMediaId))
  return payloadMediaId ? { legacyMediaId, payloadMediaId, score, source } : null
}

function rankedCandidates(
  rows: LegacyEventDateRow[],
  mediaByLegacyId: Map<string, string>,
): Candidate[] {
  const candidates = rows.flatMap((row) => [
    mediaCandidate(row.coverImageId, mediaByLegacyId, 3, 'event-date coverImageId'),
    mediaCandidate(row.coverImageDetailPageId, mediaByLegacyId, 2, 'event-date coverImageDetailPageId'),
    ...(row.galleryMediaIds ?? []).map((id) =>
      mediaCandidate(id, mediaByLegacyId, 1, 'event-date galleryMediaIds'),
    ),
  ])

  const byMediaId = new Map<string, Candidate & { count: number }>()
  for (const candidate of candidates) {
    if (!candidate) continue
    const existing = byMediaId.get(candidate.payloadMediaId)
    if (existing) {
      existing.count += 1
      existing.score += candidate.score
      continue
    }
    byMediaId.set(candidate.payloadMediaId, { ...candidate, count: 1 })
  }

  return [...byMediaId.values()].sort((a, b) => b.score - a.score || b.count - a.count)
}

function candidateForSlug(
  slug: string,
  rows: LegacyEventDateRow[],
  mediaByLegacyId: Map<string, string>,
): Candidate | null {
  const curated = CURATED_FALLBACKS[slug]
  if (curated?.legacyMediaId) {
    return mediaCandidate(
      curated.legacyMediaId,
      mediaByLegacyId,
      100,
      `curated legacy media ${curated.legacyMediaId}`,
    )
  }

  const sourceRows = curated?.sourceEventSlug
    ? rows.filter((row) => {
        if (row.eventSlug !== curated.sourceEventSlug) return false
        return curated.titleIncludes ? titleMatches(row, curated.titleIncludes) : true
      })
    : rows.filter((row) => row.eventSlug === slug)

  return rankedCandidates(sourceRows, mediaByLegacyId)[0] ?? null
}

async function mediaExists(payload: Payload, mediaId: string): Promise<boolean> {
  try {
    await payload.findByID({ collection: 'media', id: mediaId, depth: 0 })
    return true
  } catch {
    return false
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertNotProduction(args)

  const [eventDatesSeed, mediaLookup] = await Promise.all([
    readJson<SeedFile<LegacyEventDateRow>>(EVENT_DATES_FILE),
    readJson<MediaLookupFile>(process.env.PAYLOAD_MEDIA_LOOKUP_FILE ?? DEFAULT_MEDIA_LOOKUP_FILE),
  ])

  const mediaByLegacyId = new Map(Object.entries(mediaLookup.byLegacyMediaId ?? {}))
  const payload = await getPayload({ config })
  const missing = await payload.find({
    collection: 'events',
    where: { mainPicture: { exists: false } },
    sort: 'id',
    depth: 0,
    limit: 1000,
  })

  let updated = 0
  let skipped = 0
  let unresolved = 0

  for (const event of missing.docs) {
    if (SKIP_SLUG_PREFIXES.some((prefix) => event.slug.startsWith(prefix))) {
      skipped += 1
      console.log(`skip ${event.slug}: smoke/test fixture`)
      continue
    }

    const candidate = candidateForSlug(event.slug, eventDatesSeed.rows, mediaByLegacyId)
    if (!candidate) {
      unresolved += 1
      console.log(`unresolved ${event.slug}: no mapped legacy event-date media`)
      continue
    }

    if (!(await mediaExists(payload, candidate.payloadMediaId))) {
      unresolved += 1
      console.log(`unresolved ${event.slug}: missing media ${candidate.payloadMediaId}`)
      continue
    }

    console.log(
      `${args.dryRun ? 'would update' : 'update'} ${event.slug}: ` +
        `${candidate.payloadMediaId} from legacy ${candidate.legacyMediaId} (${candidate.source})`,
    )

    if (!args.dryRun) {
      await payload.update({
        collection: 'events',
        id: event.id,
        data: { mainPicture: candidate.payloadMediaId },
      })
      updated += 1
    }
  }

  console.log(
    `event main-picture backfill: candidates=${missing.totalDocs} updated=${updated} ` +
      `skipped=${skipped} unresolved=${unresolved}${args.dryRun ? ' dry-run=true' : ''}`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('event main-picture backfill failed:', err)
    process.exit(1)
  })
