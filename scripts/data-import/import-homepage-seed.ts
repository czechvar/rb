/**
 * Import the CMS-managed homepage from the committed seed snapshot.
 *
 * This upserts the `pages.slug = home` document and intentionally overwrites
 * that page's CMS fields with the snapshot.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'

const SEED_FILE = path.resolve(import.meta.dirname, 'seed/home-page.json')
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type Args = {
  allowProduction: boolean
}

type HomePageSeed = {
  generatedAt: string
  source: string
  row: Record<string, unknown> & {
    slug?: string
    layout?: Array<Record<string, unknown>>
  }
}

async function relationshipExists(
  payload: Payload,
  collection: 'media' | 'programs' | 'events',
  id: unknown,
): Promise<boolean> {
  if (typeof id !== 'number' && typeof id !== 'string') return false
  try {
    await payload.findByID({ collection, id, depth: 0 })
    return true
  } catch {
    return false
  }
}

async function homepageHeroMedia(payload: Payload): Promise<string | null> {
  const result = await payload.find({
    collection: 'media',
    where: { filename: { equals: '2025-05-05 11.05.52.jpg' } },
    limit: 1,
    depth: 0,
  })
  return result.docs[0]?.id ?? null
}

async function normalizeHomepageSeed(
  payload: Payload,
  row: HomePageSeed['row'],
): Promise<HomePageSeed['row']> {
  if (!Array.isArray(row.layout)) return row

  const layout = await Promise.all(
    row.layout.map(async (block) => {
      if (block.blockType === 'hero' && block.backgroundMedia) {
        if (await relationshipExists(payload, 'media', block.backgroundMedia)) return block
        return { ...block, backgroundMedia: await homepageHeroMedia(payload) }
      }

      if (block.blockType !== 'reviewGrid') return block

      if (
        block.source === 'byProgram' &&
        !(await relationshipExists(payload, 'programs', block.program))
      ) {
        return { ...block, source: 'global', program: null }
      }

      if (block.source === 'byEvent' && !(await relationshipExists(payload, 'events', block.event))) {
        return { ...block, source: 'global', event: null }
      }

      return block
    }),
  )

  return { ...row, layout }
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

async function readSeed(): Promise<HomePageSeed> {
  return JSON.parse(await fs.readFile(SEED_FILE, 'utf8')) as HomePageSeed
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertNotProduction(args)

  const seed = await readSeed()
  if (seed.row.slug !== 'home') {
    throw new Error(`Expected homepage seed slug "home", received ${String(seed.row.slug)}`)
  }

  const payload = await getPayload({ config })
  const row = await normalizeHomepageSeed(payload, seed.row)
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'pages',
      id: existing.docs[0].id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: row as any,
    })
    console.log(`updated homepage from ${path.relative(process.cwd(), SEED_FILE)}`)
    return
  }

  await payload.create({
    collection: 'pages',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: row as any,
  })
  console.log(`created homepage from ${path.relative(process.cwd(), SEED_FILE)}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('homepage seed import failed:', err)
    process.exit(1)
  })
