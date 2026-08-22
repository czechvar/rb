/**
 * Imports the scraped old-site blog (`scripts/blog-import/data/`, produced by
 * `pnpm blog:scrape`) into Payload via the Local API — same pattern as
 * scripts/seed.ts. Idempotent: media are matched by filename, categories and
 * posts are upserted by slug, so re-running refreshes content without
 * duplicating anything.
 *
 *   pnpm blog:import
 *
 * Reads DATABASE_URL from `.env`. As a guard against the 2026-06-12 fixture
 * incident it refuses the production Neon host unless `--allow-production`
 * is passed explicitly.
 *
 * Content pipeline per post: body images (already localized to data/images/
 * by the scraper) are uploaded to the media collection; `<img>`/`<iframe>`
 * elements are swapped for marker paragraphs; the cleaned HTML goes through
 * convertHTMLToLexical; markers then become real `upload` nodes and
 * `videoEmbed` block nodes in the Lexical tree.
 */
import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { getPayload, type Payload } from 'payload'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import config from '../../src/payload.config'
import type { ScrapedCategory, ScrapedPost } from './scrape'

const DATA_DIR = path.resolve(import.meta.dirname, 'data')
const POSTS_DIR = path.join(DATA_DIR, 'posts')
const IMAGES_DIR = path.join(DATA_DIR, 'images')

const PRODUCTION_DB_HOST = 'ep-weathered-pine-alvc3sdj'

/**
 * Posts that never got their own og:title/og:description fall back to these
 * site-wide defaults on the old site; importing them would stamp marketing
 * boilerplate on ~10 posts, so they're treated as absent instead.
 */
const GENERIC_OG_DESCRIPTION = 'at rockbusters we offer climbing trips that focus on maximizing'
const GENERIC_OG_TITLE = 'rock climbing guiding & coaching | rockbusters'

const postSpecific = (value: string | null, genericPrefix: string): string | null =>
  value && !value.trim().toLowerCase().startsWith(genericPrefix) ? value : null

type LexicalState = ReturnType<typeof convertHTMLToLexical>
type LexicalNode = LexicalState['root']['children'][number]

const hexId = () => randomBytes(12).toString('hex')

const uploadNode = (mediaId: number): LexicalNode =>
  ({
    type: 'upload',
    relationTo: 'media',
    value: mediaId,
    fields: null,
    format: '',
    version: 3,
    id: hexId(),
  }) as unknown as LexicalNode

const videoEmbedNode = (url: string): LexicalNode =>
  ({
    type: 'block',
    format: '',
    version: 2,
    fields: { id: hexId(), blockName: '', blockType: 'videoEmbed', url },
  }) as unknown as LexicalNode

async function upsert(
  payload: Payload,
  args: {
    collection: 'post-categories' | 'posts'
    slug: string
    data: Record<string, unknown>
  },
): Promise<{ id: number; existed: boolean }> {
  const { collection, slug, data } = args
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.update({ collection, id: existing.docs[0].id, data: data as any })
    return { id: existing.docs[0].id, existed: true }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const created = await payload.create({ collection, data: data as any })
  return { id: created.id, existed: false }
}

/** Reuses a media doc by filename or uploads the file from data/images/. */
async function ensureMedia(payload: Payload, filename: string, alt: string): Promise<number> {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) return existing.docs[0].id
  const created = await payload.create({
    collection: 'media',
    data: { alt },
    filePath: path.join(IMAGES_DIR, filename),
  })
  return created.id
}

/**
 * Swaps `<img>`/`<iframe>` for marker paragraphs placed after their top-level
 * block (markers must be root-level so they convert to root paragraphs), and
 * strips old-site noise: leading `<br>`s in headings and `&nbsp;`-only
 * paragraphs/headings, including wrappers hollowed out by the swaps.
 */
function preprocessHtml(contentHtml: string, imageIdByFile: Map<string, number>): string {
  const dom = new JSDOM(`<body>${contentHtml}</body>`)
  const { document } = dom.window
  const body = document.body

  const topAncestor = (el: Element): Element => {
    let node: Element = el
    while (node.parentElement && node.parentElement !== body) node = node.parentElement
    return node
  }
  // Consecutive markers under one block keep document order.
  const lastMarker = new Map<Element, Element>()
  const insertMarker = (block: Element, text: string) => {
    const p = document.createElement('p')
    p.textContent = text
    ;(lastMarker.get(block) ?? block).after(p)
    lastMarker.set(block, p)
  }

  for (const iframe of [...body.querySelectorAll('iframe')]) {
    const src = iframe.getAttribute('src')
    if (src) insertMarker(topAncestor(iframe), `%%EMBED:${src}%%`)
    iframe.remove()
  }
  for (const img of [...body.querySelectorAll('img')]) {
    const file = img.getAttribute('src')?.replace(/^local:/, '')
    const id = file ? imageIdByFile.get(file) : undefined
    if (id !== undefined) insertMarker(topAncestor(img), `%%UPLOAD:${id}%%`)
    img.remove()
  }

  for (const heading of body.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
    let first = heading.firstChild
    while (
      first &&
      ((first.nodeType === 3 && !first.textContent?.trim()) ||
        (first as Element).tagName === 'BR')
    ) {
      const next = first.nextSibling
      first.remove()
      first = next
    }
  }

  for (const el of [...body.querySelectorAll('p,h1,h2,h3,h4,h5,h6')]) {
    const text = (el.textContent ?? '').replace(/\u00a0/g, ' ').trim()
    if (!text) el.remove()
  }

  // A root-level <br> would convert to an invalid root-level linebreak node.
  for (const child of [...body.children]) {
    if (child.tagName === 'BR') child.remove()
  }
  // The old site has hrefs with stray whitespace, which fails link validation.
  for (const a of body.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href')
    if (href) a.setAttribute('href', href.trim())
  }

  return body.innerHTML
}

/**
 * True when the node contributes visible content. Text counts when non-blank,
 * linebreaks never do, element nodes (link, list, …) recurse into children,
 * and childless decorator leaves (upload, block, …) always count.
 */
function nodeHasContent(node: { type: string; text?: string; children?: unknown[] }): boolean {
  if (node.type === 'text') return Boolean(node.text?.trim())
  if (node.type === 'linebreak' || node.type === 'tab') return false
  if (Array.isArray(node.children)) {
    return (node.children as { type: string }[]).some(nodeHasContent)
  }
  return true
}

/**
 * Replaces marker paragraphs with real upload / videoEmbed nodes. Embeds whose
 * provider is gone (per the scraper's liveness check) are dropped entirely —
 * a dead iframe renders as a permanent blank 16:9 box. Paragraphs left with
 * no visible content (conversion artifacts of empty styled spans/anchors)
 * are dropped too, so pages don't render blank <p> spacers.
 */
function replaceMarkers(
  state: LexicalState,
  deadEmbeds: ReadonlySet<string>,
): { state: LexicalState; droppedEmbeds: string[] } {
  const droppedEmbeds: string[] = []
  const children = state.root.children
    .map((node) => {
      if (node.type !== 'paragraph') return node
      const inline = 'children' in node ? (node.children as { type: string; text?: string }[]) : []
      const text = inline
        .map((c) => (c.type === 'text' ? (c.text ?? '') : ''))
        .join('')
        .trim()
      const upload = text.match(/^%%UPLOAD:(\d+)%%$/)
      if (upload) return uploadNode(Number(upload[1]))
      const embed = text.match(/^%%EMBED:(.+)%%$/)
      if (embed) {
        if (deadEmbeds.has(embed[1])) {
          droppedEmbeds.push(embed[1])
          return null
        }
        return videoEmbedNode(embed[1])
      }
      if (!inline.some(nodeHasContent)) return null
      return node
    })
    .filter((node): node is LexicalNode => node !== null)
  return { state: { ...state, root: { ...state.root, children } }, droppedEmbeds }
}

async function main() {
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

  console.log('— categories —')
  const categories: ScrapedCategory[] = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, 'categories.json'), 'utf8'),
  )
  const categoryIds: Record<string, number> = {}
  for (const cat of categories) {
    const { id, existed } = await upsert(payload, {
      collection: 'post-categories',
      slug: cat.slug,
      data: { name: cat.name, slug: cat.slug },
    })
    categoryIds[cat.slug] = id
    console.log(`  ${existed ? '✎ update' : '✓ create'} ${cat.slug}`)
  }

  console.log('— posts —')
  const files = (await fs.readdir(POSTS_DIR)).filter((f) => f.endsWith('.json')).sort()
  let created = 0
  let updated = 0
  const failed: string[] = []

  for (const file of files) {
    const post: ScrapedPost = JSON.parse(await fs.readFile(path.join(POSTS_DIR, file), 'utf8'))
    try {
      const heroImage = post.heroFile
        ? await ensureMedia(payload, post.heroFile, post.title)
        : null

      const imageIdByFile = new Map<string, number>()
      let imageNo = 0
      for (const [, imageFile] of post.contentHtml.matchAll(/src="local:([^"]+)"/g)) {
        imageNo += 1
        imageIdByFile.set(
          imageFile,
          await ensureMedia(payload, imageFile, `${post.title} — image ${imageNo}`),
        )
      }

      const html = preprocessHtml(post.contentHtml, imageIdByFile)
      const { state: content, droppedEmbeds } = replaceMarkers(
        convertHTMLToLexical({ editorConfig, html, JSDOM }),
        new Set(post.deadEmbeds ?? []),
      )
      for (const src of droppedEmbeds) console.log(`  · dropped dead embed ${src}`)

      const category = post.categories.length ? (categoryIds[post.categories[0]] ?? null) : null
      const seoTitle = postSpecific(post.seoTitle, GENERIC_OG_TITLE)
      const seoDescription = postSpecific(post.seoDescription, GENERIC_OG_DESCRIPTION)
      const { existed } = await upsert(payload, {
        collection: 'posts',
        slug: post.slug,
        data: {
          title: post.title,
          slug: post.slug,
          heroImage,
          excerpt: seoDescription,
          content,
          category,
          author: 'Rockbusters',
          publishedAt: post.publishedAt,
          state: 'published',
          seo: { title: seoTitle, description: seoDescription },
        },
      })
      if (existed) updated++
      else created++
      console.log(`  ${existed ? '✎ update' : '✓ create'} ${post.slug}`)
    } catch (err) {
      failed.push(post.slug)
      console.warn(`  ✗ ${post.slug}: ${(err as Error).message}`)
    }
  }

  console.log(
    `\nDone: ${created} created, ${updated} updated, ${failed.length} failed` +
      (failed.length ? `\nFailed: ${failed.join(', ')}` : ''),
  )
  if (failed.length) process.exitCode = 1
  process.exit()
}

await main()
