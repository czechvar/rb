import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const BASE = 'http://localhost:3001'
const runId = Date.now().toString(36)
const customer = {
  email: `login-redirect-e2e-${runId}@example.com`,
  password: 'login-redirect-pwd-1',
  name: 'Redirect Tester',
  phone: '+420 600 000 998',
}
const eventTitle = `E2E Redirect Trip ${runId}`

let eventDateId: number

test.beforeAll(async () => {
  const payload = await getPayload({ config })

  const event = await payload.create({
    collection: 'events',
    data: { title: eventTitle } as never,
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-10-01T00:00:00.000Z',
      dateTo: '2027-10-05T00:00:00.000Z',
      price: 250, vat: 21, currency: 'EUR', capacity: 5, active: true,
    },
  })
  eventDateId = ed.id

  const u = await payload.create({
    collection: 'users',
    data: { ...customer, role: 'customer' } as never,
  })
  await payload.update({
    collection: 'users', id: u.id, data: { _verified: true } as never, overrideAccess: true,
  })
})

async function signIn(page: import('@playwright/test').Page) {
  await page.fill('input[name="email"]', customer.email)
  await page.fill('input[name="password"]', customer.password)
  await page.click('button[type="submit"]')
}

test('logged-out visit to /book/[id] returns there after signing in', async ({ page }) => {
  await page.goto(`${BASE}/book/${eventDateId}`)
  await expect(page).toHaveURL(/\/login\?from=/)

  await signIn(page)

  await expect(page).toHaveURL(new RegExp(`/book/${eventDateId}$`), { timeout: 30_000 })
  await expect(page.getByText(eventTitle)).toBeVisible()
})

test('authenticated visit to /login?from=… honors the redirect target', async ({ page }) => {
  await page.goto(`${BASE}/login`)
  await signIn(page)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))

  await page.goto(`${BASE}/login?from=${encodeURIComponent(`/book/${eventDateId}`)}`)
  await expect(page).toHaveURL(new RegExp(`/book/${eventDateId}$`))
})

test('authenticated visit to /login with an external from falls back to /account', async ({ page }) => {
  await page.goto(`${BASE}/login`)
  await signIn(page)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))

  await page.goto(`${BASE}/login?from=${encodeURIComponent('https://evil.example/phish')}`)
  await expect(page).toHaveURL(/\/account$/)
})
