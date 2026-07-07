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
    // Scope to the hero section to avoid matching duplicate text in SectionIntro / TripPitchBlock
    const hero = page.locator('section[aria-labelledby="trip-hero-title"]')
    await expect(hero.getByText('Hero smoke test event.')).toBeVisible()

    // Sidebar pricing card content (hardcoded)
    await expect(page.getByText('€ 950 / 1 week')).toBeVisible()
    await expect(page.getByText('€ 1,650 for 2 weeks')).toBeVisible()
    await expect(page.getByText('per person · coaching included')).toBeVisible()
    await expect(page.getByText('Rodellar, Aragon, Spain', { exact: true })).toBeVisible()
    await expect(page.getByText('Outdoor lead 6b-8a', { exact: true })).toBeVisible()
    await expect(page.getByText(/Free demo of Evolv & Singing Rock/)).toBeVisible()
    // Two "book" links exist (sidebar CTA + hero button); assert at least one is visible
    await expect(page.getByRole('link', { name: /BOOK YOUR SPOT/i }).first()).toBeVisible()

    // Tag chip strip
    await expect(page.getByText('RODELLAR, ARAGON, SPAIN', { exact: true })).toBeVisible()
    await expect(page.getByText('SPORT CLIMBING', { exact: true })).toBeVisible()
    await expect(page.getByText('OUTDOOR LEAD 6b-8a', { exact: true })).toBeVisible()
    await expect(page.getByText('MAY 2026', { exact: true })).toBeVisible()
    await expect(page.getByText('EVOLV & SINGING ROCK CLIMBING GEAR DEMO', { exact: true })).toBeVisible()

    // Breadcrumb is suppressed on this page
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0)

    // Header is transparent at top, opaque after scrolling past the hero
    const header = page.locator('header').first()
    const bgAtTop = await header.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    )
    // rgba(...,0) === fully transparent
    expect(bgAtTop).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|^transparent$/)

    await page.evaluate(() => window.scrollTo(0, window.innerHeight))
    // Poll until the scroll handler flips the class (no fixed sleep — survives slow CI)
    await expect
      .poll(
        () =>
          header.evaluate((el) => getComputedStyle(el).backgroundColor),
        { timeout: 3000 },
      )
      .not.toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|^transparent$/)
  })
})
