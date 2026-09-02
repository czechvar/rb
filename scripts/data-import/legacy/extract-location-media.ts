#!/usr/bin/env tsx
/**
 * Extract the committed curated destination slugs' legacy main images.
 *
 * The output is a deterministic manifest consumed by
 * the later full media import. It combines legacy DB metadata with the exact
 * upload URL currently referenced by the live legacy location page.
 */
import '../env'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { findLegacyUploadUrl } from '../legacy-location-media'

const DEFAULT_CONTAINER = process.env.LEGACY_DB_CONTAINER ?? 'rb-legacy-pg-20260827'
const DEFAULT_DB_URL =
  process.env.LEGACY_DB_URL ??
  'postgresql://rockbusters:rockbusters_local@127.0.0.1:5432/rockbusters_legacy'
const DEFAULT_OUT = 'scripts/data-import/seed/legacy-location-media.json'
const CURATED_DIR = 'scripts/data-import/seed/legacy-destinations'
const LEGACY_LOCATION_BASE_URL = 'https://rockbusters.net/location'

type Args = {
  container: string
  dbUrl: string
  out: string
}

type ExtractedRow = {
  slug: string
  title: string
  legacyLocationId: number
  legacyMediaId: number | null
  originalName: string | null
  providerReference: string | null
  contentType: string | null
  width: number | null
  height: number | null
}

type CuratedDestinationWithMedia = {
  media?: unknown
  [key: string]: unknown
}

function parseArgs(argv: string[]): Args {
  const args = {
    container: DEFAULT_CONTAINER,
    dbUrl: DEFAULT_DB_URL,
    out: DEFAULT_OUT,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const readValue = () => {
      if (arg.includes('=')) return arg.slice(arg.indexOf('=') + 1)
      i += 1
      return argv[i]
    }

    if (arg === '--container' || arg.startsWith('--container=')) args.container = readValue()
    else if (arg === '--db-url' || arg.startsWith('--db-url=')) args.dbUrl = readValue()
    else if (arg === '--out' || arg.startsWith('--out=')) args.out = readValue()
    else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return args
}

function printHelp() {
  console.log(`Usage:
  pnpm data-import:extract-location-media [options]

Options:
  --container <name>  Legacy Postgres Docker container, default ${DEFAULT_CONTAINER}
  --db-url <url>      Legacy Postgres URL inside the container
  --out <file>        Output manifest, default ${DEFAULT_OUT}
`)
}

function sqlLiteral(value: string): string {
  return `'${String(value).replaceAll("'", "''")}'`
}

async function readCuratedSlugs() {
  const entries = await fs.readdir(CURATED_DIR)
  const records = await Promise.all(
    entries
      .filter((entry) => entry.endsWith('.curated.json'))
      .sort()
      .map(async (entry) => JSON.parse(await fs.readFile(path.join(CURATED_DIR, entry), 'utf8'))),
  )

  return records.map((record) => record.slug as string)
}

async function writeCuratedMediaReferences(manifest: Awaited<ReturnType<typeof buildManifest>>) {
  for (const row of manifest) {
    const file = path.join(CURATED_DIR, `${row.slug}.curated.json`)
    const record = JSON.parse(await fs.readFile(file, 'utf8')) as CuratedDestinationWithMedia
    record.media = {
      mainImage: row.legacyMediaId
        ? {
            legacyLocationId: row.legacyLocationId,
            legacyMediaId: row.legacyMediaId,
            originalName: row.originalName,
            providerReference: row.providerReference,
            contentType: row.contentType,
            width: row.width,
            height: row.height,
            sourceUrl: row.sourceUrl,
          }
        : null,
    }
    await fs.writeFile(file, `${JSON.stringify(record, null, 2)}\n`)
  }
}

function buildSql(slugs: string[]) {
  const slugValues = slugs.map((slug) => `(${sqlLiteral(slug)})`).join(',')
  return `
WITH wanted(slug) AS (VALUES ${slugValues})
SELECT COALESCE(jsonb_agg(jsonb_build_object(
  'slug', l.slug,
  'title', l.title,
  'legacyLocationId', l.id,
  'legacyMediaId', m.id,
  'originalName', m.name,
  'providerReference', m.provider_reference,
  'contentType', m.content_type,
  'width', m.width,
  'height', m.height
) ORDER BY l.slug), '[]'::jsonb)
FROM wanted w
JOIN location l ON l.slug = w.slug
LEFT JOIN media__media m ON m.id = l.image_id;
`
}

async function fetchSourceUrl(row: ExtractedRow) {
  if (!row.providerReference) return null

  const pageUrl = `${LEGACY_LOCATION_BASE_URL}/${row.slug}/`
  const response = await fetch(pageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${pageUrl}: ${response.status} ${response.statusText}`)
  }

  const uploadUrl = findLegacyUploadUrl(await response.text(), row.providerReference)
  return uploadUrl ? new URL(uploadUrl, 'https://rockbusters.net').href : null
}

async function buildManifest(rows: ExtractedRow[]) {
  const manifest = []
  for (const row of rows) {
    const sourceUrl = await fetchSourceUrl(row)
    manifest.push({
      ...row,
      legacyMediaId: row.legacyMediaId ?? null,
      sourceUrl,
    })
  }
  return manifest
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const slugs = await readCuratedSlugs()
  const result = spawnSync(
    'docker',
    ['exec', args.container, 'psql', args.dbUrl, '-t', '-A', '-c', buildSql(slugs)],
    {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 16,
    },
  )

  if (result.status !== 0) {
    process.stderr.write(result.stderr)
    process.exit(result.status ?? 1)
  }

  const rows = JSON.parse(result.stdout.trim()) as ExtractedRow[]
  const manifest = await buildManifest(rows)

  await fs.mkdir(path.dirname(args.out), { recursive: true })
  await fs.writeFile(args.out, `${JSON.stringify(manifest, null, 2)}\n`)
  await writeCuratedMediaReferences(manifest)

  const withLegacyImage = manifest.filter((row) => row.legacyMediaId).length
  const withSourceUrl = manifest.filter((row) => row.sourceUrl).length
  console.log(
    `legacy location media: rows=${manifest.length} withLegacyImage=${withLegacyImage} withSourceUrl=${withSourceUrl} out=${args.out}`,
  )
}

main().catch((err) => {
  console.error('legacy location media extraction failed:', err)
  process.exit(1)
})
