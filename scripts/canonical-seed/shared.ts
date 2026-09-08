import fs from 'node:fs/promises'
import path from 'node:path'
import type { CollectionSlug, Payload } from 'payload'

export const CANONICAL_SEED_FILE = path.resolve(
  import.meta.dirname,
  '../data-import/seed/canonical-payload-seed.json',
)

export const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

export type CanonicalSeedCollection = {
  slug: CollectionSlug
  mode: 'payload'
}

export const CANONICAL_SEED_COLLECTIONS: CanonicalSeedCollection[] = [
  { slug: 'media', mode: 'payload' },
  { slug: 'difficulties', mode: 'payload' },
  { slug: 'categories', mode: 'payload' },
  { slug: 'programs', mode: 'payload' },
  { slug: 'airports', mode: 'payload' },
  { slug: 'guides', mode: 'payload' },
  { slug: 'locations', mode: 'payload' },
  { slug: 'partners', mode: 'payload' },
  { slug: 'post-categories', mode: 'payload' },
  { slug: 'posts', mode: 'payload' },
  { slug: 'events', mode: 'payload' },
  { slug: 'event-dates', mode: 'payload' },
  { slug: 'reviews', mode: 'payload' },
  { slug: 'faqs', mode: 'payload' },
  { slug: 'pages', mode: 'payload' },
]

export type CanonicalSeed = {
  generatedAt: string
  source: string
  collections: Array<{
    slug: CollectionSlug
    rows: Array<Record<string, unknown>>
  }>
}

export type SeedArgs = {
  allowProduction: boolean
  file: string
}

export function parseSeedArgs(argv: string[]): SeedArgs {
  const fileArg = argv.find((arg) => arg.startsWith('--file='))
  return {
    allowProduction: argv.includes('--allow-production'),
    file: fileArg ? path.resolve(fileArg.slice('--file='.length)) : CANONICAL_SEED_FILE,
  }
}

export function assertNotProduction({ allowProduction }: Pick<SeedArgs, 'allowProduction'>) {
  const dbUrl = process.env.DATABASE_URL ?? ''
  if (dbUrl.includes(PRODUCTION_DB_HOST) && !allowProduction) {
    console.error(
      'DATABASE_URL points at the PRODUCTION Neon branch. ' +
        'Re-run with --allow-production only if that is intentional.',
    )
    process.exit(1)
  }
}

export async function readCanonicalSeed(file: string): Promise<CanonicalSeed> {
  return JSON.parse(await fs.readFile(file, 'utf8')) as CanonicalSeed
}

export async function writeCanonicalSeed(file: string, seed: CanonicalSeed) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, `${JSON.stringify(seed, null, 2)}\n`, 'utf8')
}

export async function findAll(payload: Payload, collection: CollectionSlug) {
  const rows: Array<Record<string, unknown>> = []
  let page = 1

  while (true) {
    const result = await payload.find({
      collection,
      depth: 0,
      limit: 500,
      page,
      pagination: true,
      sort: 'id',
    })
    rows.push(...(result.docs as unknown as Array<Record<string, unknown>>))
    if (!result.hasNextPage) return rows
    page += 1
  }
}
