/**
 * Export current CMS guide feature flags into the committed legacy guide seed.
 *
 * The seed remains the legacy extract shape so guide imports stay traceable to
 * the old database, with editor-controlled fields persisted as explicit
 * overlays.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

const SEED_FILE = path.resolve(import.meta.dirname, 'seed/guides.json')
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

interface GuideSeedRow {
  id: number
  slug: string
  featured?: boolean
}

interface GuideSeedFile {
  generatedAt: string
  source: string
  rows: GuideSeedRow[]
}

function assertNotProduction() {
  const dbUrl = process.env.DATABASE_URL ?? ''
  if (dbUrl.includes(PRODUCTION_DB_HOST) && !process.argv.includes('--allow-production')) {
    console.error(
      'DATABASE_URL points at the PRODUCTION Neon branch. ' +
        'Re-run with --allow-production only if that is intentional.',
    )
    process.exit(1)
  }
}

async function main() {
  assertNotProduction()

  const seed = JSON.parse(await fs.readFile(SEED_FILE, 'utf8')) as GuideSeedFile
  const payload = await getPayload({ config })
  const guides = await payload.find({
    collection: 'guides',
    limit: 10_000,
    depth: 0,
    sort: 'id',
  })

  const featuredBySlug = new Map(guides.docs.map((guide) => [guide.slug, Boolean(guide.featured)]))
  let matched = 0
  let featured = 0

  const rows = seed.rows.map((row) => {
    const value = featuredBySlug.get(row.slug)
    const { featured: _featured, ...baseRow } = row
    void _featured
    if (value === undefined) return row
    matched += 1
    if (value) featured += 1
    return value ? { ...baseRow, featured: true } : baseRow
  })

  await fs.writeFile(
    SEED_FILE,
    `${JSON.stringify(
      {
        ...seed,
        generatedAt: new Date().toISOString(),
        source: seed.source.includes('Payload guides featured overlay')
          ? seed.source
          : `${seed.source}; Payload guides featured overlay`,
        rows,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  console.log(
    `exported guide seed to ${path.relative(process.cwd(), SEED_FILE)} ` +
      `(matched=${matched}/${seed.rows.length}, featured=${featured})`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('guide seed export failed:', err)
    process.exit(1)
  })
