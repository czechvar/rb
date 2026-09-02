/**
 * Fetch the OurAirports CSV and write a Payload-ready airport seed.
 *
 * The Payload airports collection requires IATA codes, so this keeps only
 * rows with a unique three-character IATA code.
 */
import fs from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SOURCE_URL = 'https://ourairports.com/data/airports.csv'
const OUT_FILE = path.resolve(import.meta.dirname, 'seed/airports.json')

type CsvRow = Record<string, string>

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

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchText(new URL(res.headers.location, url).toString()).then(resolve, reject)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`GET ${url} failed with HTTP ${res.statusCode}`))
          res.resume()
          return
        }
        res.setEncoding('utf8')
        let body = ''
        res.on('data', (chunk) => {
          body += chunk
        })
        res.on('end', () => resolve(body))
      })
      .on('error', reject)
  })
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function toRows(csv: string): CsvRow[] {
  const [header, ...rows] = parseCsv(csv)
  if (!header) throw new Error('OurAirports CSV is empty')
  return rows.map((row) =>
    Object.fromEntries(header.map((column, index) => [column, row[index] ?? ''])),
  )
}

function numberOrNull(value: string): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function airportSize(type: string): number {
  if (type === 'large_airport') return 3
  if (type === 'medium_airport') return 2
  if (type === 'small_airport') return 1
  return 0
}

function buildSeedRows(rows: CsvRow[]): AirportSeedRow[] {
  const iataPattern = /^[A-Z0-9]{3}$/
  const seedRows = rows
    .filter((row) => iataPattern.test(row.iata_code))
    .map((row) => {
      const lat = numberOrNull(row.latitude_deg)
      const lon = numberOrNull(row.longitude_deg)
      return {
        sourceId: Number(row.id),
        ident: row.ident,
        type: row.type,
        name: row.name,
        iata: row.iata_code,
        country: row.iso_country || null,
        continent: row.continent || null,
        municipality: row.municipality || null,
        coordinates: lat === null || lon === null ? null : ([lon, lat] as [number, number]),
        size: airportSize(row.type),
        active: row.type !== 'closed',
      }
    })
    .sort((a, b) => a.iata.localeCompare(b.iata))

  const seen = new Set<string>()
  for (const row of seedRows) {
    if (seen.has(row.iata)) throw new Error(`Duplicate IATA code in OurAirports data: ${row.iata}`)
    seen.add(row.iata)
  }

  return seedRows
}

async function main() {
  const csv = await fetchText(SOURCE_URL)
  const rows = buildSeedRows(toRows(csv))

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true })
  await fs.writeFile(
    OUT_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: SOURCE_URL,
        rows,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  console.log(`airports seed: rows=${rows.length} file=${path.relative(process.cwd(), OUT_FILE)}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('airports seed fetch failed:', err)
      process.exit(1)
    })
}
