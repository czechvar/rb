/**
 * Import reviewed event catalogue-card copy into Payload.
 *
 * This is persistent catalogue seed data. It updates only
 * events.catalogueCard from scripts/data-import/seed/event-catalogue-cards.json.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

const SEED_FILE = path.resolve(import.meta.dirname, 'seed/event-catalogue-cards.json')
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type Args = {
  allowProduction: boolean
  dryRun: boolean
}

type CatalogueCardSeedFile = {
  rows: Array<{
    slug: string
    title: string
    description: string
  }>
}

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

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertNotProduction(args)

  const seed = JSON.parse(await fs.readFile(SEED_FILE, 'utf8')) as CatalogueCardSeedFile
  const payload = await getPayload({ config })
  let updated = 0
  const missing: string[] = []

  for (const row of seed.rows) {
    const existing = await payload.find({
      collection: 'events',
      where: { slug: { equals: row.slug } },
      limit: 1,
      depth: 0,
    })
    const event = existing.docs[0]
    if (!event) {
      missing.push(row.slug)
      continue
    }
    if (!args.dryRun) {
      await payload.update({
        collection: 'events',
        id: event.id,
        data: {
          catalogueCard: {
            title: row.title,
            description: row.description,
          },
        },
      })
    }
    updated += 1
  }

  console.log(
    [
      `event catalogue cards: ${args.dryRun ? 'would-update' : 'updated'}=${updated}`,
      `total=${seed.rows.length}`,
      `missing=${missing.length}`,
    ].join(' '),
  )
  if (missing.length) console.warn(`missing slugs: ${missing.join(', ')}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('event catalogue card import failed:', err)
    process.exit(1)
  })
