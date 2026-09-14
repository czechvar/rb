import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import { deriveOccurrenceSlug } from '@/lib/occurrence-routing'

const databaseUrl = process.env.DATABASE_URL
const productionTarget = Boolean(databaseUrl?.includes('ep-weathered-pine-alvc3sdj'))
const write = process.argv.includes('--write')

console.log(JSON.stringify({
  databaseUrlPresent: Boolean(databaseUrl),
  productionTarget,
  mode: write ? 'write' : 'review',
}))

if (!databaseUrl || productionTarget) {
  throw new Error('Occurrence slug backfill requires a configured non-production database.')
}

const payload = await getPayload({ config })
const dates = []
let page = 1
while (true) {
  const result = await payload.find({
    collection: 'event-dates',
    page,
    limit: 100,
    depth: 1,
    sort: 'id',
    overrideAccess: true,
  })
  dates.push(...result.docs)
  if (!result.hasNextPage) break
  page += 1
}

const missingLocationIds: number[] = []
const multipleLocationIds: number[] = []
const candidates: { id: number; eventId: number; slug: string }[] = []

for (const date of dates) {
  if (date.slug) continue
  const locations = date.locations ?? []
  if (locations.length === 0) {
    missingLocationIds.push(date.id)
    continue
  }
  if (locations.length !== 1 || typeof locations[0] !== 'object') {
    multipleLocationIds.push(date.id)
    continue
  }
  const eventId = typeof date.event === 'object' ? date.event.id : date.event
  candidates.push({ id: date.id, eventId, slug: deriveOccurrenceSlug(locations[0].slug, date.dateFrom) })
}

const collisionMap = new Map<string, number[]>()
for (const candidate of candidates) {
  const key = `${candidate.eventId}:${candidate.slug}`
  collisionMap.set(key, [...(collisionMap.get(key) ?? []), candidate.id])
}
for (const date of dates) {
  if (!date.slug) continue
  const eventId = typeof date.event === 'object' ? date.event.id : date.event
  const key = `${eventId}:${date.slug}`
  collisionMap.set(key, [...(collisionMap.get(key) ?? []), date.id])
}
const collisions = [...collisionMap.entries()]
  .filter(([, ids]) => ids.length > 1)
  .map(([key, ids]) => ({ key, ids }))

console.log(JSON.stringify({
  total: dates.length,
  alreadyStored: dates.filter((date) => Boolean(date.slug)).length,
  candidates: candidates.length,
  missingLocationIds,
  multipleLocationIds,
  collisions,
}))

if (missingLocationIds.length || multipleLocationIds.length || collisions.length) {
  await payload.destroy()
  throw new Error('Occurrence slug review found records that require an explicit editorial choice; no writes were made.')
}

if (write) {
  for (const candidate of candidates) {
    await payload.update({
      collection: 'event-dates',
      id: candidate.id,
      data: { slug: candidate.slug },
      overrideAccess: true,
    })
  }
  console.log(JSON.stringify({ updated: candidates.length }))
}

await payload.destroy()
