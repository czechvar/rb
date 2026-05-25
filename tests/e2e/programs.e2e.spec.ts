import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '@payload-config'

test.describe('Program (Trip Category) page', () => {
  test('renders sections for a published Type', async ({ page }) => {
    const payload = await getPayload({ config })
    const stamp = Date.now()
    // @ts-expect-error slug auto-filled by the slugField beforeValidate hook
    const created = await payload.create({
      collection: 'types',
      data: {
        name: `E2E Program ${stamp}`,
        state: 'published',
        active: true,
        shortDescription: 'E2E smoke for the Trip Category page.',
        highlights: [{ text: 'Highlight A' }, { text: 'Highlight B' }],
        curriculumPillars: [
          {
            icon: '🧗',
            title: 'Technique',
            bullets: [{ text: 'Footwork' }],
          },
        ],
      },
    })

    await page.goto(`http://localhost:3000/programs/${created.slug}`)

    await expect(page.locator('h1')).toContainText(`E2E Program ${stamp}`)
    await expect(page.getByRole('heading', { name: 'Program Highlights' })).toBeVisible()
    await expect(page.getByText('Highlight A')).toBeVisible()
    await expect(page.getByRole('heading', { name: "What You'll Work On" })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Why Rockbusters' })).toBeVisible()
  })

  test('404s for a draft Type', async ({ page }) => {
    const payload = await getPayload({ config })
    const stamp = Date.now()
    // @ts-expect-error slug auto-filled by the slugField beforeValidate hook
    await payload.create({
      collection: 'types',
      data: {
        name: `E2E Draft Program ${stamp}`,
        state: 'draft',
      },
    })
    const res = await page.goto(`http://localhost:3000/programs/e2e-draft-program-${stamp}`)
    expect(res?.status()).toBe(404)
  })
})
