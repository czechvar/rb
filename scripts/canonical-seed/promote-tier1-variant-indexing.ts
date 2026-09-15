/** Idempotent local-dev promotion of reviewed Tier 1 Variant destinations. */
import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { getPayload } from 'payload'
import {
  assertNotProduction, CANONICAL_SEED_FILE, readCanonicalSeed,
} from './shared'

const APPROVED = [
  { eventSlug: 'bouldering-albarracin', variantSlug: 'albarracin', dates: ['2026-10-31-to-2026-11-14'] },
  { eventSlug: 'climbing-technique-mental-coaching', variantSlug: 'kyparissi', dates: [
    '2026-11-14-to-2026-11-28', '2026-11-14-to-2026-11-21', '2026-11-21-to-2026-11-28',
  ] },
  { eventSlug: 'climbing-technique-mental-coaching', variantSlug: 'rodellar', dates: [
    '2027-05-08-to-2027-05-22', '2027-05-08-to-2027-05-15', '2027-05-15-to-2027-05-22',
  ] },
] as const

async function main() {
  const seed = await readCanonicalSeed(CANONICAL_SEED_FILE)
  const events = seed.collections.find(item => item.slug === 'events')?.rows ?? []
  const variants = seed.collections.find(item => item.slug === 'trip-variants')?.rows ?? []
  for (const approval of APPROVED) {
    const event = events.find(item => item.slug === approval.eventSlug && item.state === 'published')
    const variant = variants.find(item => item.event === event?.id && item.slug === approval.variantSlug)
    if (!event || !variant || variant.active !== true || variant.indexable !== true) {
      throw new Error('Canonical Tier 1 approval precondition failed')
    }
  }
  if (!process.argv.includes('--apply')) {
    process.stdout.write(`${JSON.stringify({ mode: 'review', approvedVariants: APPROVED.length,
      approvedDates: APPROVED.reduce((sum, item) => sum + item.dates.length, 0) })}\n`)
    return
  }

  const dotenv = await import('dotenv')
  const parsed = dotenv.parse(await fs.readFile('.env'))
  const testParsed = dotenv.parse(await fs.readFile('.env.test'))
  await import('dotenv/config')
  if (!parsed.DATABASE_URL || parsed.DATABASE_URL === testParsed.DATABASE_URL ||
    process.env.DATABASE_URL !== parsed.DATABASE_URL) {
    throw new Error('Local development database target precondition failed')
  }
  assertNotProduction({ allowProduction: false })
  process.env.PAYLOAD_DISABLE_DB_PUSH = 'true'
  const config = await (await import('../../src/payload.config')).default
  if (process.env.DATABASE_URL !== parsed.DATABASE_URL) {
    throw new Error('Local development database target changed during config load')
  }
  config.logger = { options: { level: 'silent' } } as typeof config.logger
  const payload = await getPayload({ config })
  if (process.env.DATABASE_URL !== parsed.DATABASE_URL) {
    throw new Error('Local development database target changed during Payload load')
  }

  const targets = []
  let reviewedDates = 0
  for (const approval of APPROVED) {
    const eventResult = await payload.find({ collection: 'events', depth: 0, limit: 2,
      where: { and: [{ slug: { equals: approval.eventSlug } }, { state: { equals: 'published' } }] } })
    if (eventResult.docs.length !== 1) throw new Error('Local Event identity precondition failed')
    const event = eventResult.docs[0]
    const variantResult = await payload.find({ collection: 'trip-variants', depth: 0, limit: 2,
      where: { and: [{ event: { equals: event.id } }, { slug: { equals: approval.variantSlug } },
        { active: { equals: true } }] } })
    if (variantResult.docs.length !== 1) throw new Error('Local Variant identity precondition failed')
    const variant = variantResult.docs[0]
    for (const key of approval.dates) {
      const result = await payload.find({ collection: 'event-dates', depth: 0, limit: 2,
        where: { and: [
          { event: { equals: event.id } }, { tripVariant: { equals: variant.id } },
          { publicDateKey: { equals: key } }, { active: { equals: true } },
        ] } })
      if (result.docs.length !== 1 || result.docs[0].indexable !== true ||
        Date.parse(result.docs[0].dateTo) < Date.now()) {
        throw new Error('Local Date identity precondition failed')
      }
      reviewedDates += 1
    }
    targets.push(variant)
  }

  let changed = 0
  for (const variant of targets) {
    if (variant.indexable === true) continue
    await payload.update({ collection: 'trip-variants', id: variant.id,
      data: { indexable: true }, depth: 0, overrideAccess: true })
    changed += 1
  }
  const readback = await Promise.all(targets.map(item => payload.findByID({
    collection: 'trip-variants', id: item.id, depth: 0,
  })))
  if (readback.some(item => item.indexable !== true)) throw new Error('Local Variant readback failed')
  await payload.db.destroy?.()
  process.stdout.write(`${JSON.stringify({ mode: 'apply', approvedVariants: targets.length,
    reviewedDates, variantsChanged: changed, readbackIndexable: readback.length })}\n`)
  process.exit(0)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    process.stderr.write('Tier 1 Variant promotion failed; inspect safe preconditions and readback\n')
    process.exit(1)
  })
}
