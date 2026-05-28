import { test, expect } from '@playwright/test'

const SLUG = 'sport-climbing-basics'
const BASE = 'http://localhost:3001'

const subPages = [
  { path: 'dates', heading: /dates|upcoming|event dates/i },
  { path: 'faq', heading: /faq|questions/i },
  { path: 'logistics', heading: /logistics|accommodation|travel|location/i },
]

for (const sub of subPages) {
  test(`/trips/${SLUG}/${sub.path} renders 200 and shows expected heading`, async ({ page }) => {
    const res = await page.goto(`${BASE}/trips/${SLUG}/${sub.path}`)
    expect(res?.status()).toBe(200)
    // At least one heading on the page should mention the section topic.
    const headings = page.getByRole('heading')
    await expect(headings.filter({ hasText: sub.heading }).first()).toBeVisible()
  })

  test(`/trips/__does-not-exist__/${sub.path} 404s`, async ({ page }) => {
    const res = await page.goto(`${BASE}/trips/__does-not-exist__/${sub.path}`)
    expect(res?.status()).toBe(404)
  })
}
