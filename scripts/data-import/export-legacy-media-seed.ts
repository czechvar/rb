/**
 * Export Payload media rows into a committed seed snapshot.
 *
 * This does not read or upload binary files. It captures the DB metadata rows
 * for legacy media objects that already live in R2.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

const OUT_FILE = path.resolve(import.meta.dirname, 'seed/legacy-media.json')

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

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value in media seed export: ${String(value)}`)
  }
  return parsed.toISOString()
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function main() {
  const payload = await getPayload({ config })
  const result = await payload.db.drizzle.execute(sql`
    select
      id,
      alt,
      url,
      thumbnail_u_r_l as "thumbnailURL",
      filename,
      mime_type as "mimeType",
      filesize,
      width,
      height,
      focal_x as "focalX",
      focal_y as "focalY",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from media
    order by id
  `)

  const rows = (result.rows ?? []) as Record<string, unknown>[]
  const seedRows: MediaSeedRow[] = rows.map((row) => ({
    id: String(row.id),
    alt: String(row.alt ?? ''),
    url: row.url === null ? null : String(row.url),
    thumbnailURL: row.thumbnailURL === null ? null : String(row.thumbnailURL),
    filename: row.filename === null ? null : String(row.filename),
    mimeType: row.mimeType === null ? null : String(row.mimeType),
    filesize: toNumber(row.filesize),
    width: toNumber(row.width),
    height: toNumber(row.height),
    focalX: toNumber(row.focalX),
    focalY: toNumber(row.focalY),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }))

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true })
  await fs.writeFile(
    OUT_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: 'payload media table; binaries are expected to exist in R2',
        rows: seedRows,
      },
      null,
      2,
    )}\n`,
  )

  console.log(`exported ${seedRows.length} media rows to ${path.relative(process.cwd(), OUT_FILE)}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('legacy media seed export failed:', err)
      process.exit(1)
    })
}
