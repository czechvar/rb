/**
 * Scrapes every blog post from the live rockbusters.net site into
 * `scripts/blog-import/data/` (gitignored): one JSON file per post plus all
 * referenced images. Re-runnable; images already on disk are not re-downloaded.
 *
 *   pnpm blog:scrape
 *
 * Then load the result into Payload with `pnpm blog:import`.
 *
 * Old-site anatomy (custom CMS, no API):
 * - `/blog/` lists all posts (no pagination) + 13 category links.
 * - Post page: hero as inline-CSS background on `.header-img-blog-detail`,
 *   date + categories in `.line-container__blocks`, body inside
 *   `.blog-detail-container .cell` after the `<h1>`. Post-specific SEO lives
 *   in the LAST `og:title` / `og:description` (the first ones are site-wide).
 * - Some posts embed images as base64 data URIs; those are decoded to files.
 */
import { JSDOM } from 'jsdom'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'

const BASE = 'https://rockbusters.net'
const DATA_DIR = path.resolve(import.meta.dirname, 'data')
const POSTS_DIR = path.join(DATA_DIR, 'posts')
const IMAGES_DIR = path.join(DATA_DIR, 'images')
const REQUEST_DELAY_MS = 150

export type ScrapedPost = {
  slug: string
  sourceUrl: string
  title: string
  /** ISO date derived from the DD/MM/YYYY shown on the page, or null. */
  publishedAt: string | null
  /** The byline heading, e.g. "Rockbusters' Blog Post" — kept for auditing. */
  byline: string | null
  /** True when the body opened with the template's "FEATURED ARTICLE" badge. */
  featured: boolean
  /**
   * Category slugs: the post page's own tags first, then memberships found
   * only on /blog/category/<slug>/ listings (the old site omits tags on some
   * post pages). The new schema keeps only the first.
   */
  categories: string[]
  /** Filename inside data/images/, or null when the post has no hero. */
  heroFile: string | null
  /** Post-specific og:title / og:description (excerpt + SEO source). */
  seoTitle: string | null
  seoDescription: string | null
  /**
   * Body HTML. `<img>` srcs are rewritten to `local:<filename>` pointing into
   * data/images/; everything else is kept verbatim (iframes included).
   */
  contentHtml: string
  /** iframe srcs present in the body (YouTube embeds). */
  embeds: string[]
}

export type ScrapedCategory = { slug: string; name: string }

/** Proper display names; anything not listed is Title-Cased from the slug. */
const CATEGORY_NAMES: Record<string, string> = {
  'climbing-destinations': 'Climbing Destinations',
  'multi-pitch-climbing': 'Multi-pitch Climbing',
  'rockbusters-news': 'Rockbusters News',
  'trad-climbing': 'Trad Climbing',
  'sport-climbing': 'Sport Climbing',
  'guest-post': 'Guest Post',
}

const titleCase = (slug: string) =>
  slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'rockbusters-rebuild-blog-import/1.0' },
        redirect: 'follow',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      return res
    } catch (err) {
      lastError = err
      if (attempt < 3) await sleep(500 * attempt)
    }
  }
  throw lastError
}

const fetchText = async (url: string) => (await fetchWithRetry(url)).text()

function parseDom(html: string) {
  return new JSDOM(html).window.document
}

/** Collects unique /blog/<slug>/ post paths and /blog/category/<slug>/ paths. */
function collectBlogLinks(doc: Document) {
  const posts = new Set<string>()
  const categories = new Set<string>()
  for (const a of doc.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href') ?? ''
    const pathOnly = href.replace(/^https?:\/\/(www\.)?rockbusters\.net/, '')
    const category = pathOnly.match(/^\/blog\/category\/([^/]+)\/?$/)
    if (category) {
      categories.add(category[1])
      continue
    }
    const post = pathOnly.match(/^\/blog\/([^/]+)\/?$/)
    if (post && post[1] !== 'category') posts.add(post[1])
  }
  return { posts, categories }
}

/** DD/MM/YYYY → ISO midnight UTC. */
function parsePublishedDate(raw: string | null): string | null {
  const m = raw?.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const iso = `${yyyy}-${mm}-${dd}T00:00:00.000Z`
  return Number.isNaN(Date.parse(iso)) ? null : iso
}

const extForMime = (mime: string) =>
  ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' })[mime] ?? 'bin'

async function saveImageBytes(filename: string, bytes: Buffer): Promise<string> {
  const target = path.join(IMAGES_DIR, filename)
  try {
    await fs.access(target)
  } catch {
    await fs.writeFile(target, bytes)
  }
  return filename
}

/** Downloads a (possibly relative) image URL into data/images/, named by its basename. */
async function downloadImage(src: string): Promise<string | null> {
  const url = src.startsWith('http') ? src : `${BASE}${src.startsWith('/') ? '' : '/'}${src}`
  const basename = path.basename(new URL(url).pathname)
  if (!basename) return null
  const target = path.join(IMAGES_DIR, basename)
  try {
    await fs.access(target)
    return basename // already downloaded (old-site filenames are content hashes)
  } catch {
    /* not on disk yet */
  }
  try {
    const res = await fetchWithRetry(url)
    const bytes = Buffer.from(await res.arrayBuffer())
    return await saveImageBytes(basename, bytes)
  } catch (err) {
    console.warn(`  ! image failed ${url}: ${(err as Error).message}`)
    return null
  }
}

/** Decodes a data: URI into data/images/, named by content hash. */
async function saveDataUriImage(src: string): Promise<string | null> {
  const m = src.match(/^data:(image\/[a-z+]+);base64,(.+)$/s)
  if (!m) return null
  const bytes = Buffer.from(m[2], 'base64')
  const hash = createHash('sha1').update(bytes).digest('hex')
  return saveImageBytes(`inline-${hash}.${extForMime(m[1])}`, bytes)
}

async function scrapePost(slug: string, listedIn: readonly string[]): Promise<ScrapedPost | null> {
  const sourceUrl = `${BASE}/blog/${slug}/`
  const html = await fetchText(sourceUrl)
  const doc = parseDom(html)

  const cell = doc.querySelector('.blog-detail-container .cell')
  const h1 = cell?.querySelector('h1')
  const title = h1?.textContent?.trim()
  if (!cell || !h1 || !title) {
    console.warn(`  ! skip ${slug}: no title/content cell (layout mismatch?)`)
    return null
  }
  h1.remove()

  // The template renders a "FEATURED ARTICLE" badge as the first paragraph.
  let featured = false
  const firstP = cell.querySelector('p')
  if (firstP?.textContent?.trim() === 'FEATURED ARTICLE') {
    featured = true
    firstP.remove()
  }

  const metaBlock = doc.querySelector('.line-container__blocks')
  const byline = metaBlock?.querySelector('.item h2')?.textContent?.trim() ?? null
  const publishedAt = parsePublishedDate(metaBlock?.querySelector('.item span')?.textContent ?? null)
  const ownCategories = [...(metaBlock?.querySelectorAll('.category a') ?? [])]
    .map((a) => a.getAttribute('href')?.match(/\/blog\/category\/([^/]+)\/?$/)?.[1])
    .filter((s): s is string => Boolean(s))
  const categories = [...new Set([...ownCategories, ...listedIn])]

  // Post-specific og:* tags come AFTER the site-wide ones — take the last.
  const lastMeta = (prop: string) => {
    const all = doc.querySelectorAll(`meta[property="${prop}"]`)
    return all.length ? (all[all.length - 1].getAttribute('content')?.trim() ?? null) : null
  }
  const seoTitle = lastMeta('og:title')
  const seoDescription = lastMeta('og:description')

  // Hero: inline <style> background on .header-img-blog-detail; og:image as fallback.
  const heroSrc = html.match(/\.header-img-blog-detail\s*{\s*background-image:\s*url\(([^)]+)\)/)?.[1]?.trim()
    ?? lastMeta('og:image')
  const heroFile = heroSrc ? await downloadImage(heroSrc) : null

  // Localize body images (data URIs decoded, remote files downloaded).
  for (const img of cell.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? ''
    const file = src.startsWith('data:') ? await saveDataUriImage(src) : src ? await downloadImage(src) : null
    if (file) img.setAttribute('src', `local:${file}`)
    else img.remove()
  }

  // Same-domain absolute links → site-relative, so they follow the new site.
  for (const a of cell.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href') ?? ''
    const m = href.match(/^https?:\/\/(www\.)?rockbusters\.net(\/.*)?$/)
    if (m) a.setAttribute('href', m[2] || '/')
  }

  const embeds = [...cell.querySelectorAll('iframe')]
    .map((f) => f.getAttribute('src') ?? '')
    .filter(Boolean)

  return {
    slug,
    sourceUrl,
    title,
    publishedAt,
    byline,
    featured,
    categories,
    heroFile,
    seoTitle,
    seoDescription,
    contentHtml: cell.innerHTML.trim(),
    embeds,
  }
}

async function main() {
  await fs.mkdir(POSTS_DIR, { recursive: true })
  await fs.mkdir(IMAGES_DIR, { recursive: true })

  console.log(`— listing ${BASE}/blog/ —`)
  const listing = collectBlogLinks(parseDom(await fetchText(`${BASE}/blog/`)))
  const postSlugs = new Set(listing.posts)
  const categorySlugs = new Set(listing.categories)

  // Category listings both surface posts missing from the main listing and
  // are the only place some posts' memberships are visible — record both.
  const memberships = new Map<string, string[]>()
  for (const cat of categorySlugs) {
    await sleep(REQUEST_DELAY_MS)
    const catDoc = parseDom(await fetchText(`${BASE}/blog/category/${cat}/`))
    const { posts } = collectBlogLinks(catDoc)
    for (const p of posts) {
      postSlugs.add(p)
      memberships.set(p, [...(memberships.get(p) ?? []), cat])
    }
  }
  console.log(`  ${postSlugs.size} posts, ${categorySlugs.size} categories`)

  const categories: ScrapedCategory[] = [...categorySlugs]
    .sort()
    .map((slug) => ({ slug, name: CATEGORY_NAMES[slug] ?? titleCase(slug) }))
  await fs.writeFile(path.join(DATA_DIR, 'categories.json'), JSON.stringify(categories, null, 2))

  console.log('— posts —')
  const scraped: string[] = []
  const failed: string[] = []
  for (const slug of [...postSlugs].sort()) {
    await sleep(REQUEST_DELAY_MS)
    try {
      const post = await scrapePost(slug, memberships.get(slug) ?? [])
      if (!post) {
        failed.push(slug)
        continue
      }
      await fs.writeFile(path.join(POSTS_DIR, `${slug}.json`), JSON.stringify(post, null, 2))
      scraped.push(slug)
      const flags = [
        post.publishedAt ? '' : 'no-date',
        post.heroFile ? '' : 'no-hero',
        post.embeds.length ? `${post.embeds.length} embed(s)` : '',
      ]
        .filter(Boolean)
        .join(', ')
      console.log(`  ✓ ${slug}${flags ? `  [${flags}]` : ''}`)
    } catch (err) {
      failed.push(slug)
      console.warn(`  ✗ ${slug}: ${(err as Error).message}`)
    }
  }

  const manifest = {
    scrapedAt: new Date().toISOString(),
    source: `${BASE}/blog/`,
    posts: scraped.length,
    categories: categories.length,
    failed,
  }
  await fs.writeFile(path.join(DATA_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`\nDone: ${scraped.length} posts scraped, ${failed.length} failed → ${DATA_DIR}`)
  if (failed.length) process.exitCode = 1
}

await main()
