import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const BASE = 'http://localhost:3001'
const runId = Date.now().toString(36)
const guide = {
  name: `E2E Guide ${runId}`,
  slug: `e2e-guide-${runId}`,
  email: `e2e-guide-${runId}@example.com`,
  bioLine: `Bio line for e2e guide ${runId} — coaching since forever.`,
  role: 'Head coach',
}
const friend = {
  name: `E2E Friend ${runId}`,
  slug: `e2e-friend-${runId}`,
  role: 'Pro climber',
}

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
  await payload.create({
    collection: 'guides',
    data: {
      name: guide.name,
      slug: guide.slug,
      email: guide.email,
      content: richText(guide.bioLine),
      active: true,
      featured: false,
      role: guide.role,
      section: 'team',
    } as never,
  })
  await payload.create({
    collection: 'guides',
    data: {
      name: friend.name,
      slug: friend.slug,
      role: friend.role,
      section: 'friends',
      content: richText(`Friend bio ${runId}.`),
      active: true,
      featured: false,
    } as never,
  })
})

test.describe('team pages', () => {
  test('/team lists active guides with links to detail', async ({ page }) => {
    await page.goto(`${BASE}/team`)
    await expect(page.getByRole('heading', { name: /team/i }).first()).toBeVisible()
    const card = page.getByRole('link', { name: new RegExp(guide.name) })
    await expect(card).toBeVisible()
    await expect(card).toHaveAttribute('href', `/team/${guide.slug}`)
  })

  test('/team/[slug] renders the guide profile without leaking contacts', async ({ page }) => {
    await page.goto(`${BASE}/team/${guide.slug}`)
    await expect(page.getByRole('heading', { level: 1, name: guide.name })).toBeVisible()
    await expect(page.getByText(guide.bioLine)).toBeVisible()
    // email/phone exist on the collection but must not be rendered publicly
    await expect(page.locator('body')).not.toContainText(guide.email)
  })

  test('unknown guide slug 404s', async ({ page }) => {
    const res = await page.goto(`${BASE}/team/__does-not-exist__`)
    expect(res?.status()).toBe(404)
  })

  test('/team renders two sections with roles on cards', async ({ page }) => {
    await page.goto(`${BASE}/team`)
    await expect(page.getByRole('heading', { level: 1, name: 'Rockbusters Team' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Friends & Ambassadors' })).toBeVisible()
    const friendCard = page.getByRole('link', { name: new RegExp(friend.name) })
    await expect(friendCard).toBeVisible()
    await expect(friendCard).toContainText(friend.role)
  })

  test('/team/[slug] shows the role line', async ({ page }) => {
    await page.goto(`${BASE}/team/${guide.slug}`)
    await expect(page.getByText(guide.role)).toBeVisible()
  })
})
