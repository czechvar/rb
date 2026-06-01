import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const BASE = 'http://localhost:3001'
const runId = Date.now().toString(36)
const customer = {
  email: `booking-e2e-${runId}@example.com`,
  password: 'booking-e2e-pwd-1',
  name: 'Booking Tester',
  phone: '+420 600 000 999',
}
const eventTitle = `E2E Booking Trip ${runId}`

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
      dateFrom: '2027-09-01T00:00:00.000Z',
      dateTo: '2027-09-05T00:00:00.000Z',
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
        firstName: 'Booking', lastName: 'Tester',
        street: 'Main 1', city: 'Prague', postalCode: '11000', country: 'CZ',
      }],
    } as never,
  })
  await payload.update({
    collection: 'users', id: u.id, data: { _verified: true } as never, overrideAccess: true,
  })
})

test('user can book an event date and see it in /account/orders', async ({ page }) => {
  await page.goto(`${BASE}/login`)
  await page.fill('input[name="email"]', customer.email)
  await page.fill('input[name="password"]', customer.password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))

  await page.goto(`${BASE}/book/${eventDateId}`)
  await expect(page.getByText(eventTitle)).toBeVisible()

  await page.click('button[type="submit"]')

  await expect(page).toHaveURL(new RegExp(`/book/${eventDateId}/confirmation/\\d+`))
  await expect(page.getByRole('heading', { name: /Booking received/i })).toBeVisible()
  const orderNumber = await page.locator('text=/RB-\\d{4}-\\d{6}/').first().textContent()
  expect(orderNumber).toMatch(/RB-\d{4}-\d{6}/)

  await page.goto(`${BASE}/account/orders`)
  await expect(page.getByText(eventTitle).first()).toBeVisible()
  await expect(page.getByText('Pending').first()).toBeVisible()
})

test('user can cancel a pending order', async ({ page }) => {
  await page.goto(`${BASE}/login`)
  await page.fill('input[name="email"]', customer.email)
  await page.fill('input[name="password"]', customer.password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))

  await page.goto(`${BASE}/account/orders`)
  await page.getByRole('link', { name: /^View →$/ }).first().click()
  await page.getByRole('button', { name: /Cancel booking/i }).click()
  await expect(page.getByText(/Status:\s*cancelled/i)).toBeVisible()
})
