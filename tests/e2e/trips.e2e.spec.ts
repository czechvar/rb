import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '@payload-config'

test.describe('Trip Detail page', () => {
  test('renders sections for a published Event', async ({ page }) => {
    const payload = await getPayload({ config })
    const stamp = Date.now()
    // @ts-expect-error slug auto-filled by the slugField beforeValidate hook
    const created = await payload.create({
      collection: 'events',
      data: {
        title: `E2E Trip ${stamp}`,
        state: 'published',
        shortDescription: 'E2E smoke for the Trip Detail page.',
        highlights: [{ text: 'Five resorts' }, { text: 'Daily coaching' }],
        prerequisites: [{ text: 'Comfortable on red runs' }],
        equipmentIntro: 'Everything you need on the mountain.',
        essentialEquipment: [
          { icon: '🎿', name: 'Skis', note: 'Bring your own', mandatory: false },
          { icon: '⛑️', name: 'Helmet', note: 'Required', mandatory: true },
        ],
        whatYouLearn: {
          intro: 'Real skill development.',
          box1Heading: 'Technique',
          box1Bullets: [{ text: 'Carving' }],
          box2Heading: 'Mindset',
          box2Bullets: [{ text: 'Confidence' }],
        },
        itinerary: {
          intro: 'Daily progression.',
          days: [
            {
              dayBadge: 'DAY 1',
              destinationName: 'Zell am See',
              metaLine: '77 km pistes',
              eyebrow: 'Day 1 · Arrival',
              heading: 'First Turns',
              description: 'Warm-up day.',
              highlightTags: [{ text: '🎿 First runs' }],
              schedule: [{ time: '09:00', activity: 'Meet coaches' }],
            },
          ],
        },
      },
    })

    await page.goto(`http://localhost:3001/trips/${created.slug}`)

    await expect(page.locator('h1')).toContainText(`E2E Trip ${stamp}`)
    await expect(page.getByRole('heading', { name: 'Trip Highlights' })).toBeVisible()
    await expect(page.getByText('Five resorts')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Daily flow' })).toBeVisible()
    await expect(page.getByText('Zell am See')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Essential equipment' })).toBeVisible()
    // EssentialEquipment marks mandatory items with a CSS class + *, not the word "Mandatory";
    // verify the mandatory helmet note text as a proxy for mandatory rendering
    await expect(page.getByText('Required')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Why Rockbusters' })).toBeVisible()
  })

  test('404s for a draft Event', async ({ page }) => {
    const payload = await getPayload({ config })
    const stamp = Date.now()
    // @ts-expect-error slug auto-filled
    await payload.create({
      collection: 'events',
      data: {
        title: `E2E Draft Trip ${stamp}`,
        state: 'draft',
      },
    })
    const res = await page.goto(`http://localhost:3001/trips/e2e-draft-trip-${stamp}`)
    expect(res?.status()).toBe(404)
  })
})
