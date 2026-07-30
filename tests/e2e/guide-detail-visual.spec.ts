import { test, expect } from '@playwright/test'

// Visual baseline for /team/[slug] after the guide wireframe rebuild.
// Run `pnpm test:e2e guide-detail-visual --update-snapshots` once locally
// to generate the baseline, then commit the snapshot folder.

const SLUG = 'jany' // seeded guide with full detail content (scripts/seed.ts)

test('guide detail page renders (baseline)', async ({ page }) => {
  await page.goto(`http://localhost:3001/team/${SLUG}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page).toHaveScreenshot('guide-detail.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
