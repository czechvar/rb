/**
 * Seed Payload media DB records for legacy media already stored in R2.
 *
 * This intentionally bypasses Payload upload handling: it does not upload,
 * resize, or delete files. The seed only recreates the media table rows that
 * point Payload at existing `/api/media/file/<filename>` objects.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

const SEED_FILE = path.resolve(import.meta.dirname, 'seed/legacy-media.json')
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type Args = {
  allowProduction: boolean
  updateExisting: boolean
}

type MediaSeedRow = {
  id: string
  alt: string
  url: string | null
  thumbnailURL: string | null
  filename: string | null
  mimeType: string | null
  filesize: number | null
  width: number | null
  height: number | null
  focalX: number | null
  focalY: number | null
  createdAt: string
  updatedAt: string
}

type MediaSeedFile = {
  generatedAt: string
  source: string
  rows: MediaSeedRow[]
}

function parseArgs(argv: string[]): Args {
  return {
    allowProduction: argv.includes('--allow-production'),
    updateExisting: argv.includes('--update-existing'),
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

async function readSeed(): Promise<MediaSeedFile> {
  try {
    return JSON.parse(await fs.readFile(SEED_FILE, 'utf8')) as MediaSeedFile
  } catch (cause) {
    throw new Error(
      `Missing ${path.relative(process.cwd(), SEED_FILE)}. Run ` +
        '`PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:export-media-seed` first.',
      { cause },
    )
  }
}

function assertSeed(seed: MediaSeedFile) {
  if (!Array.isArray(seed.rows)) throw new Error('legacy-media.json must contain a rows array')

  const ids = new Set<string>()
  for (const [index, row] of seed.rows.entries()) {
    if (!row.id || !row.id.startsWith('med_')) {
      throw new Error(`media seed row ${index} has an invalid id: ${row.id}`)
    }
    if (ids.has(row.id)) throw new Error(`media seed contains duplicate id: ${row.id}`)
    ids.add(row.id)
    if (!row.filename) throw new Error(`media seed row ${row.id} is missing filename`)
    if (!row.url) throw new Error(`media seed row ${row.id} is missing url`)
  }
}

function dateValue(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid media seed date: ${value}`)
  return date
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertNotProduction(args)

  const seed = await readSeed()
  assertSeed(seed)

  const payload = await getPayload({ config })
  const existingResult = await payload.db.drizzle.execute(sql`select id from media`)
  const existingIds = new Set(
    ((existingResult.rows ?? []) as { id: string }[]).map((row) => row.id),
  )

  let inserted = 0
  let skipped = 0
  let updated = 0

  for (const row of seed.rows) {
    const exists = existingIds.has(row.id)
    if (exists && !args.updateExisting) {
      skipped += 1
      continue
    }

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
        ${row.alt},
        ${row.url},
        ${row.thumbnailURL},
        ${row.filename},
        ${row.mimeType},
        ${row.filesize},
        ${row.width},
        ${row.height},
        ${row.focalX},
        ${row.focalY},
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

    if (exists) updated += 1
    else inserted += 1
  }

  console.log(
    [
      `legacy media seed: candidates=${seed.rows.length}`,
      `inserted=${inserted}`,
      `skipped=${skipped}`,
      `updated=${updated}`,
      `mode=${args.updateExisting ? 'update-existing' : 'skip-existing'}`,
    ].join(' '),
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('legacy media seed import failed:', err)
      process.exit(1)
    })
}
