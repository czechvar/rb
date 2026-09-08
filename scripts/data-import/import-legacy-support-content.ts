/**
 * Import legacy Rockbusters support content into Payload.
 *
 * Covers legacy partner, testimonial, blog_category, blog, and
 * blog_post_category rows. Imports are idempotent by slug.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { getPayload, type Payload, type Where } from 'payload'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import config from '../../src/payload.config'

const SEED_DIR = path.resolve(import.meta.dirname, 'seed')
const LOOKUP_DIR = process.env.DATA_IMPORT_LOOKUP_DIR
  ? path.resolve(process.env.DATA_IMPORT_LOOKUP_DIR)
  : SEED_DIR
const DEFAULT_MEDIA_LOOKUP_FILE =
  '/media/czechspekk/ws-backup-data-1/xbusters/rockbusters/media-transfer/payload-media-lookup.json'
const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

type EditorConfig = Awaited<ReturnType<typeof editorConfigFactory.default>>
type LexicalState = ReturnType<typeof convertHTMLToLexical>

type Args = {
  allowProduction: boolean
  dryRun: boolean
}

type SeedFile<Row> = {
  generatedAt: string
  source: string
  rows: Row[]
}

type LegacyPartnerRow = {
  id: number
  imageId: number | null
  name: string
  link: string | null
  description: string | null
  display: number
  slug: string
  featured: number
}

type LegacyTestimonialRow = {
  id: number
  title: string
  author: string
  text: string
  slug: string
  display: number
}

type LegacyBlogCategoryRow = {
  id: number
  title: string
  slug: string
}

type LegacyBlogPostRow = {
  id: number
  title: string
  slug: string
  body: string | null
  keywords: string | null
  description: string | null
  created: string | null
  updated: string | null
  coverImageId: number | null
  fbShareImageId: number | null
  customUrl: string | null
  fbTitle: string | null
  fbDescription: string | null
  active: number
  categoryIds: number[]
}

type MediaLookupFile = {
  byLegacyMediaId?: Record<string, string>
}

type ImportTotals = {
  created: number
  updated: number
  missingMedia: Set<string>
  missingCategories: Set<string>
}

function parseArgs(argv: string[]): Args {
  return {
    allowProduction: argv.includes('--allow-production'),
    dryRun: argv.includes('--dry-run'),
  }
}

function assertNotProduction({ allowProduction }: Args) {
  const dbUrl = process.env.DATABASE_URL ?? ''
  if (dbUrl.includes(PRODUCTION_DB_HOST) && !allowProduction) {
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

async function readSeed<Row>(name: string): Promise<SeedFile<Row>> {
  const file = path.join(SEED_DIR, `${name}.json`)
  try {
    return await readJson<SeedFile<Row>>(file)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Missing ${path.relative(process.cwd(), file)}; run pnpm data-import:extract-legacy-support-content`)
    }
    throw err
  }
}

async function readPayloadMediaLookup(): Promise<Map<string, string>> {
  const file = process.env.PAYLOAD_MEDIA_LOOKUP_FILE ?? DEFAULT_MEDIA_LOOKUP_FILE
  try {
    const lookup = await readJson<MediaLookupFile>(file)
    return new Map(Object.entries(lookup.byLegacyMediaId ?? {}))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`Media lookup not found at ${file}; support-content media relations will be left unset.`)
      return new Map()
    }
    throw err
  }
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

  body.querySelectorAll('script, style, iframe, title, meta, link, img').forEach((el) => el.remove())
  body.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'))
  body.querySelectorAll('a').forEach((anchor) => {
    const href = anchor.getAttribute('href')?.trim()
    if (!href || !validHref(href)) anchor.replaceWith(...anchor.childNodes)
    else anchor.setAttribute('href', href)
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

function excerpt(row: LegacyBlogPostRow): string | null {
  const description = row.description?.trim()
  if (description) return description
  const text = cleanPlainText(row.body)
  if (!text) return null
  return text.length > 280 ? `${text.slice(0, 277).trim()}...` : text
}

function toLexical(
  html: string | null | undefined,
  editorConfig: EditorConfig,
): LexicalState | undefined {
  const cleaned = cleanBody(html)
  if (!cleaned) return undefined
  return convertHTMLToLexical({ editorConfig, html: cleaned, JSDOM })
}

function mediaId(
  legacyId: number | null | undefined,
  mediaLookup: Map<string, string>,
  missing: Set<string>,
): string | null {
  if (!legacyId) return null
  const id = mediaLookup.get(String(legacyId))
  if (!id) missing.add(String(legacyId))
  return id ?? null
}

async function upsertBySlug(
  payload: Payload,
  args: {
    collection: 'partners' | 'reviews' | 'post-categories' | 'posts'
    slug: string
    data: Record<string, unknown>
    dryRun: boolean
  },
) {
  const existing = await payload.find({
    collection: args.collection,
    where: { slug: { equals: args.slug } },
    limit: 1,
    depth: 0,
  })
  if (args.dryRun) return { created: !existing.docs[0], id: existing.docs[0]?.id ?? null }
  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: args.collection,
      id: existing.docs[0].id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: args.data as any,
    })
    return { created: false, id: updated.id }
  }
  const created = await payload.create({
    collection: args.collection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: args.data as any,
  })
  return { created: true, id: created.id }
}

async function upsertByWhere(
  payload: Payload,
  args: {
    collection: 'reviews'
    where: Where
    data: Record<string, unknown>
    dryRun: boolean
  },
) {
  const existing = await payload.find({
    collection: args.collection,
    where: args.where,
    limit: 1,
    depth: 0,
  })
  if (args.dryRun) return { created: !existing.docs[0], id: existing.docs[0]?.id ?? null }
  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: args.collection,
      id: existing.docs[0].id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: args.data as any,
    })
    return { created: false, id: updated.id }
  }
  const created = await payload.create({
    collection: args.collection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: args.data as any,
  })
  return { created: true, id: created.id }
}

async function writeLookup(file: string, payload: Record<string, unknown>) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

async function importCategories(
  payload: Payload,
  args: Args,
  rows: LegacyBlogCategoryRow[],
) {
  const totals: ImportTotals = {
    created: 0,
    updated: 0,
    missingMedia: new Set(),
    missingCategories: new Set(),
  }
  const lookupRows: Array<{ legacyBlogCategoryId: number; slug: string; payloadPostCategoryId: number | string | null }> = []

  for (const row of rows) {
    const result = await upsertBySlug(payload, {
      collection: 'post-categories',
      slug: row.slug,
      dryRun: args.dryRun,
      data: {
        name: row.title,
        slug: row.slug,
        seo: {},
      },
    })
    if (result.created) totals.created += 1
    else totals.updated += 1
    lookupRows.push({ legacyBlogCategoryId: row.id, slug: row.slug, payloadPostCategoryId: result.id })
  }

  if (!args.dryRun) {
    await writeLookup(path.join(LOOKUP_DIR, 'legacy-blog-category-lookup.json'), {
      generatedAt: new Date().toISOString(),
      source: 'scripts/data-import/seed/legacy-blog-categories.json + Payload post-categories collection',
      byLegacyBlogCategoryId: Object.fromEntries(
        lookupRows
          .filter((row) => row.payloadPostCategoryId !== null)
          .map((row) => [row.legacyBlogCategoryId, row.payloadPostCategoryId]),
      ),
      rows: lookupRows,
    })
  }

  return { totals, lookupRows }
}

async function importPartners(
  payload: Payload,
  args: Args,
  rows: LegacyPartnerRow[],
  mediaLookup: Map<string, string>,
  editorConfig: EditorConfig,
) {
  const totals: ImportTotals = {
    created: 0,
    updated: 0,
    missingMedia: new Set(),
    missingCategories: new Set(),
  }

  for (const row of rows) {
    const result = await upsertBySlug(payload, {
      collection: 'partners',
      slug: row.slug,
      dryRun: args.dryRun,
      data: {
        name: row.name,
        slug: row.slug,
        link: row.link || null,
        description: toLexical(row.description, editorConfig) ?? null,
        logo: mediaId(row.imageId, mediaLookup, totals.missingMedia),
        featured: Boolean(row.featured),
        active: Boolean(row.display),
      },
    })
    if (result.created) totals.created += 1
    else totals.updated += 1
  }

  return totals
}

async function importReviews(payload: Payload, args: Args, rows: LegacyTestimonialRow[]) {
  const totals: ImportTotals = {
    created: 0,
    updated: 0,
    missingMedia: new Set(),
    missingCategories: new Set(),
  }

  for (const [index, row] of rows.entries()) {
    const result = await upsertByWhere(payload, {
      collection: 'reviews',
      where: {
        and: [
          { reviewerName: { equals: row.author } },
          { resultLine: { equals: row.title } },
        ],
      },
      dryRun: args.dryRun,
      data: {
        quote: row.text,
        reviewerName: row.author,
        resultLine: row.title,
        position: index + 1,
        active: Boolean(row.display),
      },
    })
    if (result.created) totals.created += 1
    else totals.updated += 1
  }

  return totals
}

async function resolveCategoryLookup(
  payload: Payload,
  rows: LegacyBlogCategoryRow[],
  lookupRows: Array<{ legacyBlogCategoryId: number; slug: string; payloadPostCategoryId: number | string | null }>,
) {
  const byLegacyId = new Map<string, number | string>()
  for (const row of lookupRows) {
    if (row.payloadPostCategoryId !== null) {
      byLegacyId.set(String(row.legacyBlogCategoryId), row.payloadPostCategoryId)
    }
  }

  for (const row of rows) {
    if (byLegacyId.has(String(row.id))) continue
    const existing = await payload.find({
      collection: 'post-categories',
      where: { slug: { equals: row.slug } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) byLegacyId.set(String(row.id), existing.docs[0].id)
  }

  return byLegacyId
}

async function importPosts(
  payload: Payload,
  args: Args,
  rows: LegacyBlogPostRow[],
  categoryRows: LegacyBlogCategoryRow[],
  categoryLookupRows: Array<{ legacyBlogCategoryId: number; slug: string; payloadPostCategoryId: number | string | null }>,
  mediaLookup: Map<string, string>,
  editorConfig: EditorConfig,
) {
  const totals: ImportTotals = {
    created: 0,
    updated: 0,
    missingMedia: new Set(),
    missingCategories: new Set(),
  }
  const categoryLookup = await resolveCategoryLookup(payload, categoryRows, categoryLookupRows)

  for (const row of rows) {
    try {
      const firstCategoryId = row.categoryIds[0]
      const category = firstCategoryId ? categoryLookup.get(String(firstCategoryId)) ?? null : null
      for (const legacyCategoryId of row.categoryIds) {
        if (!categoryLookup.has(String(legacyCategoryId))) totals.missingCategories.add(String(legacyCategoryId))
      }

      const result = await upsertBySlug(payload, {
        collection: 'posts',
        slug: row.slug,
        dryRun: args.dryRun,
        data: {
          title: row.title,
          slug: row.slug,
          heroImage: mediaId(row.coverImageId, mediaLookup, totals.missingMedia),
          excerpt: excerpt(row),
          content: toLexical(row.body, editorConfig) ?? null,
          category,
          author: 'Rockbusters',
          publishedAt: row.created ? new Date(row.created).toISOString() : null,
          state: row.active ? 'published' : 'draft',
          seo: {
            title: row.fbTitle || row.title,
            description: row.fbDescription || row.description || null,
            keywords: row.keywords || null,
          },
        },
      })
      if (result.created) totals.created += 1
      else totals.updated += 1
    } catch (cause) {
      console.error(JSON.stringify((cause as { data?: unknown }).data ?? cause, null, 2))
      throw new Error(`legacy blog post #${row.id} (${row.slug}) failed`, {
        cause: cause instanceof Error ? cause : undefined,
      })
    }
  }

  return totals
}

function printTotals(label: string, totals: ImportTotals) {
  console.log(`${label}: created=${totals.created} updated=${totals.updated}`)
  if (totals.missingMedia.size) {
    console.warn(`${label}: missing-media=${[...totals.missingMedia].sort().join(', ')}`)
  }
  if (totals.missingCategories.size) {
    console.warn(`${label}: missing-categories=${[...totals.missingCategories].sort().join(', ')}`)
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertNotProduction(args)

  const [partnerSeed, testimonialSeed, categorySeed, postSeed, mediaLookup] = await Promise.all([
    readSeed<LegacyPartnerRow>('legacy-partners'),
    readSeed<LegacyTestimonialRow>('legacy-testimonials'),
    readSeed<LegacyBlogCategoryRow>('legacy-blog-categories'),
    readSeed<LegacyBlogPostRow>('legacy-blog-posts'),
    readPayloadMediaLookup(),
  ])

  const payload = await getPayload({ config })
  const editorConfig = await editorConfigFactory.default({ config: payload.config })

  const categoryResult = await importCategories(payload, args, categorySeed.rows)
  const partnerTotals = await importPartners(payload, args, partnerSeed.rows, mediaLookup, editorConfig)
  const reviewTotals = await importReviews(payload, args, testimonialSeed.rows)
  const postTotals = await importPosts(
    payload,
    args,
    postSeed.rows,
    categorySeed.rows,
    categoryResult.lookupRows,
    mediaLookup,
    editorConfig,
  )

  printTotals('legacy blog categories', categoryResult.totals)
  printTotals('legacy partners', partnerTotals)
  printTotals('legacy testimonials', reviewTotals)
  printTotals('legacy blog posts', postTotals)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('legacy support content import failed:', err)
    process.exit(1)
  })
