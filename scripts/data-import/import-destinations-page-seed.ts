/**
 * Import the CMS-managed destinations page from the committed seed snapshot.
 *
 * This creates persistent seed content for `pages.slug = destinations` and
 * intentionally overwrites that page's CMS fields with the snapshot.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

const SEED_FILE = path.resolve(import.meta.dirname, 'seed/destinations-page.json')
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type Args = {
  allowProduction: boolean
}

type DestinationsPageSeed = {
  generatedAt: string
  source: string
  row: Record<string, unknown> & {
    slug?: string
  }
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

async function readSeed(): Promise<DestinationsPageSeed> {
  return JSON.parse(await fs.readFile(SEED_FILE, 'utf8')) as DestinationsPageSeed
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertNotProduction(args)

  const seed = await readSeed()
  if (seed.row.slug !== 'destinations') {
    throw new Error(`Expected destinations page seed slug "destinations", received ${String(seed.row.slug)}`)
  }

  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'destinations' } },
    limit: 1,
    depth: 0,
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'pages',
      id: existing.docs[0].id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: seed.row as any,
    })
    console.log(`updated destinations page from ${path.relative(process.cwd(), SEED_FILE)}`)
    return
  }

  await payload.create({
    collection: 'pages',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: seed.row as any,
  })
  console.log(`created destinations page from ${path.relative(process.cwd(), SEED_FILE)}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('destinations page seed import failed:', err)
    process.exit(1)
  })
