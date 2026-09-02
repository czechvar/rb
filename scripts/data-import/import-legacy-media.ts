/**
 * One-time legacy media upload into Payload.
 *
 * Reads the downloaded-media manifest from the external transfer directory,
 * creates Payload media records with stable `med_...` IDs, and writes an
 * external lookup JSON for later catalogue seed generation.
 */
import './env'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'

const DEFAULT_TRANSFER_ROOT =
  '/media/czechspekk/ws-backup-data-1/xbusters/rockbusters/media-transfer'
const DEFAULT_PIPELINE_JSON = path.resolve(
  '.scratch/legacy-media/legacy-media-pipeline.json',
)
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type Args = {
  allowProduction: boolean
  limit: number | null
  offset: number
  transferRoot: string
  pipelineJson: string
}

type DownloadManifestRow = {
  status: 'downloaded' | 'failed' | string
  legacyMediaId: number
  sourceUrl?: string
  path?: string
  bytes?: number
  contentType?: string
}

type LegacyMediaFile = {
  legacyMediaId: number
  originalName?: string | null
  providerReference?: string | null
  providerName?: string | null
  providerMetadata?: unknown
  context?: string | null
  mediaKind?: string | null
  contentType?: string | null
  contentSize?: number | null
  width?: number | null
  height?: number | null
  description?: string | null
  authorName?: string | null
}

type LegacyMediaPipeline = {
  mediaFiles: LegacyMediaFile[]
}

type ImportLookupRecord = {
  legacyMediaId: number
  mediaId: string
  filename: string
  alt: string
  sourceUrl: string | null
  localPath: string
  legacy: {
    context: string | null
    originalName: string | null
    providerReference: string | null
    contentType: string | null
    contentSize: number | null
    width: number | null
    height: number | null
    description: string | null
    authorName: string | null
  }
}

type Totals = {
  candidates: number
  uploaded: number
  reused: number
  missingLocalFile: number
  failed: number
}

function legacyMediaPayloadId(legacyMediaId: number): string {
  return `med_${createHash('sha256').update(`legacy-media:${legacyMediaId}`).digest('hex').slice(0, 24)}`
}

function parseArgs(argv: string[]): Args {
  const valueFor = (name: string) => {
    const exact = argv.find((arg) => arg.startsWith(`${name}=`))
    if (exact) return exact.slice(name.length + 1)
    const index = argv.indexOf(name)
    return index >= 0 ? argv[index + 1] : undefined
  }

  const limitValue = valueFor('--limit')
  const offsetValue = valueFor('--offset')

  return {
    allowProduction: argv.includes('--allow-production'),
    limit: limitValue ? Number(limitValue) : null,
    offset: offsetValue ? Number(offsetValue) : 0,
    transferRoot: valueFor('--transfer-root') ?? DEFAULT_TRANSFER_ROOT,
    pipelineJson: valueFor('--pipeline-json') ?? DEFAULT_PIPELINE_JSON,
  }
}

function assertValidArgs(args: Args) {
  if (args.limit !== null && (!Number.isInteger(args.limit) || args.limit < 1)) {
    throw new Error('--limit must be a positive integer')
  }
  if (!Number.isInteger(args.offset) || args.offset < 0) {
    throw new Error('--offset must be a non-negative integer')
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

async function readJsonl<T>(file: string): Promise<T[]> {
  const text = await fs.readFile(file, 'utf8')
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as T)
}

async function readPipeline(file: string): Promise<Map<number, LegacyMediaFile>> {
  const parsed = JSON.parse(await fs.readFile(file, 'utf8')) as LegacyMediaPipeline
  return new Map(parsed.mediaFiles.map((media) => [media.legacyMediaId, media]))
}

async function findMedia(payload: Payload, id: string) {
  const existing = await payload.find({
    collection: 'media',
    where: { id: { equals: id } },
    depth: 0,
    limit: 1,
  })

  return existing.docs[0] ?? null
}

function basenameForDownloadedPath(downloadedPath: string): string {
  return path.basename(downloadedPath)
}

function altFor(media: LegacyMediaFile | undefined, row: DownloadManifestRow): string {
  return (
    media?.originalName?.trim() ||
    media?.providerReference?.trim() ||
    row.path?.split('/').pop() ||
    `Legacy media ${row.legacyMediaId}`
  )
}

async function importOne(
  payload: Payload,
  args: Args,
  row: DownloadManifestRow,
  media: LegacyMediaFile | undefined,
): Promise<{ record: ImportLookupRecord; uploaded: boolean; missingLocalFile: boolean }> {
  const mediaId = legacyMediaPayloadId(row.legacyMediaId)
  const relativePath = row.path
  if (!relativePath) throw new Error(`Downloaded row ${row.legacyMediaId} has no path`)

  const localPath = path.join(args.transferRoot, 'files', relativePath)
  const filename = basenameForDownloadedPath(relativePath)
  const sourceUrl = row.sourceUrl ?? null
  const record: ImportLookupRecord = {
    legacyMediaId: row.legacyMediaId,
    mediaId,
    filename,
    alt: altFor(media, row),
    sourceUrl,
    localPath,
    legacy: {
      context: media?.context ?? null,
      originalName: media?.originalName ?? null,
      providerReference: media?.providerReference ?? null,
      contentType: media?.contentType ?? row.contentType ?? null,
      contentSize: media?.contentSize ?? row.bytes ?? null,
      width: media?.width ?? null,
      height: media?.height ?? null,
      description: media?.description ?? null,
      authorName: media?.authorName ?? null,
    },
  }

  const stat = await fs.stat(localPath).catch(() => null)
  if (!stat?.isFile()) return { record, uploaded: false, missingLocalFile: true }

  const existing = await findMedia(payload, mediaId)
  if (existing) return { record, uploaded: false, missingLocalFile: false }

  await payload.create({
    collection: 'media',
    data: {
      id: mediaId,
      alt: record.alt,
    },
    file: {
      data: await fs.readFile(localPath),
      mimetype: row.contentType || media?.contentType || 'application/octet-stream',
      name: filename,
      size: stat.size,
    },
  })

  return { record, uploaded: true, missingLocalFile: false }
}

async function writeLookup(args: Args, records: ImportLookupRecord[], totals: Totals) {
  const outFile = path.join(args.transferRoot, 'payload-media-lookup.json')
  const byLegacyMediaId = Object.fromEntries(
    records.map((record) => [String(record.legacyMediaId), record.mediaId]),
  )
  await fs.writeFile(
    outFile,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        transferRoot: args.transferRoot,
        pipelineJson: args.pipelineJson,
        totals,
        byLegacyMediaId,
        records,
      },
      null,
      2,
    )}\n`,
  )
  return outFile
}

export async function importLegacyMedia(payload: Payload, args: Args) {
  const manifestFile = path.join(args.transferRoot, 'download-manifest.jsonl')
  const [manifestRows, mediaById] = await Promise.all([
    readJsonl<DownloadManifestRow>(manifestFile),
    readPipeline(args.pipelineJson),
  ])

  const downloadedRows = manifestRows
    .filter((row) => row.status === 'downloaded')
    .sort((a, b) => a.legacyMediaId - b.legacyMediaId)
  const selectedRows = downloadedRows.slice(
    args.offset,
    args.limit === null ? undefined : args.offset + args.limit,
  )

  const totals: Totals = {
    candidates: selectedRows.length,
    uploaded: 0,
    reused: 0,
    missingLocalFile: 0,
    failed: 0,
  }
  const records: ImportLookupRecord[] = []

  for (const row of selectedRows) {
    try {
      const result = await importOne(payload, args, row, mediaById.get(row.legacyMediaId))
      records.push(result.record)
      if (result.missingLocalFile) totals.missingLocalFile += 1
      else if (result.uploaded) totals.uploaded += 1
      else totals.reused += 1
      console.log(
        `${result.uploaded ? 'uploaded' : result.missingLocalFile ? 'missing' : 'reused'} ${row.legacyMediaId} ${result.record.mediaId} ${result.record.filename}`,
      )
    } catch (cause) {
      totals.failed += 1
      console.error(
        `failed ${row.legacyMediaId}: ${cause instanceof Error ? cause.message : String(cause)}`,
      )
    }
  }

  const lookupFile = await writeLookup(args, records, totals)
  return { totals, lookupFile }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertValidArgs(args)
  assertNotProduction(args)

  const payload = await getPayload({ config })
  const { totals, lookupFile } = await importLegacyMedia(payload, args)
  console.log(
    [
      `legacy media: candidates=${totals.candidates}`,
      `uploaded=${totals.uploaded}`,
      `reused=${totals.reused}`,
      `missingLocalFile=${totals.missingLocalFile}`,
      `failed=${totals.failed}`,
      `lookup=${lookupFile}`,
    ].join(' '),
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('legacy media import failed:', err)
      process.exit(1)
    })
}
