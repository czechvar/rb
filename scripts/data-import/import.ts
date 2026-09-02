/**
 * Import stage of the old-rockbusters → v3 pipeline.
 *
 * Reads scripts/data-import/seed/{locations,guides}.json (committed baseline,
 * produced by `pnpm data-import:extract`) and imports them via the Payload
 * Local API. Locations use skip-if-exists semantics. Guides are replaced by
 * legacy data on matching slug and created when missing.
 *
 *   PAYLOAD_DISABLE_DB_PUSH=true pnpm data-import:import
 *
 * Per-entity aliases run just one collection (useful when you want to
 * re-seed guides after clearing them, without touching locations):
 *
 *   pnpm data-import:guides         # equivalent to import --only=guides
 *   pnpm data-import:locations      # equivalent to import --only=locations
 *
 * Guards:
 *   - Refuses the production Neon host without --allow-production.
 *   - Aborts loudly if the JSON files are missing.
 *
 * Per-row body HTML is cleaned (strip <img>, drop inline style, drop empty
 * paragraphs) then converted to Payload Lexical. Guide portrait media is
 * resolved from the uploaded legacy-media lookup.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { getPayload, type Payload } from 'payload'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import config from '../../src/payload.config'

const SEED_DIR = path.resolve(import.meta.dirname, 'seed')
const GUIDE_LOOKUP_FILE = path.join(SEED_DIR, 'legacy-guide-lookup.json')
const DEFAULT_MEDIA_LOOKUP_FILE =
  '/media/czechspekk/ws-backup-data-1/xbusters/rockbusters/media-transfer/payload-media-lookup.json'
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'
const LEGACY_GUIDE_SLUG_ALIASES = new Map([
  // Current seed data used this public nickname; the legacy record is canonical.
  ['jan-novotny', 'jany'],
])

type Only = 'guides' | 'locations' | 'all'

/** Parse `--only=guides|locations` (or `--only guides`) from argv. Default: all. */
function parseOnly(argv: string[]): Only {
  const flag = argv.find((a) => a === '--only' || a.startsWith('--only='))
  if (!flag) return 'all'
  const value = flag.includes('=')
    ? flag.slice(flag.indexOf('=') + 1)
    : argv[argv.indexOf(flag) + 1]
  if (value === 'guides' || value === 'locations') return value
  console.error(`--only must be 'guides' or 'locations' (got: ${value ?? '<missing>'}).`)
  process.exit(1)
}

type EditorConfig = Awaited<ReturnType<typeof editorConfigFactory.default>>
type LexicalState = ReturnType<typeof convertHTMLToLexical>

interface ExtractFile<Row> {
  generatedAt: string
  source: string
  rows: Row[]
}

interface LocationRow {
  id: number
  title: string
  slug: string
  body: string | null
  latitude: number
  longitude: number
  keywords: string | null
  description: string | null
  display: number
  country_nicename: string | null
}

interface GuideRow {
  id: number
  name: string
  slug: string
  body: string | null
  email: string | null
  phone: string | null
  display: number
  image_id?: number | null
  featured?: boolean
}

interface PayloadMediaLookup {
  byLegacyMediaId?: Record<string, string>
}

interface LegacyGuideLookupRow {
  legacyGuideId: number
  slug: string
  payloadGuideId: number
  legacyImageId: number | null
  payloadPhotoId: string | null
}

/** Read + parse a data file, or exit with a friendly error. */
async function readData<Row>(name: string): Promise<ExtractFile<Row>> {
  const file = path.join(SEED_DIR, `${name}.json`)
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as ExtractFile<Row>
  } catch {
    console.error(
      `Missing ${path.relative(process.cwd(), file)}. This file is normally committed; ` +
        `regenerate with \`pnpm data-import:extract\` if you have OLD_DB_URL configured.`,
    )
    process.exit(1)
  }
}

async function readPayloadMediaLookup(): Promise<Map<string, string>> {
  const file = process.env.PAYLOAD_MEDIA_LOOKUP_FILE ?? DEFAULT_MEDIA_LOOKUP_FILE
  try {
    const lookup = JSON.parse(await fs.readFile(file, 'utf8')) as PayloadMediaLookup
    return new Map(Object.entries(lookup.byLegacyMediaId ?? {}))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(
        `Media lookup not found at ${file}; guide photos with legacy image IDs will be left unset.`,
      )
      return new Map()
    }
    throw err
  }
}

/**
 * Clean a body HTML string:
 *   - strip <img> (count them for the report)
 *   - drop inline style= attributes
 *   - drop empty paragraphs (<p></p>, <p>&nbsp;</p>, <p>\s*</p>)
 * JSDOM handles entity decoding + tag closure for us.
 */
function cleanBody(html: string | null): { html: string; strippedImgs: number } {
  if (!html || !html.trim()) return { html: '', strippedImgs: 0 }
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`)
  const body = dom.window.document.body

  const imgs = body.querySelectorAll('img')
  const strippedImgs = imgs.length
  imgs.forEach((img) => img.remove())

  body.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'))

  body.querySelectorAll('p').forEach((p) => {
    const text = (p.textContent ?? '').replace(/ /g, '').trim()
    if (!text && p.children.length === 0) p.remove()
  })

  return { html: body.innerHTML.trim(), strippedImgs }
}

/** Convert cleaned HTML to Payload Lexical. Returns undefined for empty. */
function toLexical(html: string, editorConfig: EditorConfig): LexicalState | undefined {
  if (!html) return undefined
  return convertHTMLToLexical({ editorConfig, html, JSDOM })
}

async function skipOrCreate(
  payload: Payload,
  args: {
    collection: 'guides' | 'locations'
    slug: string
    data: Record<string, unknown>
  },
): Promise<{ existed: boolean }> {
  const { collection, slug, data } = args
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) return { existed: true }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.create({ collection, data: data as any })
  return { existed: false }
}

async function upsertBySlug(
  payload: Payload,
  args: {
    collection: 'guides'
    slug: string
    fallbackSlug?: string
    data: Record<string, unknown>
  },
): Promise<{ created: boolean; id: number }> {
  const { collection, slug, fallbackSlug, data } = args
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  let doc = existing.docs[0]
  if (!doc && fallbackSlug) {
    const fallback = await payload.find({
      collection,
      where: { slug: { equals: fallbackSlug } },
      limit: 1,
      depth: 0,
    })
    doc = fallback.docs[0]
  }
  if (!doc) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await payload.create({ collection, data: data as any })
    return { created: true, id: created.id }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await payload.update({ collection, id: doc.id, data: data as any })
  return { created: false, id: updated.id }
}

interface RunTotals {
  imported: number
  existed: number
  updated: number
  deactivated: number
  imgsStripped: number
  missingImages: number
  guideLookupRows: LegacyGuideLookupRow[]
}

async function importLocations(
  payload: Payload,
  editorConfig: EditorConfig,
  rows: LocationRow[],
): Promise<RunTotals> {
  const totals: RunTotals = {
    imported: 0,
    existed: 0,
    updated: 0,
    deactivated: 0,
    imgsStripped: 0,
    missingImages: 0,
    guideLookupRows: [],
  }
  for (const row of rows) {
    try {
      const { html, strippedImgs } = cleanBody(row.body)
      totals.imgsStripped += strippedImgs
      const content = toLexical(html, editorConfig)

      const data: Record<string, unknown> = {
        name: row.title,
        slug: row.slug,
        active: Boolean(row.display),
        featured: false,
      }
      if (content) data.content = content
      if (row.country_nicename) data.country = row.country_nicename
      if (row.latitude !== 0 || row.longitude !== 0) {
        data.coordinates = [row.longitude, row.latitude]
      }
      const seo: Record<string, unknown> = {}
      if (row.keywords) seo.keywords = row.keywords
      if (row.description) seo.description = row.description
      if (Object.keys(seo).length) data.seo = seo

      const { existed } = await skipOrCreate(payload, {
        collection: 'locations',
        slug: row.slug,
        data,
      })
      if (existed) totals.existed += 1
      else totals.imported += 1
    } catch (cause) {
      throw new Error(
        `location #${row.id} (${row.slug}): ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause: cause instanceof Error ? cause : undefined },
      )
    }
  }
  return totals
}

async function importGuides(
  payload: Payload,
  editorConfig: EditorConfig,
  rows: GuideRow[],
  mediaLookup: Map<string, string>,
): Promise<RunTotals> {
  const totals: RunTotals = {
    imported: 0,
    existed: 0,
    updated: 0,
    deactivated: 0,
    imgsStripped: 0,
    missingImages: 0,
    guideLookupRows: [],
  }
  const legacySlugs = new Set(rows.map((row) => row.slug))
  for (const row of rows) {
    try {
      const { html, strippedImgs } = cleanBody(row.body)
      totals.imgsStripped += strippedImgs
      const content = toLexical(html, editorConfig)
      const photo = row.image_id ? mediaLookup.get(String(row.image_id)) : undefined
      if (row.image_id && !photo) totals.missingImages += 1

      const data: Record<string, unknown> = {
        name: row.name,
        slug: row.slug,
        active: Boolean(row.display),
        section: 'team',
        role: null,
        tagline: null,
        tags: [],
        photo: photo ?? null,
        content: content ?? null,
        featured: Boolean(row.featured),
        isFounder: false,
        vimeoId: null,
        heroSub: null,
        heroCaption: null,
        stats: [],
        about: {
          headline: null,
          facts: [],
          quote: null,
          quoteAttribution: null,
        },
        coaching: {
          intro: null,
          pillars: [],
        },
        achievements: {
          intro: null,
          items: [],
        },
        testimonial: {
          quote: null,
          name: null,
          tripLine: null,
        },
      }
      data.email = row.email ?? null
      data.phone = row.phone ?? null

      const { created, id } = await upsertBySlug(payload, {
        collection: 'guides',
        slug: row.slug,
        fallbackSlug: LEGACY_GUIDE_SLUG_ALIASES.get(row.slug),
        data,
      })
      if (created) totals.imported += 1
      else totals.updated += 1
      totals.guideLookupRows.push({
        legacyGuideId: row.id,
        slug: row.slug,
        payloadGuideId: id,
        legacyImageId: row.image_id ?? null,
        payloadPhotoId: photo ?? null,
      })
    } catch (cause) {
      throw new Error(
        `guide #${row.id} (${row.slug}): ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause: cause instanceof Error ? cause : undefined },
      )
    }
  }
  const existingGuides = await payload.find({
    collection: 'guides',
    limit: 10_000,
    depth: 0,
  })
  for (const guide of existingGuides.docs) {
    if (legacySlugs.has(guide.slug)) continue
    if (!guide.active) continue
    await payload.update({
      collection: 'guides',
      id: guide.id,
      data: { active: false },
    })
    totals.deactivated += 1
  }
  return totals
}

async function writeLegacyGuideLookup(rows: LegacyGuideLookupRow[]) {
  const byLegacyGuideId = Object.fromEntries(
    rows.map((row) => [String(row.legacyGuideId), row.payloadGuideId]),
  )
  const bySlug = Object.fromEntries(rows.map((row) => [row.slug, row.payloadGuideId]))

  await fs.mkdir(path.dirname(GUIDE_LOOKUP_FILE), { recursive: true })
  await fs.writeFile(
    GUIDE_LOOKUP_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: 'scripts/data-import/seed/guides.json + Payload guides collection',
        byLegacyGuideId,
        bySlug,
        rows,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
}

async function main() {
  const only = parseOnly(process.argv.slice(2))
  const dbUrl = process.env.DATABASE_URL ?? ''
  if (dbUrl.includes(PRODUCTION_DB_HOST) && !process.argv.includes('--allow-production')) {
    console.error(
      'DATABASE_URL points at the PRODUCTION Neon branch. ' +
        'Re-run with --allow-production only if that is intentional.',
    )
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const editorConfig = await editorConfigFactory.default({ config: payload.config })

  if (only === 'all' || only === 'locations') {
    const locations = await readData<LocationRow>('locations')
    console.log('— locations —')
    const locTotals = await importLocations(payload, editorConfig, locations.rows)
    console.log(
      `import (locations): imported=${locTotals.imported} skipped-existing=${locTotals.existed} total=${locations.rows.length} imgs-stripped=${locTotals.imgsStripped}`,
    )
  }

  if (only === 'all' || only === 'guides') {
    const guides = await readData<GuideRow>('guides')
    const mediaLookup = await readPayloadMediaLookup()
    console.log('— guides —')
    const guideTotals = await importGuides(payload, editorConfig, guides.rows, mediaLookup)
    await writeLegacyGuideLookup(guideTotals.guideLookupRows)
    console.log(
      `import (guides):    imported=${guideTotals.imported} updated=${guideTotals.updated} ` +
        `deactivated-nonlegacy=${guideTotals.deactivated} total=${guides.rows.length} ` +
        `imgs-stripped=${guideTotals.imgsStripped} missing-images=${guideTotals.missingImages} ` +
        `lookup=${path.relative(process.cwd(), GUIDE_LOOKUP_FILE)}`,
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('import failed:', err)
    process.exit(1)
  })
