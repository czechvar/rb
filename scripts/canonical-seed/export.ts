/**
 * Export the current Payload content DB into a portable canonical seed.
 *
 * This snapshots public/catalogue CMS state through Payload's local API. It
 * intentionally excludes users, orders, transactions, referrals, and discount
 * codes so fresh environments do not inherit account or commerce history.
 */
import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import {
  assertNotProduction,
  CANONICAL_SEED_COLLECTIONS,
  findAll,
  parseSeedArgs,
  writeCanonicalSeed,
  type CanonicalSeed,
} from './shared'

function textValue(value: unknown) {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

function hasTemporaryMarker(row: Record<string, unknown>) {
  const haystack = [row.slug, row.title, row.name].map(textValue).join(' ')
  return (
    haystack.includes('cms-block-system-poc') ||
    haystack.includes('poc-blocks') ||
    haystack.includes('mcp-smoke') ||
    haystack.includes('[mcp smoke')
  )
}

function withoutTemporaryRows(slug: string, rows: Array<Record<string, unknown>>) {
  const kept = rows.filter((row) => !hasTemporaryMarker(row))
  const removed = rows.length - kept.length
  if (removed > 0) {
    console.log(`canonical seed export: ${slug} removed temporary rows=${removed}`)
  }
  return kept
}

const REMOVED_LOCATION_FIELDS = [
  'content',
  'contentSections',
  'seasonSummary',
  'transportSummary',
  'accommodationSummary',
]

function pruneRemovedFields(slug: string, rows: Array<Record<string, unknown>>) {
  if (slug !== 'locations') return rows
  return rows.map((row) => {
    const next = { ...row }
    for (const field of REMOVED_LOCATION_FIELDS) delete next[field]
    return next
  })
}

function pruneRowsWithMissingRequiredRelations(collections: CanonicalSeed['collections']) {
  const events = new Set(
    collections.find((collection) => collection.slug === 'events')?.rows.map((row) => row.id) ?? [],
  )

  const eventDates = collections.find((collection) => collection.slug === 'event-dates')
  if (eventDates) {
    const before = eventDates.rows.length
    eventDates.rows = eventDates.rows.filter((row) => events.has(row.event))
    const removed = before - eventDates.rows.length
    if (removed > 0) {
      console.log(`canonical seed export: event-dates removed missing parent events=${removed}`)
    }
  }
}

async function main() {
  const args = parseSeedArgs(process.argv.slice(2))
  assertNotProduction(args)

  const payload = await getPayload({ config })
  const collections: CanonicalSeed['collections'] = []

  for (const { slug } of CANONICAL_SEED_COLLECTIONS) {
    const rows = pruneRemovedFields(slug, withoutTemporaryRows(slug, await findAll(payload, slug)))
    collections.push({ slug, rows })
    console.log(`canonical seed export: ${slug} rows=${rows.length}`)
  }

  pruneRowsWithMissingRequiredRelations(collections)

  await writeCanonicalSeed(args.file, {
    generatedAt: new Date().toISOString(),
    source: 'Payload local API depth=0 export from current DATABASE_URL',
    collections,
  })

  console.log(`canonical seed export: wrote ${args.file}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('canonical seed export failed:', err)
      process.exit(1)
    })
}
