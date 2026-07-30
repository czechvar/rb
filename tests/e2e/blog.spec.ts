import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const BASE = 'http://localhost:3001'
const runId = Date.now().toString(36)
const cat = { name: `E2E Cat ${runId}`, slug: `e2e-cat-${runId}` }
const post = {
  title: `E2E Post ${runId}`,
  slug: `e2e-post-${runId}`,
  excerpt: `Excerpt for e2e post ${runId}.`,
  bodyLine: `Body line for e2e post ${runId} — beta included.`,
  author: 'E2E Author',
}
const draftTitle = `E2E Draft Post ${runId}`
const draftSlug = `e2e-draft-post-${runId}`

function richText(...paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [{ type: 'text', text, version: 1 }],
      })),
    },
  }
}

test.beforeAll(async () => {
  const payload = await getPayload({ config })
  const c = await payload.create({
    collection: 'post-categories',
    data: { name: cat.name, slug: cat.slug } as never,
  })
  await payload.create({
    collection: 'posts',
    data: {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: richText(post.bodyLine),
      category: c.id,
      author: post.author,
      publishedAt: new Date().toISOString(),
      state: 'published',
    } as never,
  })
  await payload.create({
    collection: 'posts',
    data: {
      title: draftTitle,
      slug: draftSlug,
      content: richText('Draft body.'),
      state: 'draft',
    } as never,
  })
})

// Defense in depth against fixture leakage (see scripts/e2e-fixture-cleanup.ts).
// FK-safe order: posts reference the category, so delete them first.
test.afterAll(async () => {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'posts', where: { slug: { in: [post.slug, draftSlug] } } })
  await payload.delete({ collection: 'post-categories', where: { slug: { equals: cat.slug } } })
})

test.describe('blog', () => {
  test('/blog lists published posts and hides drafts', async ({ page }) => {
    await page.goto(`${BASE}/blog`)
    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible()
    const card = page.getByRole('link', { name: new RegExp(post.title) })
    await expect(card).toBeVisible()
    await expect(card).toHaveAttribute('href', `/blog/${post.slug}`)
    await expect(page.getByText(draftTitle)).toHaveCount(0)
  })

  test('/blog/[slug] renders the post', async ({ page }) => {
    await page.goto(`${BASE}/blog/${post.slug}`)
    await expect(page.getByRole('heading', { level: 1, name: post.title })).toBeVisible()
    await expect(page.getByText(post.bodyLine)).toBeVisible()
    await expect(page.getByText(post.author)).toBeVisible()
  })

  test('/blog/category/[slug] lists the category posts', async ({ page }) => {
    await page.goto(`${BASE}/blog/category/${cat.slug}`)
    await expect(page.getByRole('heading', { level: 1, name: cat.name })).toBeVisible()
    await expect(page.getByRole('link', { name: new RegExp(post.title) })).toBeVisible()
  })

  test('draft post slug 308s to /blog', async ({ request }) => {
    const res = await request.get(`${BASE}/blog/${draftSlug}`, { maxRedirects: 0 })
    expect(res.status()).toBe(308)
    expect(res.headers()['location']).toBe('/blog')
  })

  test('unknown post slug 308s to /blog', async ({ request }) => {
    const res = await request.get(`${BASE}/blog/__does-not-exist__`, { maxRedirects: 0 })
    expect(res.status()).toBe(308)
    expect(res.headers()['location']).toBe('/blog')
  })
})
