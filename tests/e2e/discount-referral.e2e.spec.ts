import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const BASE = 'http://localhost:3001'
const runId = Date.now().toString(36)
const customer = {
  email: `dc-ref-e2e-${runId}@example.com`,
  password: 'dc-ref-e2e-pwd-1',
  name: 'Discount Tester',
  phone: '+420 600 000 998',
}
const eventTitle = `E2E DC/Ref Trip ${runId}`
const dcCode = `DCE2E${runId.toUpperCase()}`
const refCode = `REFE2E${runId.toUpperCase()}`

let eventDateId: number
let eventId: number
let discountCodeId: number
let referralId: number

test.beforeAll(async () => {
  const payload = await getPayload({ config })

  const event = await payload.create({
    collection: 'events',
    data: { title: eventTitle } as never,
  })
  eventId = event.id
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-09-01T00:00:00.000Z',
      dateTo: '2027-09-05T00:00:00.000Z',
      price: 200, vat: 21, currency: 'EUR', capacity: 5, active: true,
    },
  })
  eventDateId = ed.id

  const u = await payload.create({
    collection: 'users',
    data: {
      ...customer, role: 'customer',
      addresses: [{
        label: 'Home', isDefault: true,
        firstName: 'Discount', lastName: 'Tester',
        street: 'Main 1', city: 'Prague', postalCode: '11000', country: 'CZ',
      }],
    } as never,
  })
  await payload.update({
    collection: 'users', id: u.id, data: { _verified: true } as never, overrideAccess: true,
  })

  const dc = await payload.create({
    collection: 'discount-codes',
    data: {
      code: dcCode, title: 'E2E 25% off',
      discountPercent: 25,
      validFrom: '2020-01-01', validUntil: '2099-12-31',
      commissionPercent: 10,
    } as never,
  })
  discountCodeId = dc.id as number

  const ref = await payload.create({
    collection: 'referrals',
    data: {
      code: refCode, name: 'E2E Partner',
      email: `partner-${runId}@example.com`,
      discountPercent: 10, commissionPercent: 15,
    } as never,
  })
  referralId = ref.id as number
})

// FK-safe cleanup. Orders first (they point at event-date, user, dc, ref).
test.afterAll(async () => {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'orders', where: { 'user.email': { equals: customer.email } } })
  await payload.delete({ collection: 'event-dates', where: { id: { equals: eventDateId } } })
  await payload.delete({ collection: 'events', where: { id: { equals: eventId } } })
  await payload.delete({ collection: 'users', where: { email: { equals: customer.email } } })
  await payload.delete({ collection: 'discount-codes', where: { id: { equals: discountCodeId } } })
  await payload.delete({ collection: 'referrals', where: { id: { equals: referralId } } })
})

async function login(page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[name="email"]', customer.email)
  await page.fill('input[name="password"]', customer.password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
}

test('book with a discount code', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/book/${eventDateId}`)
  await page.getByRole('button', { name: /add a code/i }).click()
  await page.getByPlaceholder('Enter code').fill(dcCode)
  await page.getByRole('button', { name: /^apply$/i }).click()
  await expect(page.getByText(new RegExp(`${dcCode}.*applied`, 'i'))).toBeVisible()
  await expect(page.getByText(/−50 EUR/)).toBeVisible()

  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(new RegExp(`/book/${eventDateId}/confirmation/\\d+`))
  await expect(page.getByText(/Discount.*−50 EUR/i)).toBeVisible()
})

test('book via referral URL — cookie set, ?ref stripped, notice shown', async ({ page }) => {
  await login(page)
  const resp = await page.goto(`${BASE}/book/${eventDateId}?ref=${refCode}`)
  expect(resp?.url()).not.toContain('ref=')
  await expect(page.getByText(/booking via.*E2E Partner.*10% off/i)).toBeVisible()

  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(new RegExp(`/book/${eventDateId}/confirmation/\\d+`))
  await expect(page.getByText(/−20 EUR/)).toBeVisible()
})

test('book with BOTH — DC wins on price; referral commission still snapshotted', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/book/${eventDateId}?ref=${refCode}`)
  await expect(page.getByText(/booking via.*E2E Partner/i)).toBeVisible()
  await page.getByRole('button', { name: /add a code/i }).click()
  await page.getByPlaceholder('Enter code').fill(dcCode)
  await page.getByRole('button', { name: /^apply$/i }).click()
  await expect(page.getByText(/−50 EUR/)).toBeVisible()   // DC's 25%, not referral's 10%

  await page.click('button[type="submit"]')
  const urlMatch = page.url().match(/confirmation\/(\d+)/)
  expect(urlMatch).not.toBeNull()
  const orderId = Number(urlMatch![1])

  // Verify the snapshot: DC discount + referral commission both recorded.
  const payload = await getPayload({ config })
  const order = (await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })) as {
    discountAmount: number; discountCommission: number; referralCommission: number
    discountCode: number | null; referral: number | null
  }
  expect(order.discountAmount).toBe(50)
  expect(order.discountCommission).toBe(20)   // 200 * 10%
  expect(order.referralCommission).toBe(30)   // 200 * 15%, still tracked
  expect(order.discountCode).toBe(discountCodeId)
  expect(order.referral).toBe(referralId)
})

test('invalid discount code shows inline error', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/book/${eventDateId}`)
  await page.getByRole('button', { name: /add a code/i }).click()
  await page.getByPlaceholder('Enter code').fill('NOPE-NEVER-EXISTED')
  await page.getByRole('button', { name: /^apply$/i }).click()
  await expect(page.getByText(/not valid/i)).toBeVisible()
})
