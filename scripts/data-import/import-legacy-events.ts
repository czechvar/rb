/**
 * Import legacy Rockbusters events and event dates into Payload.
 *
 * Legacy IDs stay in lookup JSON files, not in Payload schemas:
 *   - scripts/data-import/seed/legacy-event-lookup.json
 *   - scripts/data-import/seed/legacy-event-date-lookup.json
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { getPayload, type Payload } from 'payload'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import config from '../../src/payload.config'
import { eventTaxonomy, type EventTaxonomyField } from '../../src/lib/taxonomy/event'

const SEED_DIR = path.resolve(import.meta.dirname, 'seed')
const EVENTS_FILE = path.join(SEED_DIR, 'legacy-events.json')
const EVENT_DATES_FILE = path.join(SEED_DIR, 'legacy-event-dates.json')
const TYPE_LOOKUP_FILE = path.join(SEED_DIR, 'legacy-event-date-type-lookup.json')
const EVENT_LOOKUP_FILE = path.join(SEED_DIR, 'legacy-event-lookup.json')
const EVENT_DATE_LOOKUP_FILE = path.join(SEED_DIR, 'legacy-event-date-lookup.json')
const GUIDE_LOOKUP_FILE = path.join(SEED_DIR, 'legacy-guide-lookup.json')
const AIRPORT_LOOKUP_FILE = path.join(SEED_DIR, 'legacy-airport-lookup.json')
const DEFAULT_MEDIA_LOOKUP_FILE =
  '/media/czechspekk/ws-backup-data-1/xbusters/rockbusters/media-transfer/payload-media-lookup.json'
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type EditorConfig = Awaited<ReturnType<typeof editorConfigFactory.default>>
type LexicalState = ReturnType<typeof convertHTMLToLexical>

type SeedFile<Row> = {
  generatedAt: string
  source: string
  rows: Row[]
}

type LookupFile<T> = {
  byLegacyTypeSlug?: Record<string, T>
  byLegacyGuideId?: Record<string, number>
  byLegacyAirportId?: Record<string, number>
  byLegacyEventId?: Record<string, number>
  byLegacyEventDateId?: Record<string, number>
}

type TaxonomyProjection = {
  categories?: string[]
  programs?: string[]
  difficulties?: string[]
  climbingStyles?: string[]
  audienceTags?: string[]
  formatTags?: string[]
  partnerTags?: string[]
}

type LegacyEventRow = {
  id: number
  title: string
  slug: string
  perex: string | null
  body: string | null
  display: number
  coverImageId: number | null
  fbShareImageId: number | null
  privateGuiding: number | null
  testCenter: number | null
  keywords: string | null
  description: string | null
  pageTitle: string | null
  includeText: string | null
  itineraryText: string | null
  bodyMore: string | null
  included: string | null
  excluded: string | null
  accommodation: string | null
  food: string | null
  whatToBring: string | null
  needToKnow1: string | null
  needToKnow2: string | null
  needToKnow3: string | null
  needToKnow4: string | null
  airportDepartureId: number | null
  airportArrivalId: number | null
  locationSlugs: string[]
  guideLegacyIds: number[]
  typeSlugs: string[]
}

type LegacyEventDateRow = {
  id: number
  eventId: number
  eventSlug: string
  slug: string
  title: string | null
  start: string
  end: string
  price: string | number
  capacity: number
  hidden: number
  full: number
  body: string | null
  eventText: string | null
  bodyMore: string | null
  perex: string | null
  coverImageId: number | null
  coverImageDetailPageId: number | null
  fbShareImageId: number | null
  galleryId: number | null
  airportDepartureId: number | null
  airportArrivalId: number | null
  keywords: string | null
  description: string | null
  priceDetail: string | null
  pageTitle: string | null
  canonicalUrl: string | null
  vimeoId: number | null
  accommodation: string | null
  food: string | null
  included: string | null
  excluded: string | null
  whatToBring: string | null
  locationSlugs: string[]
  guideLegacyIds: number[]
  typeSlugs: string[]
  galleryMediaIds: number[]
}

type RelationLookups = {
  categoriesBySlug: Map<string, number>
  programsBySlug: Map<string, number>
  difficultiesByName: Map<string, number>
  locationsBySlug: Map<string, number>
  guideByLegacyId: Map<string, number>
  airportByLegacyId: Map<string, number>
  mediaByLegacyId: Map<string, string>
}

type ImportReport = {
  eventsCreated: number
  eventsUpdated: number
  eventDatesCreated: number
  eventDatesUpdated: number
  missingLocations: Set<string>
  missingGuides: Set<string>
  missingAirports: Set<string>
  missingMedia: Set<string>
  missingTypeMappings: Set<string>
}

function assertNotProduction() {
  const dbUrl = process.env.DATABASE_URL ?? ''
  if (dbUrl.includes(PRODUCTION_DB_HOST) && !process.argv.includes('--allow-production')) {
    console.error(
      'DATABASE_URL points at the PRODUCTION Neon branch. ' +
        'Re-run with --allow-production only if that is intentional.',
    )
    process.exit(1)
  }
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, 'utf8')) as T
}

async function readJsonIfExists<T>(file: string, fallback: T): Promise<T> {
  try {
    return await readJson<T>(file)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return fallback
    throw err
  }
}

function unique<T>(values: Array<T | null | undefined>): T[] {
  return [...new Set(values.filter((value): value is T => value !== null && value !== undefined))]
}

function validHref(value: string): boolean {
  if (value.startsWith('/') || value.startsWith('#')) return true
  try {
    const url = new URL(value)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
  } catch {
    return false
  }
}

function cleanBody(html: string | null | undefined): string {
  if (!html?.trim()) return ''
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`)
  const body = dom.window.document.body

  body.querySelectorAll('img').forEach((img) => img.remove())
  body.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'))
  body.querySelectorAll('a').forEach((anchor) => {
    const href = anchor.getAttribute('href')?.trim()
    if (!href || !validHref(href)) {
      anchor.replaceWith(...anchor.childNodes)
    }
  })
  body.querySelectorAll('p').forEach((p) => {
    const text = (p.textContent ?? '').replace(/ /g, '').trim()
    if (!text && p.children.length === 0) p.remove()
  })

  return body.innerHTML.trim()
}

function cleanPlainText(value: string | null | undefined): string | undefined {
  const html = cleanBody(value)
  if (!html) return undefined
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`)
  const text = dom.window.document.body.textContent?.replace(/\s+/g, ' ').trim()
  return text || undefined
}

function normalizedHtml(value: string | null | undefined): string {
  return cleanBody(value).replace(/\s+/g, ' ').trim()
}

function toLexical(
  html: string | null | undefined,
  editorConfig: EditorConfig,
): LexicalState | undefined {
  const cleaned = cleanBody(html)
  if (!cleaned) return undefined
  return convertHTMLToLexical({ editorConfig, html: cleaned, JSDOM })
}

function textItems(value: string | null | undefined): Array<{ text: string }> {
  const html = cleanBody(value)
  if (!html) return []
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`)
  const listItems = [...dom.window.document.querySelectorAll('li')]
    .map((item) => item.textContent?.replace(/\s+/g, ' ').trim())
    .filter((item): item is string => Boolean(item))
  if (listItems.length) return unique(listItems).map((text) => ({ text }))

  const text = dom.window.document.body.textContent?.replace(/\s+/g, ' ').trim()
  return text ? [{ text }] : []
}

function dateOnly(value: string): string {
  return value.slice(0, 10)
}

function assertTaxonomyProjection(projection: TaxonomyProjection, sourceSlug: string) {
  const fields: EventTaxonomyField[] = [
    'climbingStyles',
    'audienceTags',
    'formatTags',
    'partnerTags',
  ]
  for (const field of fields) {
    for (const value of projection[field] ?? []) {
      if (!(value in eventTaxonomy[field])) {
        throw new Error(`Unknown ${field} value "${value}" in mapping for ${sourceSlug}`)
      }
    }
  }
}

export function projectTypeSlugs(
  typeSlugs: string[],
  typeLookup: Map<string, TaxonomyProjection>,
  missing = new Set<string>(),
): Required<TaxonomyProjection> {
  const projected: Required<TaxonomyProjection> = {
    categories: [],
    programs: [],
    difficulties: [],
    climbingStyles: [],
    audienceTags: [],
    formatTags: [],
    partnerTags: [],
  }

  for (const slug of typeSlugs) {
    const projection = typeLookup.get(slug)
    if (!projection) {
      missing.add(slug)
      continue
    }
    assertTaxonomyProjection(projection, slug)
    projected.categories.push(...(projection.categories ?? []))
    projected.programs.push(...(projection.programs ?? []))
    projected.difficulties.push(...(projection.difficulties ?? []))
    projected.climbingStyles.push(...(projection.climbingStyles ?? []))
    projected.audienceTags.push(...(projection.audienceTags ?? []))
    projected.formatTags.push(...(projection.formatTags ?? []))
    projected.partnerTags.push(...(projection.partnerTags ?? []))
  }

  return {
    categories: unique(projected.categories),
    programs: unique(projected.programs),
    difficulties: unique(projected.difficulties),
    climbingStyles: unique(projected.climbingStyles),
    audienceTags: unique(projected.audienceTags),
    formatTags: unique(projected.formatTags),
    partnerTags: unique(projected.partnerTags),
  }
}

function resolveIds(
  values: Array<string | number>,
  lookup: Map<string, number>,
  missing: Set<string>,
): number[] {
  return unique(values.map((value) => {
    const key = String(value)
    const id = lookup.get(key)
    if (!id) missing.add(key)
    return id
  }))
}

function mediaId(
  legacyId: number | null | undefined,
  lookup: Map<string, string>,
  missing: Set<string>,
): string | null {
  if (!legacyId) return null
  const id = lookup.get(String(legacyId))
  if (!id) missing.add(String(legacyId))
  return id ?? null
}

function relationData(row: LegacyEventRow, projection: Required<TaxonomyProjection>, lookups: RelationLookups, report: ImportReport) {
  return {
    categories: resolveIds(projection.categories, lookups.categoriesBySlug, report.missingTypeMappings),
    programs: resolveIds(projection.programs, lookups.programsBySlug, report.missingTypeMappings),
    difficulties: resolveIds(projection.difficulties, lookups.difficultiesByName, report.missingTypeMappings),
    locations: resolveIds(row.locationSlugs, lookups.locationsBySlug, report.missingLocations),
    coaches: resolveIds(row.guideLegacyIds, lookups.guideByLegacyId, report.missingGuides),
    airports: resolveIds(
      unique([row.airportDepartureId, row.airportArrivalId]).map(String),
      lookups.airportByLegacyId,
      report.missingAirports,
    ),
  }
}

export function eventDateActive(row: LegacyEventDateRow, parentEvent: LegacyEventRow): boolean {
  return Boolean(parentEvent.display) && !Boolean(row.hidden) && !Boolean(row.full)
}

function buildAdditionalInfo(row: LegacyEventRow, editorConfig: EditorConfig) {
  const sections = [
    ['Trip overview', row.bodyMore],
    ['Itinerary', row.itineraryText],
    ['Included details', row.includeText],
    ['Need to know', [row.needToKnow1, row.needToKnow2, row.needToKnow3, row.needToKnow4].filter(Boolean).join('<br><br>')],
    ['What to bring', row.whatToBring],
  ] as const

  return sections.flatMap(([heading, html]) => {
    const body = toLexical(html, editorConfig)
    return body ? [{ heading, body }] : []
  })
}

async function buildEventData(
  row: LegacyEventRow,
  editorConfig: EditorConfig,
  typeLookup: Map<string, TaxonomyProjection>,
  lookups: RelationLookups,
  report: ImportReport,
) {
  const projection = projectTypeSlugs(row.typeSlugs, typeLookup, report.missingTypeMappings)
  if (row.privateGuiding) projection.formatTags = unique([...projection.formatTags, 'private-guiding'])
  if (row.testCenter) projection.formatTags = unique([...projection.formatTags, 'demo-test'])

  const relations = relationData(row, projection, lookups, report)
  const mainPicture = mediaId(row.coverImageId, lookups.mediaByLegacyId, report.missingMedia)

  return {
    title: row.title,
    slug: row.slug,
    shortDescription: cleanPlainText(row.perex) ?? null,
    content: toLexical(row.body, editorConfig) ?? null,
    additionalInfo: buildAdditionalInfo(row, editorConfig),
    mainPicture,
    gallery: [],
    categories: relations.categories,
    difficulties: relations.difficulties,
    programs: relations.programs,
    climbingStyles: projection.climbingStyles,
    audienceTags: projection.audienceTags,
    formatTags: projection.formatTags,
    partnerTags: projection.partnerTags,
    locations: relations.locations,
    accommodation: {
      description: toLexical(row.accommodation, editorConfig) ?? null,
      included: textItems(row.included),
      notIncluded: textItems(row.excluded),
      cuisineHighlights: toLexical(row.food, editorConfig) ?? null,
    },
    transport: {
      description: null,
      airports: relations.airports,
    },
    coaches: relations.coaches,
    featured: false,
    state: row.display ? 'published' : 'draft',
    seo: {
      title: row.pageTitle ?? null,
      description: row.description ?? null,
      keywords: row.keywords ?? null,
    },
  }
}

function buildLogisticsOverrides(
  row: LegacyEventDateRow,
  parentEvent: LegacyEventRow,
  editorConfig: EditorConfig,
) {
  const overrides: Record<string, LexicalState | null> = {}
  const fields = [
    ['accommodation', row.accommodation, parentEvent.accommodation],
    ['food', row.food, parentEvent.food],
    ['included', row.included, parentEvent.included],
    ['excluded', row.excluded, parentEvent.excluded],
    ['note', row.priceDetail, null],
  ] as const

  for (const [field, value, parentValue] of fields) {
    if (!normalizedHtml(value)) continue
    if (parentValue !== null && normalizedHtml(value) === normalizedHtml(parentValue)) continue
    overrides[field] = toLexical(value, editorConfig) ?? null
  }

  return Object.keys(overrides).length ? overrides : undefined
}

async function buildEventDateData(
  row: LegacyEventDateRow,
  parentEvent: LegacyEventRow,
  payloadEventId: number,
  eventLocationIds: number[],
  eventGuideIds: number[],
  editorConfig: EditorConfig,
  lookups: RelationLookups,
  report: ImportReport,
) {
  const guides = row.guideLegacyIds.length
    ? resolveIds(row.guideLegacyIds, lookups.guideByLegacyId, report.missingGuides)
    : eventGuideIds
  const airportFrom = row.airportDepartureId
    ? lookups.airportByLegacyId.get(String(row.airportDepartureId)) ?? null
    : null
  const airportTo = row.airportArrivalId
    ? lookups.airportByLegacyId.get(String(row.airportArrivalId)) ?? null
    : null
  if (row.airportDepartureId && !airportFrom) report.missingAirports.add(String(row.airportDepartureId))
  if (row.airportArrivalId && !airportTo) report.missingAirports.add(String(row.airportArrivalId))

  const extraHtml = normalizedHtml(row.eventText) ? row.eventText : row.body

  return {
    event: payloadEventId,
    dateFrom: dateOnly(row.start),
    dateTo: dateOnly(row.end),
    locations: row.locationSlugs.length
      ? resolveIds(row.locationSlugs, lookups.locationsBySlug, report.missingLocations)
      : eventLocationIds,
    guides,
    airportFrom,
    airportTo,
    price: Number(row.price),
    vat: 21,
    currency: 'EUR',
    capacity: row.capacity,
    minParticipants: 0,
    extraContent: toLexical(extraHtml, editorConfig) ?? null,
    logisticsOverrides: buildLogisticsOverrides(row, parentEvent, editorConfig),
    active: eventDateActive(row, parentEvent),
  }
}

async function collectionLookup(
  payload: Payload,
  collection: 'categories' | 'programs' | 'locations',
  field: 'slug' | 'name' = 'slug',
) {
  const docs = await payload.find({ collection, limit: 10_000, depth: 0 })
  return new Map(docs.docs.map((doc) => [String(doc[field]), Number(doc.id)]))
}

async function difficultyLookup(payload: Payload) {
  const docs = await payload.find({ collection: 'difficulties', limit: 10_000, depth: 0 })
  const byName = new Map(docs.docs.map((doc) => [doc.name, doc.id]))
  if (!byName.has('Expert')) {
    const expert = await payload.create({
      collection: 'difficulties',
      data: { name: 'Expert', active: true },
    })
    byName.set('Expert', expert.id)
  }
  return byName
}

async function readLookups(payload: Payload): Promise<RelationLookups> {
  const [guideLookup, airportLookup, mediaLookup] = await Promise.all([
    readJson<LookupFile<unknown>>(GUIDE_LOOKUP_FILE),
    readJson<LookupFile<unknown>>(AIRPORT_LOOKUP_FILE),
    readJsonIfExists<{ byLegacyMediaId?: Record<string, string> }>(
      process.env.PAYLOAD_MEDIA_LOOKUP_FILE ?? DEFAULT_MEDIA_LOOKUP_FILE,
      {},
    ),
  ])

  return {
    categoriesBySlug: await collectionLookup(payload, 'categories'),
    programsBySlug: await collectionLookup(payload, 'programs'),
    difficultiesByName: await difficultyLookup(payload),
    locationsBySlug: await collectionLookup(payload, 'locations'),
    guideByLegacyId: new Map(Object.entries(guideLookup.byLegacyGuideId ?? {})),
    airportByLegacyId: new Map(Object.entries(airportLookup.byLegacyAirportId ?? {})),
    mediaByLegacyId: new Map(Object.entries(mediaLookup.byLegacyMediaId ?? {})),
  }
}

async function upsertEvent(payload: Payload, row: LegacyEventRow, data: Record<string, unknown>) {
  const existing = await payload.find({
    collection: 'events',
    where: { slug: { equals: row.slug } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await payload.update({ collection: 'events', id: existing.docs[0].id, data: data as any })
    return { created: false, id: updated.id }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const created = await payload.create({ collection: 'events', data: data as any })
  return { created: true, id: created.id }
}

async function upsertEventDate(
  payload: Payload,
  row: LegacyEventDateRow,
  data: Record<string, unknown>,
  existingLookup: Map<string, number>,
  usedPayloadEventDateIds: Set<number>,
) {
  const lookupId = existingLookup.get(String(row.id))
  if (lookupId) {
    if (!usedPayloadEventDateIds.has(lookupId)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updated = await payload.update({ collection: 'event-dates', id: lookupId, data: data as any })
        usedPayloadEventDateIds.add(updated.id)
        return { created: false, id: updated.id }
      } catch {
        existingLookup.delete(String(row.id))
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const created = await payload.create({ collection: 'event-dates', data: data as any })
  usedPayloadEventDateIds.add(created.id)
  return { created: true, id: created.id }
}

async function writeLookup(file: string, payload: Record<string, unknown>) {
  await fs.writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

function emptyReport(): ImportReport {
  return {
    eventsCreated: 0,
    eventsUpdated: 0,
    eventDatesCreated: 0,
    eventDatesUpdated: 0,
    missingLocations: new Set(),
    missingGuides: new Set(),
    missingAirports: new Set(),
    missingMedia: new Set(),
    missingTypeMappings: new Set(),
  }
}

async function main() {
  assertNotProduction()

  const [eventsSeed, eventDatesSeed, typeLookupFile, existingEventDateLookup] = await Promise.all([
    readJson<SeedFile<LegacyEventRow>>(EVENTS_FILE),
    readJson<SeedFile<LegacyEventDateRow>>(EVENT_DATES_FILE),
    readJson<LookupFile<TaxonomyProjection>>(TYPE_LOOKUP_FILE),
    readJsonIfExists<LookupFile<unknown>>(EVENT_DATE_LOOKUP_FILE, {}),
  ])

  const typeLookup = new Map(Object.entries(typeLookupFile.byLegacyTypeSlug ?? {}))
  const eventRowsByLegacyId = new Map(eventsSeed.rows.map((row) => [row.id, row]))
  const payload = await getPayload({ config })
  const editorConfig = await editorConfigFactory.default({ config: payload.config })
  const lookups = await readLookups(payload)
  const report = emptyReport()

  const eventLookupRows: Array<{ legacyEventId: number; slug: string; payloadEventId: number }> = []
  const eventIdsByLegacyId = new Map<string, number>()
  const eventRelationsByLegacyId = new Map<number, { locations: number[]; guides: number[] }>()

  for (const row of eventsSeed.rows) {
    try {
      const projection = projectTypeSlugs(row.typeSlugs, typeLookup, report.missingTypeMappings)
      const relations = relationData(row, projection, lookups, report)
      const data = await buildEventData(row, editorConfig, typeLookup, lookups, report)
      const result = await upsertEvent(payload, row, data)
      eventIdsByLegacyId.set(String(row.id), result.id)
      eventRelationsByLegacyId.set(row.id, { locations: relations.locations, guides: relations.coaches })
      eventLookupRows.push({ legacyEventId: row.id, slug: row.slug, payloadEventId: result.id })
      if (result.created) report.eventsCreated += 1
      else report.eventsUpdated += 1
    } catch (cause) {
      console.error(JSON.stringify((cause as { data?: unknown }).data ?? cause, null, 2))
      throw new Error(`legacy event #${row.id} (${row.slug}) failed`, {
        cause: cause instanceof Error ? cause : undefined,
      })
    }
  }

  const eventDateLookupRows: Array<{
    legacyEventDateId: number
    legacyEventId: number
    slug: string
    payloadEventDateId: number
  }> = []
  const existingEventDateIds = new Map(
    Object.entries(existingEventDateLookup.byLegacyEventDateId ?? {}).map(([key, value]) => [
      key,
      Number(value),
    ]),
  )
  const usedPayloadEventDateIds = new Set<number>()

  for (const row of eventDatesSeed.rows) {
    try {
      const parentEvent = eventRowsByLegacyId.get(row.eventId)
      const payloadEventId = eventIdsByLegacyId.get(String(row.eventId))
      if (!parentEvent || !payloadEventId) continue

      const parentRelations = eventRelationsByLegacyId.get(row.eventId) ?? { locations: [], guides: [] }
      const data = await buildEventDateData(
        row,
        parentEvent,
        payloadEventId,
        parentRelations.locations,
        parentRelations.guides,
        editorConfig,
        lookups,
        report,
      )
      const result = await upsertEventDate(
        payload,
        row,
        data,
        existingEventDateIds,
        usedPayloadEventDateIds,
      )
      eventDateLookupRows.push({
        legacyEventDateId: row.id,
        legacyEventId: row.eventId,
        slug: row.slug,
        payloadEventDateId: result.id,
      })
      if (result.created) report.eventDatesCreated += 1
      else report.eventDatesUpdated += 1
    } catch (cause) {
      console.error(JSON.stringify((cause as { data?: unknown }).data ?? cause, null, 2))
      throw new Error(`legacy event date #${row.id} (${row.slug}) failed`, {
        cause: cause instanceof Error ? cause : undefined,
      })
    }
  }

  await writeLookup(EVENT_LOOKUP_FILE, {
    generatedAt: new Date().toISOString(),
    source: 'scripts/data-import/seed/legacy-events.json + Payload events collection',
    byLegacyEventId: Object.fromEntries(eventLookupRows.map((row) => [row.legacyEventId, row.payloadEventId])),
    bySlug: Object.fromEntries(eventLookupRows.map((row) => [row.slug, row.payloadEventId])),
    rows: eventLookupRows,
  })
  await writeLookup(EVENT_DATE_LOOKUP_FILE, {
    generatedAt: new Date().toISOString(),
    source: 'scripts/data-import/seed/legacy-event-dates.json + Payload event-dates collection',
    byLegacyEventDateId: Object.fromEntries(
      eventDateLookupRows.map((row) => [row.legacyEventDateId, row.payloadEventDateId]),
    ),
    rows: eventDateLookupRows,
  })

  console.log(
    [
      `legacy events: created=${report.eventsCreated}`,
      `updated=${report.eventsUpdated}`,
      `total=${eventsSeed.rows.length}`,
      `lookup=${path.relative(process.cwd(), EVENT_LOOKUP_FILE)}`,
    ].join(' '),
  )
  console.log(
    [
      `legacy event-dates: created=${report.eventDatesCreated}`,
      `updated=${report.eventDatesUpdated}`,
      `total=${eventDatesSeed.rows.length}`,
      `lookup=${path.relative(process.cwd(), EVENT_DATE_LOOKUP_FILE)}`,
    ].join(' '),
  )
  console.log(
    [
      `missing-locations=${report.missingLocations.size}`,
      `missing-guides=${report.missingGuides.size}`,
      `missing-airports=${report.missingAirports.size}`,
      `missing-media=${report.missingMedia.size}`,
      `missing-type-mappings=${report.missingTypeMappings.size}`,
    ].join(' '),
  )
  for (const [label, values] of [
    ['missing locations', report.missingLocations],
    ['missing guides', report.missingGuides],
    ['missing airports', report.missingAirports],
    ['missing media', report.missingMedia],
    ['missing type mappings', report.missingTypeMappings],
  ] as const) {
    if (values.size) console.log(`${label}: ${[...values].sort().join(', ')}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('legacy events import failed:', err)
    process.exit(1)
  })
