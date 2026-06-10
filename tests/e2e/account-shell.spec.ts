import { test, expect, type Page } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const BASE = 'http://localhost:3001'
const runId = Date.now().toString(36)
const customer = {
  email: `shell-e2e-${runId}@example.com`,
  password: 'shell-e2e-pwd-1',
  name: 'Shell Tester',
  phone: '+420 600 000 998',
}
const eventTitle = `E2E Shell Trip ${runId}`

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
    data: {
      ...customer, role: 'customer',
      addresses: [{
        label: 'Home', isDefault: true,
        firstName: 'Shell', lastName: 'Tester',
        street: 'Main 1', city: 'Prague', postalCode: '11000', country: 'CZ',
      }],
    } as never,
  })
  await payload.update({
    collection: 'users', id: u.id, data: { _verified: true } as never, overrideAccess: true,
  })
})

async function login(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[name="email"]', customer.email)
  await page.fill('input[name="password"]', customer.password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
}

test.describe('header user icon', () => {
  test('logged out: icon links to /login', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const icon = page.locator('header').getByRole('link', { name: 'Log in' })
    await expect(icon).toBeVisible()
    await expect(icon).toHaveAttribute('href', '/login')
  })

  test('logged out: mobile drawer has a Log in entry', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASE}/`)
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(
      page.getByRole('dialog', { name: 'Site menu' }).getByRole('link', { name: 'Log in' }),
    ).toBeVisible()
  })

  test('logged in: icon links to /account', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/`)
    const icon = page.locator('header').getByRole('link', { name: 'My account' })
    // useMe() resolves after hydration — toHaveAttribute auto-retries.
    await expect(icon).toHaveAttribute('href', '/account')
  })
})
