/**
 * Extract stage of the old-rockbusters → v3 import pipeline.
 *
 * Connects to a locally-loaded MySQL dump (see scripts/data-import/README.md),
 * runs one query per source table, writes JSON to scripts/data-import/data/.
 * The JSON keeps the pre-transform column names so that transform bugs can
 * be fixed by editing import.ts alone, no need to re-hit MySQL.
 *
 *   pnpm data-import:extract
 *
 * Requires OLD_DB_URL in the environment (dotenv/config picks up .env.local).
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import mysql, { type RowDataPacket } from 'mysql2/promise'

const OLD_DB_URL = process.env.OLD_DB_URL
if (!OLD_DB_URL) {
  console.error(
    'OLD_DB_URL is not set. Point it at your locally-loaded old rockbusters MySQL, e.g.\n' +
      '  OLD_DB_URL=mysql://root:root@127.0.0.1:8889/rockbusters\n' +
      'See scripts/data-import/README.md.',
  )
  process.exit(1)
}

const DATA_DIR = path.resolve(import.meta.dirname, 'data')
const SOURCE = 'old_db/20260827_rb.sql'

interface LocationRow extends RowDataPacket {
  id: number
  title: string
  slug: string
  body: string | null
  latitude: number
  longitude: number
  keywords: string | null
  description: string | null
  display: number
  country_nicename: string | null
}

interface GuideRow extends RowDataPacket {
  id: number
  name: string
  slug: string
  body: string | null
  email: string | null
  phone: string | null
  display: number
}

async function writeJson(name: string, rows: unknown[]): Promise<string> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const file = path.join(DATA_DIR, `${name}.json`)
  const payload = {
    generatedAt: new Date().toISOString(),
    source: SOURCE,
    rows,
  }
  await fs.writeFile(file, JSON.stringify(payload, null, 2), 'utf8')
  return file
}

async function main() {
  const conn = await mysql.createConnection(OLD_DB_URL!)
  try {
    const [locationRows] = await conn.query<LocationRow[]>(
      `SELECT l.id, l.title, l.slug, l.body, l.latitude, l.longitude,
              l.keywords, l.description, l.display,
              c.nicename AS country_nicename
       FROM location l
       LEFT JOIN country c ON c.id = l.country_id
       ORDER BY l.id`,
    )
    const locFile = await writeJson('locations', locationRows)
    console.log(`extract: locations: ${locationRows.length} rows → ${path.relative(process.cwd(), locFile)}`)

    const [guideRows] = await conn.query<GuideRow[]>(
      `SELECT id, name, slug, body, email, phone, display
       FROM team_member
       ORDER BY id`,
    )
    const guideFile = await writeJson('guides', guideRows)
    console.log(`extract: guides:    ${guideRows.length} rows → ${path.relative(process.cwd(), guideFile)}`)
  } finally {
    await conn.end()
  }
}

main().catch((err) => {
  console.error('extract failed:', err)
  process.exit(1)
})
