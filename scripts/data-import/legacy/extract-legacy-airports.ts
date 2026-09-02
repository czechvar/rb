/**
 * Extract legacy airport rows referenced by old Rockbusters events/date rows.
 *
 * This reads the local staging Postgres container used for the MySQL dump copy
 * and writes a small lookup source used by the full OurAirports import.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const LEGACY_CONTAINER = process.env.LEGACY_DB_CONTAINER ?? 'rb-legacy-pg-20260827'
const LEGACY_DB = process.env.LEGACY_DB_NAME ?? 'rockbusters_legacy'
const LEGACY_DB_USER = process.env.LEGACY_DB_USER ?? 'rockbusters'
const OUT_FILE = path.resolve(import.meta.dirname, '../seed/legacy-airports.json')

type LegacyAirportRow = {
  legacyAirportId: number
  iata: string
  name: string | null
  country: string | null
  continent: string | null
  coordinates: [number, number] | null
  size: number | null
}

async function main() {
  const { stdout } = await execFileAsync('docker', [
    'exec',
    LEGACY_CONTAINER,
    'psql',
    '-U',
    LEGACY_DB_USER,
    '-d',
    LEGACY_DB,
    '-A',
    '-F',
    '\t',
    '-t',
    '-c',
    `
      with legacy_airports as (
        select distinct airport_id
        from (
          select airport_arrival_id as airport_id from event where airport_arrival_id is not null
          union
          select airport_departure_id as airport_id from event where airport_departure_id is not null
          union
          select airport_arrival_id as airport_id from event_date where airport_arrival_id is not null
          union
          select airport_departure_id as airport_id from event_date where airport_departure_id is not null
        ) refs
      )
      select
        a.id as "legacyAirportId",
        a.iata,
        nullif(a.name, '') as name,
        nullif(a.country, '') as country,
        nullif(a.continent, '') as continent,
        a.lat,
        a.lon,
        a.size
      from legacy_airports la
      join airport a on a.id = la.airport_id
      order by a.id
    `,
  ])

  const rows: LegacyAirportRow[] = stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [legacyAirportId, iata, name, country, continent, lat, lon, size] = line.split('\t')
      return {
        legacyAirportId: Number(legacyAirportId),
        iata,
        name: name || null,
        country: country || null,
        continent: continent || null,
        coordinates: lat && lon ? [Number(lon), Number(lat)] : null,
        size: size ? Number(size) : null,
      }
    })

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true })
  await fs.writeFile(
    OUT_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: `${LEGACY_CONTAINER}:${LEGACY_DB}.airport referenced by event/event_date`,
        rows,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  console.log(`legacy airports: rows=${rows.length} file=${path.relative(process.cwd(), OUT_FILE)}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('legacy airport extraction failed:', err)
      process.exit(1)
    })
}
