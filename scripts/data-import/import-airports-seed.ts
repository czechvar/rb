/**
 * Import Payload airports from the committed OurAirports seed.
 *
 * This upserts by IATA code and writes a legacy Rockbusters airport lookup for
 * later event/date imports when the local legacy Postgres staging DB exists.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'

const SEED_FILE = path.resolve(import.meta.dirname, 'seed/airports.json')
const LEGACY_AIRPORTS_FILE = path.resolve(import.meta.dirname, 'seed/legacy-airports.json')
const LOOKUP_DIR = process.env.DATA_IMPORT_LOOKUP_DIR
  ? path.resolve(process.env.DATA_IMPORT_LOOKUP_DIR)
  : path.resolve(import.meta.dirname, 'seed')
const LEGACY_LOOKUP_FILE = path.join(LOOKUP_DIR, 'legacy-airport-lookup.json')
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type Args = {
  allowProduction: boolean
}

type AirportSeedRow = {
  sourceId: number
  ident: string
  type: string
  name: string
  iata: string
  country: string | null
  continent: string | null
  municipality: string | null
  coordinates: [number, number] | null
  size: number
  active: boolean
}

type AirportSeedFile = {
  generatedAt: string
  source: string
  rows: AirportSeedRow[]
}

type LegacyAirportRow = {
  legacyAirportId: number
  iata: string
  name: string | null
  country: string | null
  continent: string | null
  coordinates: [number, number] | null
  size: number | null
  payloadAirportId: number | null
}

function parseArgs(argv: string[]): Args {
  return {
    allowProduction: argv.includes('--allow-production'),
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

async function readSeed(): Promise<AirportSeedFile> {
  try {
    return JSON.parse(await fs.readFile(SEED_FILE, 'utf8')) as AirportSeedFile
  } catch (cause) {
    throw new Error(
      `Missing ${path.relative(process.cwd(), SEED_FILE)}. Run ` +
        '`pnpm data-import:fetch-airports` first.',
      { cause },
    )
  }
}

async function readLegacyAirports(): Promise<Array<Omit<LegacyAirportRow, 'payloadAirportId'>>> {
  try {
    const seed = JSON.parse(await fs.readFile(LEGACY_AIRPORTS_FILE, 'utf8')) as {
      rows?: Array<Omit<LegacyAirportRow, 'payloadAirportId'>>
    }
    return seed.rows ?? []
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw cause
  }
}

async function upsertLegacyOnlyAirports(payload: Payload, seedRows: AirportSeedRow[]) {
  const legacyRows = await readLegacyAirports()
  if (!legacyRows.length) return { created: 0, updated: 0, total: 0 }

  const seedIatas = new Set(seedRows.map((row) => row.iata))
  const legacyOnlyRows = legacyRows.filter((row) => !seedIatas.has(row.iata))

  let created = 0
  let updated = 0

  for (const row of legacyOnlyRows) {
    const data = {
      name: row.name || row.iata,
      iata: row.iata,
      country: row.country,
      continent: row.continent,
      coordinates: row.coordinates,
      size: row.size ?? 0,
      active: true,
    }

    const existing = await payload.find({
      collection: 'airports',
      where: { iata: { equals: row.iata } },
      limit: 1,
      depth: 0,
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'airports',
        id: existing.docs[0].id,
        data,
      })
      updated += 1
    } else {
      await payload.create({
        collection: 'airports',
        data,
      })
      created += 1
    }
  }

  return { created, updated, total: legacyOnlyRows.length }
}

function assertSeed(seed: AirportSeedFile) {
  if (!Array.isArray(seed.rows)) throw new Error('airports.json must contain a rows array')

  const iatas = new Set<string>()
  for (const [index, row] of seed.rows.entries()) {
    if (!/^[A-Z0-9]{3}$/.test(row.iata)) {
      throw new Error(`airport seed row ${index} has invalid IATA code: ${row.iata}`)
    }
    if (!row.name) throw new Error(`airport seed row ${row.iata} is missing name`)
    if (iatas.has(row.iata)) throw new Error(`airport seed contains duplicate IATA: ${row.iata}`)
    iatas.add(row.iata)
  }
}

async function writeLegacyLookup(payload: Payload) {
  const legacyRows = await readLegacyAirports()
  if (!legacyRows.length) {
    console.warn(
      `legacy airport lookup skipped; ${path.relative(process.cwd(), LEGACY_AIRPORTS_FILE)} is missing or empty.`,
    )
    return
  }

  const payloadAirports = await payload.find({
    collection: 'airports',
    limit: 20_000,
    depth: 0,
  })
  const byIata = new Map(payloadAirports.docs.map((airport) => [airport.iata, airport.id]))
  const rows = legacyRows.map((row) => ({
    ...row,
    payloadAirportId: byIata.get(row.iata) ?? null,
  }))

  await fs.mkdir(path.dirname(LEGACY_LOOKUP_FILE), { recursive: true })
  await fs.writeFile(
    LEGACY_LOOKUP_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: 'scripts/data-import/seed/legacy-airports.json + Payload airports by IATA',
        byLegacyAirportId: Object.fromEntries(
          rows
            .filter((row) => row.payloadAirportId !== null)
            .map((row) => [String(row.legacyAirportId), row.payloadAirportId]),
        ),
        byIata: Object.fromEntries(
          rows
            .filter((row) => row.payloadAirportId !== null)
            .map((row) => [row.iata, row.payloadAirportId]),
        ),
        rows,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  console.log(
    `legacy airport lookup: rows=${rows.length} missing=${rows.filter((row) => row.payloadAirportId === null).length} ` +
      `file=${path.relative(process.cwd(), LEGACY_LOOKUP_FILE)}`,
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertNotProduction(args)

  const seed = await readSeed()
  assertSeed(seed)

  const payload = await getPayload({ config })

  let created = 0
  let updated = 0

  for (const row of seed.rows) {
    const data = {
      name: row.name,
      iata: row.iata,
      country: row.country,
      continent: row.continent,
      coordinates: row.coordinates,
      size: row.size,
      active: row.active,
    }

    const existing = await payload.find({
      collection: 'airports',
      where: { iata: { equals: row.iata } },
      limit: 1,
      depth: 0,
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'airports',
        id: existing.docs[0].id,
        data,
      })
      updated += 1
    } else {
      await payload.create({
        collection: 'airports',
        data,
      })
      created += 1
    }
  }

  console.log(`airports seed: created=${created} updated=${updated} total=${seed.rows.length}`)
  const legacyOnly = await upsertLegacyOnlyAirports(payload, seed.rows)
  if (legacyOnly.total) {
    console.log(
      `legacy-only airports: created=${legacyOnly.created} updated=${legacyOnly.updated} total=${legacyOnly.total}`,
    )
  }
  await writeLegacyLookup(payload)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('airports seed import failed:', err)
      process.exit(1)
    })
}
