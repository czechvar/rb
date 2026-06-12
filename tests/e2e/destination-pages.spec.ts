import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const BASE = 'http://localhost:3001'
const runId = Date.now().toString(36)
const dest = {
  name: `E2E Crag ${runId}`,
  slug: `e2e-crag-${runId}`,
  country: 'Testland',
  introLine: `Intro line for e2e crag ${runId} — pockets for days.`,
}
const eventTitle = `E2E Dest Trip ${runId}`

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
  const loc = await payload.create({
    collection: 'locations',
    data: {
      name: dest.name,
      slug: dest.slug,
      country: dest.country,
      coordinates: [11.41, 49.77],
      content: richText(dest.introLine),
      active: true,
    } as never,
  })
  await payload.create({
    collection: 'events',
    data: {
      title: eventTitle,
      state: 'published',
      locations: [loc.id],
    } as never,
  })
})

test.describe('destination pages', () => {
  test('/destinations groups by country and links cards', async ({ page }) => {
    await page.goto(`${BASE}/destinations`)
    await expect(page.getByRole('heading', { level: 1, name: 'Destinations' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: dest.country })).toBeVisible()
    const card = page.getByRole('link', { name: new RegExp(dest.name) })
    await expect(card).toBeVisible()
    await expect(card).toHaveAttribute('href', `/destinations/${dest.slug}`)
  })

  test('/destinations/[slug] renders content, map, and trips', async ({ page }) => {
    await page.goto(`${BASE}/destinations/${dest.slug}`)
    await expect(page.getByRole('heading', { level: 1, name: dest.name })).toBeVisible()
    await expect(page.getByText(dest.introLine)).toBeVisible()
    await expect(page.locator('iframe[src*="openstreetmap.org"]')).toBeVisible()
    await expect(page.getByRole('link', { name: eventTitle })).toBeVisible()
  })

  test('unknown destination slug 404s', async ({ page }) => {
    const res = await page.goto(`${BASE}/destinations/__does-not-exist__`)
    expect(res?.status()).toBe(404)
  })
})
