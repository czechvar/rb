import { test, expect } from '@playwright/test'

// Slice 1 visual baseline for /trips/[slug] after the Figma R2 rebuild.
// Run `pnpm test:e2e -- --update-snapshots tests/e2e/trip-detail-visual.spec.ts`
// once locally to generate the baseline image, then commit the snapshot folder.

const SLUG = 'sport-climbing-basics' // seeded published event (scripts/seed.ts)

test('trip detail page renders (slice 1 baseline)', async ({ page }) => {
  await page.goto(`http://localhost:3001/trips/${SLUG}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page).toHaveScreenshot('trip-detail-slice-1.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
