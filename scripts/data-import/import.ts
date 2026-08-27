/**
 * Import stage of the old-rockbusters → v3 pipeline.
 *
 * Reads scripts/data-import/seed/{locations,guides}.json (committed baseline,
 * produced by `pnpm data-import:extract`) and upserts into Payload via the
 * Local API with skip-if-exists semantics on slug. Never updates, never
 * deletes.
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
 * paragraphs) then converted to Payload Lexical. The stripped-image count
 * is tallied per collection and logged at the end so nothing silently
 * disappears — images are re-uploaded through the admin.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { getPayload, type Payload } from 'payload'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import config from '../../src/payload.config'

const SEED_DIR = path.resolve(import.meta.dirname, 'seed')
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

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

interface RunTotals {
  imported: number
  existed: number
  imgsStripped: number
}

async function importLocations(
  payload: Payload,
  editorConfig: EditorConfig,
  rows: LocationRow[],
): Promise<RunTotals> {
  const totals: RunTotals = { imported: 0, existed: 0, imgsStripped: 0 }
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
): Promise<RunTotals> {
  const totals: RunTotals = { imported: 0, existed: 0, imgsStripped: 0 }
  for (const row of rows) {
    try {
      const { html, strippedImgs } = cleanBody(row.body)
      totals.imgsStripped += strippedImgs
      const content = toLexical(html, editorConfig)

      const data: Record<string, unknown> = {
        name: row.name,
        slug: row.slug,
        active: Boolean(row.display),
        section: 'team',
        featured: false,
        isFounder: false,
      }
      if (content) data.content = content
      if (row.email) data.email = row.email
      if (row.phone) data.phone = row.phone

      const { existed } = await skipOrCreate(payload, {
        collection: 'guides',
        slug: row.slug,
        data,
      })
      if (existed) totals.existed += 1
      else totals.imported += 1
    } catch (cause) {
      throw new Error(
        `guide #${row.id} (${row.slug}): ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause: cause instanceof Error ? cause : undefined },
      )
    }
  }
  return totals
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
    console.log('— guides —')
    const guideTotals = await importGuides(payload, editorConfig, guides.rows)
    console.log(
      `import (guides):    imported=${guideTotals.imported} skipped-existing=${guideTotals.existed} total=${guides.rows.length} imgs-stripped=${guideTotals.imgsStripped}`,
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('import failed:', err)
    process.exit(1)
  })
