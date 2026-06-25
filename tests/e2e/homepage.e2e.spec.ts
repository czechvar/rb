import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '@payload-config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const richText = (text: string): any => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', version: 1, text }],
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
})

test.describe('Homepage', () => {
  test.beforeAll(async () => {
    const payload = await getPayload({ config })
    const stamp = Date.now()
    const reviews = await payload.find({
      collection: 'reviews',
      where: { and: [{ active: { equals: true } }, { event: { exists: false } }, { type: { exists: false } }] },
      limit: 1,
    })
    if (reviews.docs.length === 0) {
      await payload.create({
        collection: 'reviews',
        data: { quote: 'Outstanding coaching.', reviewerName: `E2E ${stamp}`, active: true },
      })
    }
    const faqs = await payload.find({
      collection: 'faqs',
      where: { and: [{ active: { equals: true } }, { event: { exists: false } }, { type: { exists: false } }] },
      limit: 1,
    })
    if (faqs.docs.length === 0) {
      await payload.create({
        collection: 'faqs',
        data: {
          question: `E2E question ${stamp}`,
          answer: richText('E2E answer body.'),
          active: true,
        },
      })
    }
    const partners = await payload.find({
      collection: 'partners',
      where: { and: [{ featured: { equals: true } }, { active: { equals: true } }] },
      limit: 1,
    })
    if (partners.docs.length === 0) {
      await payload.create({
        collection: 'partners',
        // @ts-expect-error slug auto-filled
        data: { name: `E2E Brand ${stamp}`, featured: true, active: true },
      })
    }
  })

  test('renders all expected section markers', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/CLIMB/i)
    await expect(page.getByText('Years on the rock')).toBeVisible()
    await expect(page.getByRole('heading', { name: /NOT A TOUR COMPANY/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /EVERY QUESTION/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /PICK YOUR/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /EUROPE.S FINEST CRAGS/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'FAQ' })).toBeVisible()
    await expect(page.getByText(/Trusted by the best brands/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /YOUR NEXT LEVEL/i })).toBeVisible()
  })

  test('hero CTA links to /programs', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('link', { name: /Explore Trips.*Courses/i }).first()
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', '/programs')
  })
})
