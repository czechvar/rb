import { pathToFileURL } from 'node:url'
import { normalizeOccurrenceSlug } from '../../src/lib/occurrence-routing'
import { CANONICAL_SEED_FILE, readCanonicalSeed, writeCanonicalSeed, type CanonicalSeed } from './shared'
import { occurrenceIdentityMap, remapOccurrenceHref } from './occurrence-links'

export type OccurrenceIdentityReport = {
  total: number
  changed: number
  derived: number
  reviewed: number
  durationQualified: number
  unresolvedIdentityCount: number
  unresolvedIdentityIds: Array<string | number>
  missingReviewedOverrideIds: Array<string | number>
  duplicateCanonicalPaths: string[]
  canonicalizedHrefCount: number
  semanticCollisionRecordCount: number
  exactFingerprintDuplicateRecordCount: number
  canonicalActiveCollisionOwners: number
}

const ids = (values: number[], label: string) => values.map((id) => [String(id), label] as const)

/** Explicitly reviewed exceptions to the one-location derivation rule. */
export const REVIEWED_CONTEXT_LABELS = new Map<string, string>([
  ...ids([1], 'sport-climbing-basics'),
  ...ids([2, 3], 'deep-blue-psicobloc'),
  ...ids([4, 5, 6], 'dolomite-dolce-vita'),
  ...ids([21, 22, 88, 276], 'trad-and-multipitch'),
  ...ids([23], 'private-guiding'),
  ...ids([7, 120, 174, 229, 619, 662, 747], 'spain-tour'),
  ...ids([11, 67, 134, 185, 196, 258, 295, 322, 398, 466, 521, 592, 688, 723, 789], 'europe-tour'),
  ...ids([15, 54, 55], 'daila-ojeda-clinic'),
  ...ids([56], 'performance-coaching-tour'),
  ...ids([74, 384, 386, 387], 'girls-on-rock-tour'),
  ...ids([102], 'novice-course-tour'),
  ...ids([126, 166, 172, 173, 233, 244, 245], 'mental-coaching-tour'),
  ...ids([128], 'adam-patxi-pablo-clinic'),
  ...ids([168, 169, 170, 171, 203, 204, 205, 214, 267, 284, 289, 290, 348, 780, 781], 'sport-climbing-tour'),
  ...ids([604, 674], 'advanced-sport-climbing-tour'),
  ...ids([642], 'private-coaching'),
  ...ids([696], 'spain-rock-tour'),
])

function calendarDate(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null
}

function reviewedOverrides(seed: CanonicalSeed) {
  const dates = seed.collections.find((entry) => entry.slug === 'event-dates')?.rows ?? []
  return Object.fromEntries(dates.flatMap((row) => {
    const label = REVIEWED_CONTEXT_LABELS.get(String(row.id))
    const start = calendarDate(row.dateFrom)
    return label && start ? [[String(row.id), `${label}-${start}`]] : []
  }))
}

export function backfillOccurrenceIdentities(
  input: CanonicalSeed,
  overrides: Record<string, string>,
  options: { rebuild?: boolean } = {},
): { seed: CanonicalSeed; report: OccurrenceIdentityReport } {
  const seed = structuredClone(input)
  const locations = new Map(
    (seed.collections.find((entry) => entry.slug === 'locations')?.rows ?? [])
      .map((row) => [String(row.id), row.slug]),
  )
  const dates = seed.collections.find((entry) => entry.slug === 'event-dates')?.rows ?? []
  const candidates: Array<{ row: Record<string, unknown>; base: string; reviewed: boolean }> = []
  const missingReviewedOverrideIds: Array<string | number> = []

  for (const row of dates) {
    if (!options.rebuild && typeof row.slug === 'string' && row.slug) continue
    const start = calendarDate(row.dateFrom)
    const relations = Array.isArray(row.locations) ? row.locations : []
    const override = overrides[String(row.id)]
    const locationSlug = relations.length === 1 ? locations.get(String(relations[0])) : undefined
    const base = override || (typeof locationSlug === 'string' && start ? `${locationSlug}-${start}` : null)
    if (!base) {
      missingReviewedOverrideIds.push(row.id as string | number)
      continue
    }
    candidates.push({ row, base: normalizeOccurrenceSlug(base), reviewed: Boolean(override) })
  }

  const baseCounts = new Map<string, number>()
  for (const candidate of candidates) {
    const key = `${candidate.row.event}:${candidate.base}`
    baseCounts.set(key, (baseCounts.get(key) ?? 0) + 1)
  }
  let durationQualified = 0
  const proposed = candidates.map((candidate) => {
    const collides = (baseCounts.get(`${candidate.row.event}:${candidate.base}`) ?? 0) > 1
    const end = calendarDate(candidate.row.dateTo)
    if (collides && end) durationQualified += 1
    return { ...candidate, slug: collides && end ? `${candidate.base}-to-${end}` : candidate.base }
  })
  const finalGroups = new Map<string, typeof proposed>()
  for (const candidate of proposed) {
    const key = `${candidate.row.event}:${candidate.slug}`
    finalGroups.set(key, [...(finalGroups.get(key) ?? []), candidate])
  }
  const previousUnresolvedIdentityIds: Array<string | number> = options.rebuild ? [] : dates
    .filter((row) => row.indexable === false && typeof row.slug === 'string' && row.slug.includes('-legacy-record-'))
    .map((row) => row.id as string | number)
  const unresolvedIdentityIds = [...previousUnresolvedIdentityIds]
  let semanticCollisionRecordCount = 0
  let exactFingerprintDuplicateRecordCount = 0
  let canonicalActiveCollisionOwners = 0
  const fingerprint = (row: Record<string, unknown>) => JSON.stringify([
    row.event, row.dateFrom, row.dateTo, row.price, row.vat, row.currency, row.capacity,
    row.minParticipants, row.active, row.airportFrom, row.airportTo,
    [...(Array.isArray(row.locations) ? row.locations : [])].sort(),
    [...(Array.isArray(row.guides) ? row.guides : [])].sort(),
  ])
  for (const group of finalGroups.values()) {
    const collides = group.length > 1
    if (collides) semanticCollisionRecordCount += group.length
    const active = group.filter((candidate) => candidate.row.active === true)
    const canonicalOwner = collides && active.length === 1 ? active[0] : undefined
    if (canonicalOwner) canonicalActiveCollisionOwners += 1
    const fingerprintCounts = new Map<string, number>()
    for (const candidate of group) {
      const key = fingerprint(candidate.row)
      fingerprintCounts.set(key, (fingerprintCounts.get(key) ?? 0) + 1)
    }
    exactFingerprintDuplicateRecordCount += group.filter((candidate) => (fingerprintCounts.get(fingerprint(candidate.row)) ?? 0) > 1).length
    for (const candidate of group) {
      const unresolved = collides && candidate !== canonicalOwner
      if (unresolved) unresolvedIdentityIds.push(candidate.row.id as string | number)
      candidate.row.slug = unresolved ? `${candidate.slug}-legacy-record-${candidate.row.id}` : candidate.slug
      candidate.row.slugAliases = []
      candidate.row.indexable = !unresolved
    }
  }

  // Recompute from final stored state so review output is identical after a write.
  const semanticGroups = new Map<string, Array<Record<string, unknown>>>()
  for (const row of dates) {
    if (typeof row.slug !== 'string') continue
    const semanticSlug = row.slug.replace(/-legacy-record-\d+$/, '')
    const key = `${row.event}:${semanticSlug}`
    semanticGroups.set(key, [...(semanticGroups.get(key) ?? []), row])
  }
  semanticCollisionRecordCount = 0
  exactFingerprintDuplicateRecordCount = 0
  canonicalActiveCollisionOwners = 0
  for (const group of semanticGroups.values()) {
    if (group.length < 2) continue
    semanticCollisionRecordCount += group.length
    if (group.filter((row) => row.active === true).length === 1) canonicalActiveCollisionOwners += 1
    const counts = new Map<string, number>()
    for (const row of group) counts.set(fingerprint(row), (counts.get(fingerprint(row)) ?? 0) + 1)
    exactFingerprintDuplicateRecordCount += group.filter((row) => (counts.get(fingerprint(row)) ?? 0) > 1).length
  }

  const canonicalCounts = new Map<string, number>()
  for (const row of dates) {
    if (typeof row.slug !== 'string') continue
    const key = `${row.event}:${row.slug}`
    canonicalCounts.set(key, (canonicalCounts.get(key) ?? 0) + 1)
  }
  const duplicateCanonicalPaths = [...canonicalCounts].filter(([, count]) => count > 1).map(([key]) => key)
  const identities = occurrenceIdentityMap(seed)
  let canonicalizedHrefCount = 0
  function canonicalizeLinks(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonicalizeLinks)
    if (!value || typeof value !== 'object') return value
    return Object.fromEntries(Object.entries(value).map(([key, child]) => {
      if (key === 'href' && typeof child === 'string') {
        const canonical = remapOccurrenceHref(child, identities)
        if (canonical !== child) canonicalizedHrefCount += 1
        return [key, canonical]
      }
      return [key, canonicalizeLinks(child)]
    }))
  }
  seed.collections = canonicalizeLinks(seed.collections) as CanonicalSeed['collections']
  return {
    seed,
    report: {
      total: dates.length,
      changed: proposed.length,
      derived: proposed.filter((entry) => !entry.reviewed).length,
      reviewed: proposed.filter((entry) => entry.reviewed).length,
      durationQualified,
      unresolvedIdentityCount: unresolvedIdentityIds.length,
      unresolvedIdentityIds,
      missingReviewedOverrideIds,
      duplicateCanonicalPaths,
      canonicalizedHrefCount,
      semanticCollisionRecordCount,
      exactFingerprintDuplicateRecordCount,
      canonicalActiveCollisionOwners,
    },
  }
}

async function main() {
  const write = process.argv.includes('--write')
  const seed = await readCanonicalSeed(CANONICAL_SEED_FILE)
  const result = backfillOccurrenceIdentities(seed, reviewedOverrides(seed), {
    rebuild: process.argv.includes('--rebuild'),
  })
  console.log(JSON.stringify({ mode: write ? 'write' : 'review', ...result.report }))
  if (result.report.missingReviewedOverrideIds.length || result.report.duplicateCanonicalPaths.length) {
    throw new Error('Occurrence identity review is incomplete; no snapshot was written.')
  }
  if (write) {
    result.seed.generatedAt = new Date().toISOString()
    if (!result.seed.source.includes('offline occurrence identity review/backfill')) {
      result.seed.source = `${result.seed.source}; offline occurrence identity review/backfill`
    }
    await writeCanonicalSeed(CANONICAL_SEED_FILE, result.seed)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    console.error('Canonical occurrence identity backfill failed')
    process.exitCode = 1
  })
}
