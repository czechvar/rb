/** Build the reviewed launch Trip Variant dataset without touching a database. */
import { pathToFileURL } from 'node:url'
import {
  CANONICAL_SEED_FILE,
  readCanonicalSeed,
  writeCanonicalSeed,
  type CanonicalSeed,
} from './shared'

export const TRIP_VARIANT_LAUNCH_CUTOFF = '2026-09-14'

type Row = Record<string, unknown>

export type TripVariantMigrationReport = {
  launchEvents: number
  launchEventDates: number
  tripVariants: number
  indexableVariants: number
  inheritedVariants: number
  promotedEditorialPayloads: number
  sameStartDateCollisions: number
  promotedExtraContent: number
  extraContentWithoutValue: number
  extraContentConflicts: number
  promotedLogisticsOverrides: number
  logisticsWithoutValue: number
  logisticsConflicts: number
  logisticsConflictVariants: string[]
}

const EXPLICIT_SLUG_BY_EVENT_DATE: Record<string, string> = {
  '723': 'europe-tour',
  '674': 'margalef-rodellar',
  '747': 'spain-tour',
}

function rows(seed: CanonicalSeed, slug: string) {
  return seed.collections.find((collection) => collection.slug === slug)?.rows ?? []
}

function relationID(value: unknown) {
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: unknown }).id)
  return String(value)
}

function locationIDs(row: Row) {
  const values = Array.isArray(row.locations) ? row.locations : []
  return values.map(relationID).sort((a, b) => Number(a) - Number(b))
}

function variantKey(row: Row) {
  return `${relationID(row.event)}:${locationIDs(row).join(',')}`
}

function isMeaningful(value: unknown, key?: string): boolean {
  if (key === 'id' || value == null || value === '' || value === false) return false
  if (Array.isArray(value)) return value.some((entry) => isMeaningful(entry))
  if (typeof value === 'object') {
    return Object.entries(value as Row).some(([childKey, entry]) => isMeaningful(entry, childKey))
  }
  return true
}

export function normalizedPromotableValue(value: unknown, key?: string): unknown {
  if (key === 'id' || value == null || value === '' || value === false) return undefined
  if (Array.isArray(value)) {
    const entries = value
      .map((entry) => normalizedPromotableValue(entry))
      .filter((entry) => entry !== undefined)
    return entries.length ? entries : undefined
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Row)
      .map(([childKey, entry]) => [childKey, normalizedPromotableValue(entry, childKey)] as const)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
    return entries.length ? Object.fromEntries(entries) : undefined
  }
  return value
}

function consensus(group: Row[], field: 'extraContent' | 'logisticsOverrides') {
  const values = new Map<string, unknown>()
  for (const row of group) {
    const normalized = normalizedPromotableValue(row[field])
    if (normalized !== undefined) values.set(JSON.stringify(normalized), row[field])
  }
  if (values.size === 0) return { status: 'none' as const }
  if (values.size > 1) return { status: 'conflict' as const }
  return { status: 'promoted' as const, value: structuredClone([...values.values()][0]) }
}

function launchDate(row: Row, publishedEvents: Set<string>) {
  return (
    row.active === true &&
    publishedEvents.has(relationID(row.event)) &&
    typeof row.dateFrom === 'string' &&
    row.dateFrom.slice(0, 10) > TRIP_VARIANT_LAUNCH_CUTOFF
  )
}

function publicDateKey(row: Row) {
  return `${String(row.dateFrom).slice(0, 10)}-to-${String(row.dateTo).slice(0, 10)}`
}

function explicitSlug(group: Row[]) {
  for (const row of group) {
    const slug = EXPLICIT_SLUG_BY_EVENT_DATE[relationID(row.id)]
    if (slug) return slug
  }
}

function sortedRecord(value: Row) {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
}

/**
 * Pure, repeatable transformation of the canonical snapshot. Event Date content
 * stays in place during the additive migration; only audited rich editorial is
 * copied to the shared Trip Variant.
 */
export function migrateLaunchTripVariants(input: CanonicalSeed): {
  seed: CanonicalSeed
  report: TripVariantMigrationReport
} {
  const seed = structuredClone(input)
  const events = rows(seed, 'events')
  const dates = rows(seed, 'event-dates')
  const locations = rows(seed, 'locations')
  const publishedEvents = new Set(
    events.filter((event) => event.state === 'published').map((event) => relationID(event.id)),
  )
  const eventByID = new Map(events.map((event) => [relationID(event.id), event]))
  const locationByID = new Map(locations.map((location) => [relationID(location.id), location]))
  const launchDates = dates.filter((date) => launchDate(date, publishedEvents))
  const groups = new Map<string, Row[]>()
  for (const date of launchDates) {
    const key = variantKey(date)
    groups.set(key, [...(groups.get(key) ?? []), date])
  }

  const allDatesByVariant = new Map<string, Row[]>()
  for (const date of dates) {
    const key = variantKey(date)
    allDatesByVariant.set(key, [...(allDatesByVariant.get(key) ?? []), date])
  }

  const promotionCounts = {
    promotedExtraContent: 0,
    extraContentWithoutValue: 0,
    extraContentConflicts: 0,
    promotedLogisticsOverrides: 0,
    logisticsWithoutValue: 0,
    logisticsConflicts: 0,
  }
  const logisticsConflictVariants: string[] = []

  const variantRows = [...groups.entries()].map(([key, group]) => {
    const sourceCandidates = (allDatesByVariant.get(key) ?? []).filter((date) =>
      isMeaningful(date.editorial),
    )
    if (sourceCandidates.length > 1) {
      throw new Error(`Ambiguous Trip Variant editorial source: ${key}`)
    }
    const first = [...group].sort((a, b) => Number(a.id) - Number(b.id))[0]
    const eventID = relationID(first.event)
    const event = eventByID.get(eventID)
    if (!event) throw new Error(`Missing Event for Trip Variant: ${eventID}`)
    const locationRecords = locationIDs(first).map((id) => locationByID.get(id)).filter(Boolean) as Row[]
    const slug = explicitSlug(group) ?? (locationRecords.length === 1 ? String(locationRecords[0].slug) : '')
    if (!slug) throw new Error(`Trip Variant needs an explicit slug: ${key}`)
    const locationLabel =
      slug === 'europe-tour' ? 'Europe Tour' :
      slug === 'spain-tour' ? 'Spain Tour' :
      locationRecords.map((location) => String(location.title ?? location.name ?? location.slug)).join(' + ')
    const source = sourceCandidates[0]
    const extraContent = consensus(group, 'extraContent')
    const logisticsOverrides = consensus(group, 'logisticsOverrides')
    promotionCounts[
      extraContent.status === 'promoted' ? 'promotedExtraContent' :
      extraContent.status === 'none' ? 'extraContentWithoutValue' : 'extraContentConflicts'
    ] += 1
    promotionCounts[
      logisticsOverrides.status === 'promoted' ? 'promotedLogisticsOverrides' :
      logisticsOverrides.status === 'none' ? 'logisticsWithoutValue' : 'logisticsConflicts'
    ] += 1
    if (logisticsOverrides.status === 'conflict') {
      logisticsConflictVariants.push(`${String(event.slug)}/${slug}`)
    }
    const result: Row = {
      id: first.id,
      event: first.event,
      title: `${String(event.title)} — ${locationLabel}`,
      slug,
      slugAliases: [],
      locations: first.locations,
      active: true,
      indexable: Boolean(source),
      extraContent: extraContent.status === 'promoted' ? extraContent.value : null,
      logisticsOverrides: logisticsOverrides.status === 'promoted' ? logisticsOverrides.value : null,
    }
    if (source) result.editorial = structuredClone(source.editorial)
    return result
  }).sort((a, b) => Number(a.id) - Number(b.id))

  const variantIDByKey = new Map(
    variantRows.map((variant) => [
      `${relationID(variant.event)}:${locationIDs(variant).join(',')}`,
      variant.id,
    ]),
  )
  const launchIDs = new Set(launchDates.map((date) => relationID(date.id)))
  const migratedDates = dates.map((date) => {
    if (!launchIDs.has(relationID(date.id))) return date
    return {
      ...date,
      tripVariant: variantIDByKey.get(variantKey(date)),
      publicDateKey: publicDateKey(date),
    }
  })

  const existingVariants = seed.collections.findIndex(({ slug }) => slug === 'trip-variants')
  if (existingVariants >= 0) seed.collections[existingVariants].rows = variantRows
  else {
    const dateIndex = seed.collections.findIndex(({ slug }) => slug === 'event-dates')
    seed.collections.splice(dateIndex < 0 ? seed.collections.length : dateIndex, 0, {
      slug: 'trip-variants' as never,
      rows: variantRows,
    })
  }
  const dateCollection = seed.collections.find(({ slug }) => slug === 'event-dates')
  if (dateCollection) dateCollection.rows = migratedDates
  const provenance = 'offline launch Trip Variant migration'
  if (!seed.source.includes(provenance)) seed.source = `${seed.source}; ${provenance}`

  const collisionCount = [...groups.values()].reduce((sum, group) => {
    const counts = new Map<string, number>()
    for (const date of group) {
      const start = String(date.dateFrom).slice(0, 10)
      counts.set(start, (counts.get(start) ?? 0) + 1)
    }
    return sum + [...counts.values()].filter((count) => count > 1).length
  }, 0)
  const indexableVariants = variantRows.filter((variant) => variant.indexable === true).length
  return {
    seed,
    report: sortedRecord({
      launchEvents: new Set(launchDates.map((date) => relationID(date.event))).size,
      launchEventDates: launchDates.length,
      tripVariants: variantRows.length,
      indexableVariants,
      inheritedVariants: variantRows.length - indexableVariants,
      promotedEditorialPayloads: indexableVariants,
      sameStartDateCollisions: collisionCount,
      ...promotionCounts,
      logisticsConflictVariants: logisticsConflictVariants.sort(),
    }) as TripVariantMigrationReport,
  }
}

async function main() {
  const write = process.argv.includes('--write')
  const result = migrateLaunchTripVariants(await readCanonicalSeed(CANONICAL_SEED_FILE))
  if (write) await writeCanonicalSeed(CANONICAL_SEED_FILE, result.seed)
  console.log(JSON.stringify({ mode: write ? 'write' : 'check', ...result.report }))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    console.error('Launch Trip Variant migration failed')
    process.exitCode = 1
  })
}
