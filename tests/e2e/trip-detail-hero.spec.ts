// tests/e2e/trip-detail-hero.spec.ts
import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '@payload-config'

test.describe('Trip Detail hero (Figma R3)', () => {
  test('renders new hero with sidebar, tag chips, and transparent header', async ({ page }) => {
    const payload = await getPayload({ config })
    const stamp = Date.now()
    // @ts-expect-error slug auto-filled by the slugField beforeValidate hook
    const created = await payload.create({
      collection: 'events',
      data: {
        title: `E2E Hero Trip ${stamp}`,
        state: 'published',
        shortDescription: 'Hero smoke test event.',
      },
    })

    await page.goto(`http://localhost:3001/trips/${created.slug}`)

    // Title and lead render in the hero
    await expect(page.locator('h1')).toContainText(`E2E Hero Trip ${stamp}`)
    await expect(page.getByText('Hero smoke test event.')).toBeVisible()

    // Sidebar pricing card content (hardcoded)
    await expect(page.getByText('€ 950 / 1 week')).toBeVisible()
    await expect(page.getByText('€ 1,650 for 2 weeks')).toBeVisible()
    await expect(page.getByText('per person · coaching included')).toBeVisible()
    await expect(page.getByText('Rodellar, Aragon, Spain')).toBeVisible()
    await expect(page.getByText('Outdoor lead 6b-8a')).toBeVisible()
    await expect(page.getByText(/Free demo of Evolv & Singing Rock/)).toBeVisible()
    await expect(page.getByRole('link', { name: /BOOK YOUR SPOT/i })).toBeVisible()

    // Tag chip strip
    await expect(page.getByText('RODELLAR, ARAGON, SPAIN')).toBeVisible()
    await expect(page.getByText('SPORT CLIMBING')).toBeVisible()
    await expect(page.getByText('OUTDOOR LEAD 6b-8a')).toBeVisible()
    await expect(page.getByText('MAY 2026')).toBeVisible()
    await expect(page.getByText('EVOLV & SINGING ROCK CLIMBING GEAR DEMO')).toBeVisible()

    // Breadcrumb is suppressed on this page
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0)

    // Header is transparent at top, opaque after scrolling past the hero
    const header = page.locator('header').first()
    const bgAtTop = await header.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    )
    // rgba(...,0) === fully transparent
    expect(bgAtTop).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/)

    await page.evaluate(() => window.scrollTo(0, window.innerHeight))
    // small wait for the scroll handler to flip the class
    await page.waitForTimeout(200)
    const bgAfterScroll = await header.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    )
    expect(bgAfterScroll).not.toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|^transparent$/)
  })
})
