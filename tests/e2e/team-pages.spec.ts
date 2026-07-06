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
  tagline: `Tag line for e2e guide ${runId}.`,
  tagText: 'Sport 9b',
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
      tagline: guide.tagline,
      tags: [{ text: guide.tagText }],
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

// Defense in depth against fixture leakage (see scripts/e2e-fixture-cleanup.ts):
// remove the records this run created. Guides have no FK dependents.
test.afterAll(async () => {
  const payload = await getPayload({ config })
  await payload.delete({
    collection: 'guides',
    where: { slug: { in: [guide.slug, friend.slug] } },
  })
})

test.describe('team pages', () => {
  test('team landing renders all sections', async ({ page }) => {
    await page.goto(`${BASE}/team`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/broken/i)
    await expect(page.getByRole('heading', { name: /guides & coaches/i })).toBeVisible()
    // UpcomingTrips renders only when future event-dates exist; skip assertion if absent
    const tripsHeading = page.getByRole('heading', { name: /trips & courses/i })
    if (await tripsHeading.count()) {
      await expect(tripsHeading).toBeVisible()
    }
  })

  test('guide card navigates to detail', async ({ page }) => {
    await page.goto(`${BASE}/team`)
    const card = page.locator('a[href^="/team/"]').first()
    await card.click()
    await expect(page).toHaveURL(/\/team\/.+/)
  })

  test('guide card shows tag chip', async ({ page }) => {
    await page.goto(`${BASE}/team`)
    await expect(page.getByText(guide.tagText).first()).toBeVisible()
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

  test('friends section renders with ambassador cards', async ({ page }) => {
    await page.goto(`${BASE}/team`)
    await expect(page.getByRole('heading', { name: /friends & ambassadors/i })).toBeVisible()
    const friendCard = page.locator(`a[href="/team/${friend.slug}"]`)
    await expect(friendCard).toBeVisible()
  })

  test('/team/[slug] shows the role line', async ({ page }) => {
    await page.goto(`${BASE}/team/${guide.slug}`)
    await expect(page.getByText(guide.role)).toBeVisible()
  })
})

test.describe('old-site redirects', () => {
  test('pattern: /team-member/:slug 308s to /team/:slug', async ({ request }) => {
    const res = await request.get(`${BASE}/team-member/${guide.slug}`, {
      maxRedirects: 0,
    })
    expect(res.status()).toBe(308)
    expect(res.headers()['location']).toBe(`/team/${guide.slug}`)
  })

  test('explicit map: suffixed old slug lands on clean slug', async ({ request }) => {
    const res = await request.get(`${BASE}/team-member/adam-ondra-pro-climber`, {
      maxRedirects: 0,
    })
    expect(res.status()).toBe(308)
    expect(res.headers()['location']).toBe('/team/adam-ondra')
  })
})
