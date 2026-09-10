import { test, expect } from '@playwright/test'

// Read-only: exercise the shared shell against existing public pages, no fixtures.
test.describe('Global header scroll behavior', () => {
  for (const width of [390, 1440]) {
    test(`uses the same transition across pages at ${width}px`, async ({ page }) => {
      test.setTimeout(240_000)
      await page.setViewportSize({ width, height: 900 })
      for (const route of ['/', '/trips', '/destinations', '/team', '/programs', '/blog']) {
        await page.goto(route, { waitUntil: 'domcontentloaded' })
        const header = page.locator('header[data-scrolled]')
        await expect(header).toHaveCount(1)
        for (const [y, scrolled] of [[0, false], [60, false], [61, true], [700, true], [0, false]] as const) {
          await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
          await expect(header).toHaveAttribute('data-scrolled', String(scrolled))
          await expect(header).toHaveCSS('position', 'fixed')
          await expect(header).toHaveCSS('backdrop-filter', scrolled ? 'blur(12px)' : 'none')
        }
      }
    })
  }

  test('mobile menu navigation restores the shared top state', async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const header = page.locator('header[data-scrolled]')
    await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }))
    await expect(header).toHaveAttribute('data-scrolled', 'true')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('dialog', { name: 'Site menu' }).getByRole('link', { name: 'Trips & Clinics' }).click()
    await expect(page).toHaveURL(/\/trips$/, { timeout: 90_000 })
    await expect(page.getByRole('dialog', { name: 'Site menu' })).toHaveCount(0)
    await expect(header).toHaveAttribute('data-scrolled', 'false')
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(header).toHaveCSS('transition-duration', '0s')
  })
})
