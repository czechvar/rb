/**
 * Export the current CMS-managed homepage into a committed seed snapshot.
 *
 * The snapshot is persistent seed data. Relationship fields are exported at
 * depth 0, so they stay as Payload IDs rather than embedded documents.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

const OUT_FILE = path.resolve(import.meta.dirname, 'seed/home-page.json')
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type Args = {
  allowProduction: boolean
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

function stripRuntimeFields<T extends Record<string, unknown>>(doc: T) {
  const { id, createdAt, updatedAt, ...seed } = doc
  void id
  void createdAt
  void updatedAt
  return seed
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertNotProduction(args)

  const payload = await getPayload({ config })
  const page = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  })

  const home = page.docs[0]
  if (!home) throw new Error('No CMS page found with slug "home"')

  const seed = {
    generatedAt: new Date().toISOString(),
    source: 'Payload pages collection, slug=home, depth=0',
    row: stripRuntimeFields(home as unknown as Record<string, unknown>),
  }

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true })
  await fs.writeFile(OUT_FILE, `${JSON.stringify(seed, null, 2)}\n`)
  console.log(`exported homepage seed to ${path.relative(process.cwd(), OUT_FILE)}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('homepage seed export failed:', err)
    process.exit(1)
  })
