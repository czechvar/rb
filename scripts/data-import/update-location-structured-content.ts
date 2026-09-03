/**
 * Update structured destination-detail content for existing Locations.
 *
 * This intentionally updates only `locations.destinationDetail`; canonical
 * Location facts, media, gallery, active state, and source references stay
 * owned by the broader destination import.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Location } from '../../src/payload-types'

const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type ActionInput = {
  label?: string | null
  href?: string | null
}

type StructuredContentInput = {
  slug: string
  hero?: {
    eyebrow?: string | null
    heading?: string | null
    accentWord?: string | null
    body?: string | null
    primaryAction?: ActionInput | null
    heroStats?: Array<Record<string, unknown>> | null
  } | null
  sections?: Array<Record<string, unknown>> | null
  audience?: Array<Record<string, unknown>> | null
  sectors?: Array<Record<string, unknown>> | null
  seasonMonths?: Array<Record<string, unknown>> | null
  gearGroups?: Array<Record<string, unknown>> | null
  transportOptions?: Array<Record<string, unknown>> | null
  accommodationOptions?: Array<Record<string, unknown>> | null
  restDayIdeas?: Array<Record<string, unknown>> | null
  accessRules?: Array<Record<string, unknown>> | null
  safetyItems?: Array<Record<string, unknown>> | null
  costItems?: Array<Record<string, unknown>> | null
  destinationFaqs?: Array<Record<string, unknown>> | null
  tripPromos?: Array<Record<string, unknown>> | null
  relatedDestinations?: Array<{
    slug?: string | null
    name?: string | null
    country?: string | null
    region?: string | null
    summary?: string | null
    sourceStatus?: string | null
    needsVerification?: boolean | null
  }> | null
  cta?: Record<string, unknown> | null
}

type ParsedArgs = {
  slug?: string
  file?: string
  input?: string
  allowProduction: boolean
  validateOnly: boolean
}

type ImportTarget = {
  slug: string
  file: string
}

function assertNotProduction(allowProduction: boolean) {
  const dbUrl = process.env.DATABASE_URL ?? ''
  if (dbUrl.includes(PRODUCTION_DB_HOST) && !allowProduction) {
    console.error(
      'DATABASE_URL points at the PRODUCTION Neon branch. ' +
        'Re-run with --allow-production only if that is intentional.',
    )
    process.exit(1)
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: Partial<ParsedArgs> = { allowProduction: false, validateOnly: false }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--') {
      continue
    } else if (arg === '--slug') {
      parsed.slug = argv[++index]
    } else if (arg === '--file') {
      parsed.file = argv[++index]
    } else if (arg === '--input') {
      parsed.input = argv[++index]
    } else if (arg === '--allow-production') {
      parsed.allowProduction = true
    } else if (arg === '--validate-only') {
      parsed.validateOnly = true
    } else if (arg === '--help') {
      console.log(
        [
          'Usage:',
          '  pnpm data-import:location-structured -- --slug albarracin --file .scratch/albarracin-derived-structured-content.json [--validate-only] [--allow-production]',
          '  pnpm data-import:location-structured -- --input .scratch/location-structured-extraction/output [--validate-only] [--allow-production]',
          '  pnpm data-import:location-structured -- --input .scratch/location-structured-extraction/manifest.json [--validate-only] [--allow-production]',
        ].join('\n'),
      )
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (parsed.input && (parsed.slug || parsed.file)) {
    throw new Error('Use either --input or --slug/--file, not both')
  }
  if (!parsed.input && (!parsed.slug || !parsed.file)) {
    throw new Error('Missing required --input or --slug/--file')
  }

  return parsed as ParsedArgs
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, 'utf8')) as T
}

async function importTargets(args: ParsedArgs): Promise<ImportTarget[]> {
  if (args.slug && args.file) {
    return [{ slug: args.slug, file: path.resolve(args.file) }]
  }

  if (!args.input) throw new Error('Missing import input')
  const input = path.resolve(args.input)
  const inputStat = await fs.stat(input)

  if (inputStat.isDirectory()) {
    const files = (await fs.readdir(input))
      .filter((entry) => entry.endsWith('.json') && entry !== 'manifest.json' && !entry.endsWith('index.json'))
      .sort((a, b) => a.localeCompare(b))

    return Promise.all(
      files.map(async (file) => {
        const filePath = path.join(input, file)
        const data = await readJson<StructuredContentInput>(filePath)
        return { slug: data.slug, file: filePath }
      }),
    )
  }

  const data = await readJson<StructuredContentInput | { destinations?: Array<{ slug?: string; output?: string }> }>(input)
  if ('destinations' in data && Array.isArray(data.destinations)) {
    const baseDir = path.dirname(input)
    return data.destinations.map((destination) => {
      const slug = text(destination.slug)
      const output = text(destination.output)
      if (!slug || !output) throw new Error(`Invalid manifest destination in ${input}`)
      return { slug, file: path.resolve(baseDir, output) }
    })
  }

  if (!('slug' in data) || !data.slug) throw new Error(`Input file is missing slug: ${input}`)
  return [{ slug: data.slug, file: input }]
}

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return cleaned || null
}

function requiredText(value: unknown, field: string): string {
  const cleaned = text(value)
  if (!cleaned) throw new Error(`Missing required text field: ${field}`)
  return cleaned
}

function numberInRange(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Missing required numeric field: ${field}`)
  }
  if (value < min || value > max) {
    throw new Error(`Numeric field out of range: ${field}=${value}`)
  }
  return value
}

function bool(value: unknown): boolean {
  return value === true
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(text).filter((entry): entry is string => Boolean(entry))
}

function mappedArray<T>(
  value: Array<Record<string, unknown>> | null | undefined,
  mapItem: (item: Record<string, unknown>) => T,
): T[] {
  return Array.isArray(value) ? value.map(mapItem) : []
}

function mapSourceFields(item: Record<string, unknown>) {
  return compactObject({
    sourceStatus: text(item.sourceStatus),
    needsVerification: bool(item.needsVerification),
  })
}

function mapHeroStat(item: Record<string, unknown>) {
  return compactObject({
    value: requiredText(item.value, 'hero.heroStats.value'),
    label: requiredText(item.label, 'hero.heroStats.label'),
    derivedFrom: text(item.derivedFrom),
    format: text(item.format),
    note: text(item.note),
    sourceStatus: text(item.sourceStatus),
  })
}

function mapAction(value: unknown) {
  if (!value || typeof value !== 'object') return {}
  const item = value as Record<string, unknown>
  return compactObject({
    label: text(item.label),
    href: text(item.href),
  })
}

function mapDestinationDetail(input: StructuredContentInput, relatedLocationIds: number[]) {
  return compactObject({
    hero: compactObject({
      eyebrow: text(input.hero?.eyebrow),
      heading: text(input.hero?.heading),
      accentWord: text(input.hero?.accentWord),
      body: text(input.hero?.body),
      primaryAction: mapAction(input.hero?.primaryAction),
      heroStats: mappedArray(input.hero?.heroStats, mapHeroStat),
    }),
    sections: mappedArray(input.sections, (item) =>
      compactObject({
        key: requiredText(item.key, 'sections.key'),
        navLabel: text(item.navLabel),
        heading: requiredText(item.heading, 'sections.heading'),
        body: text(item.body),
        keyCharacteristics: stringArray(item.keyCharacteristics),
        sourceStatus: text(item.sourceStatus),
      }),
    ),
    audience: mappedArray(input.audience, (item) =>
      compactObject({
        label: requiredText(item.label, 'audience.label'),
        gradeRange: text(item.gradeRange),
        body: text(item.body),
        badge: text(item.badge),
        tone: text(item.tone),
        ...mapSourceFields(item),
      }),
    ),
    sectors: mappedArray(input.sectors, (item) =>
      compactObject({
        name: requiredText(item.name, 'sectors.name'),
        badges: stringArray(item.badges),
        gradeRange: text(item.gradeRange),
        body: text(item.body),
        ...mapSourceFields(item),
      }),
    ),
    seasonMonths: mappedArray(input.seasonMonths, (item) =>
      compactObject({
        month: numberInRange(item.month, 'seasonMonths.month', 1, 12),
        label: requiredText(item.label, 'seasonMonths.label'),
        score: numberInRange(item.score, 'seasonMonths.score', 0, 5),
        temperature: text(item.temperature),
        conditions: text(item.conditions),
        tone: text(item.tone),
        notes: text(item.notes),
        sourceStatus: text(item.sourceStatus),
      }),
    ),
    gearGroups: mappedArray(input.gearGroups, (item) =>
      compactObject({
        heading: requiredText(item.heading, 'gearGroups.heading'),
        items: stringArray(item.items),
        ...mapSourceFields(item),
      }),
    ),
    transportOptions: mappedArray(input.transportOptions, (item) =>
      compactObject({
        label: requiredText(item.label, 'transportOptions.label'),
        type: text(item.type),
        duration: text(item.duration),
        body: text(item.body),
        recommended: bool(item.recommended),
        ...mapSourceFields(item),
      }),
    ),
    accommodationOptions: mappedArray(input.accommodationOptions, (item) =>
      compactObject({
        type: text(item.type),
        name: requiredText(item.name, 'accommodationOptions.name'),
        body: text(item.body),
        href: text(item.href),
        actionLabel: text(item.actionLabel),
        priceHint: text(item.priceHint),
        ...mapSourceFields(item),
      }),
    ),
    restDayIdeas: mappedArray(input.restDayIdeas, (item) =>
      compactObject({
        title: requiredText(item.title, 'restDayIdeas.title'),
        body: text(item.body),
        distance: text(item.distance),
        ...mapSourceFields(item),
      }),
    ),
    accessRules: mappedArray(input.accessRules, (item) =>
      compactObject({
        title: requiredText(item.title, 'accessRules.title'),
        body: text(item.body),
        tone: text(item.tone),
        ...mapSourceFields(item),
      }),
    ),
    safetyItems: mappedArray(input.safetyItems, (item) =>
      compactObject({
        label: requiredText(item.label, 'safetyItems.label'),
        value: text(item.value),
        body: text(item.body),
        ...mapSourceFields(item),
      }),
    ),
    costItems: mappedArray(input.costItems, (item) =>
      compactObject({
        label: requiredText(item.label, 'costItems.label'),
        unit: text(item.unit),
        budget: text(item.budget),
        midRange: text(item.midRange),
        ...mapSourceFields(item),
      }),
    ),
    destinationFaqs: mappedArray(input.destinationFaqs, (item) =>
      compactObject({
        question: requiredText(item.question, 'destinationFaqs.question'),
        answer: requiredText(item.answer, 'destinationFaqs.answer'),
        ...mapSourceFields(item),
      }),
    ),
    tripPromos: mappedArray(input.tripPromos, (item) =>
      compactObject({
        type: text(item.type),
        title: requiredText(item.title, 'tripPromos.title'),
        body: text(item.body),
        action: mapAction(item.action),
        ...mapSourceFields(item),
      }),
    ),
    relatedLocations: relatedLocationIds,
    relatedDestinationCards: (input.relatedDestinations ?? []).map((item) =>
      compactObject({
        slug: text(item.slug),
        name: requiredText(item.name, 'relatedDestinations.name'),
        country: text(item.country),
        region: text(item.region),
        summary: text(item.summary),
        sourceStatus: text(item.sourceStatus),
        needsVerification: bool(item.needsVerification),
      }),
    ),
    cta: input.cta ? compactObject({
      eyebrow: text(input.cta.eyebrow),
      heading: text(input.cta.heading),
      body: text(input.cta.body),
      primaryAction: mapAction(input.cta.primaryAction),
      secondaryAction: mapAction(input.cta.secondaryAction),
      sourceStatus: text(input.cta.sourceStatus),
    }) : undefined,
  })
}

async function findLocationBySlug(payload: Payload, slug: string) {
  const result = await payload.find({
    collection: 'locations',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })

  return result.docs[0] ?? null
}

async function relatedLocationIdsBySlug(payload: Payload, slugs: string[], currentSlug: string) {
  if (!slugs.length) return []

  const result = await payload.find({
    collection: 'locations',
    where: {
      and: [
        { slug: { in: slugs.filter((slug) => slug !== currentSlug) } },
        { active: { equals: true } },
      ],
    },
    limit: slugs.length,
    depth: 0,
  })

  return result.docs.map((location) => location.id)
}

function printSummary(input: StructuredContentInput, relatedLocationIds: number[]) {
  console.log(
    [
      `location structured content: slug=${input.slug}`,
      `heroStats=${input.hero?.heroStats?.length ?? 0}`,
      `sections=${input.sections?.length ?? 0}`,
      `audience=${input.audience?.length ?? 0}`,
      `sectors=${input.sectors?.length ?? 0}`,
      `seasonMonths=${input.seasonMonths?.length ?? 0}`,
      `gearGroups=${input.gearGroups?.length ?? 0}`,
      `transportOptions=${input.transportOptions?.length ?? 0}`,
      `accommodationOptions=${input.accommodationOptions?.length ?? 0}`,
      `restDayIdeas=${input.restDayIdeas?.length ?? 0}`,
      `accessRules=${input.accessRules?.length ?? 0}`,
      `safetyItems=${input.safetyItems?.length ?? 0}`,
      `costItems=${input.costItems?.length ?? 0}`,
      `destinationFaqs=${input.destinationFaqs?.length ?? 0}`,
      `tripPromos=${input.tripPromos?.length ?? 0}`,
      `relatedDestinationCards=${input.relatedDestinations?.length ?? 0}`,
      `relatedLocationsResolved=${relatedLocationIds.length}`,
    ].join(' '),
  )
}

function printRunSummary(results: Array<{ slug: string; status: string; file: string }>) {
  const counts = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.status] = (acc[result.status] ?? 0) + 1
    return acc
  }, {})
  console.log(JSON.stringify({ checked: results.length, counts, results }, null, 2))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertNotProduction(args.allowProduction)
  const targets = await importTargets(args)
  if (!targets.length) throw new Error('No structured location JSON files found')

  const inputs = await Promise.all(
    targets.map(async (target) => {
      const input = await readJson<StructuredContentInput>(target.file)
      if (input.slug !== target.slug) {
        throw new Error(`Input slug ${input.slug} does not match target slug ${target.slug}`)
      }
      return { ...target, input }
    }),
  )

  const duplicateSlugs = inputs
    .map((target) => target.slug)
    .filter((slug, index, slugs) => slugs.indexOf(slug) !== index)
  if (duplicateSlugs.length) {
    throw new Error(`Duplicate input slugs: ${[...new Set(duplicateSlugs)].join(', ')}`)
  }

  if (args.validateOnly) {
    const results = []
    for (const target of inputs) {
      mapDestinationDetail(target.input, [])
      printSummary(target.input, [])
      results.push({ slug: target.slug, status: 'valid', file: path.relative(process.cwd(), target.file) })
    }
    printRunSummary(results)
    return
  }

  const payload = await getPayload({ config })
  const results = []

  for (const target of inputs) {
    const location = await findLocationBySlug(payload, target.slug)
    if (!location) throw new Error(`Location not found for slug: ${target.slug}`)

    const relatedSlugs = (target.input.relatedDestinations ?? [])
      .map((destination) => text(destination.slug))
      .filter((slug): slug is string => Boolean(slug))
    const relatedLocationIds = await relatedLocationIdsBySlug(payload, relatedSlugs, target.slug)
    const destinationDetail = mapDestinationDetail(target.input, relatedLocationIds)

    await payload.update({
      collection: 'locations',
      id: location.id,
      data: { destinationDetail } as Partial<Location>,
    })

    printSummary(target.input, relatedLocationIds)
    results.push({ slug: target.slug, status: 'updated', file: path.relative(process.cwd(), target.file) })
  }

  printRunSummary(results)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('location structured content update failed:', err)
      process.exit(1)
    })
}
