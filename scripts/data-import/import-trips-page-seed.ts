/**
 * Upsert the persistent CMS page that powers the public /trips catalogue.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

const SEED_FILE = path.resolve(import.meta.dirname, 'seed/trips-page.json')
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type TripsPageSeed = {
  row: Record<string, unknown> & { slug?: string }
}

function assertNotProduction() {
  if ((process.env.DATABASE_URL ?? '').includes(PRODUCTION_DB_HOST)) {
    throw new Error('DATABASE_URL points at the PRODUCTION Neon branch.')
  }
}

async function main() {
  assertNotProduction()
  const seed = JSON.parse(await fs.readFile(SEED_FILE, 'utf8')) as TripsPageSeed
  if (seed.row.slug !== 'trips') {
    throw new Error(`Expected trips seed slug "trips", received ${String(seed.row.slug)}`)
  }

  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'trips' } },
    limit: 1,
    depth: 0,
  })

  if (existing.docs[0]) {
    await payload.update({ collection: 'pages', id: existing.docs[0].id, data: seed.row as never })
    console.log(`updated trips page from ${path.relative(process.cwd(), SEED_FILE)}`)
    return
  }

  await payload.create({ collection: 'pages', data: seed.row as never })
  console.log(`created trips page from ${path.relative(process.cwd(), SEED_FILE)}`)
}

main().then(() => process.exit(0)).catch((error) => {
  console.error('trips page seed import failed:', error)
  process.exit(1)
})
