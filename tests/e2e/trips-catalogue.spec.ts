import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '@payload-config'

const BASE = 'http://localhost:3001'
const runId = Date.now().toString(36)
const category = {
  name: `E2E Catalogue Type ${runId}`,
  slug: `e2e-catalogue-type-${runId}`,
}
const matchingTripTitle = `E2E Catalogue Match ${runId}`
const otherTripTitle = `E2E Catalogue Other ${runId}`
const pageTitle = `E2E Trips ${runId}`

let categoryId: number
let locationId: number
let matchingEventId: number
let otherEventId: number
let matchingDateId: number
let otherDateId: number

function tripsLayout(presentation: 'calendar' | 'compact') {
  return [
    {
      blockType: 'catalogueResults',
      heading: pageTitle,
      enabledFacets: ['category'],
      presentation,
      paginationMode: 'all',
    },
  ]
}

test.beforeAll(async () => {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'pages', where: { slug: { equals: 'trips' } } })
  const createdCategory = await payload.create({
    collection: 'categories',
    data: { ...category, active: true } as never,
  })
  categoryId = createdCategory.id
  const location = await payload.create({
    collection: 'locations',
    data: {
      name: `E2E Catalogue Location ${runId}`,
      slug: `e2e-catalogue-location-${runId}`,
      country: 'Testland',
      active: true,
    } as never,
  })
  locationId = location.id
  const matchingEvent = await payload.create({
    collection: 'events',
    data: {
      title: matchingTripTitle,
      slug: `e2e-catalogue-match-${runId}`,
      state: 'published',
      categories: [categoryId],
      locations: [locationId],
    } as never,
  })
  matchingEventId = matchingEvent.id
  const otherEvent = await payload.create({
    collection: 'events',
    data: {
      title: otherTripTitle,
      slug: `e2e-catalogue-other-${runId}`,
      state: 'published',
      locations: [locationId],
    } as never,
  })
  otherEventId = otherEvent.id
  const matchingDate = await payload.create({
    collection: 'event-dates',
    data: {
      event: matchingEventId,
      dateFrom: '2030-10-12T00:00:00.000Z',
      dateTo: '2030-10-18T00:00:00.000Z',
      locations: [locationId],
      price: 900,
      vat: 0,
      currency: 'EUR',
      capacity: 8,
      active: true,
    } as never,
  })
  matchingDateId = matchingDate.id
  const otherDate = await payload.create({
    collection: 'event-dates',
    data: {
      event: otherEventId,
      dateFrom: '2030-10-20T00:00:00.000Z',
      dateTo: '2030-10-26T00:00:00.000Z',
      locations: [locationId],
      price: 700,
      vat: 0,
      currency: 'EUR',
      capacity: 8,
      active: true,
    } as never,
  })
  otherDateId = otherDate.id
  await payload.create({
    collection: 'pages',
    data: {
      title: pageTitle,
      slug: 'trips',
      status: 'published',
      layout: tripsLayout('calendar'),
    } as never,
  })
})

test.afterAll(async () => {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'pages', where: { slug: { equals: 'trips' } } })
  await payload.delete({
    collection: 'event-dates',
    where: { id: { in: [matchingDateId, otherDateId] } },
  })
  await payload.delete({
    collection: 'events',
    where: { id: { in: [matchingEventId, otherEventId] } },
  })
  await payload.delete({ collection: 'locations', where: { id: { equals: locationId } } })
  await payload.delete({ collection: 'categories', where: { id: { equals: categoryId } } })
})

test.describe('/trips catalogue', () => {
  test('uses the URL-backed type filter and renders calendar cards', async ({ page }) => {
    await page.goto(`${BASE}/trips`)
    await expect(page.getByRole('heading', { name: pageTitle })).toBeVisible()
    await expect(page.getByText(matchingTripTitle)).toBeVisible()
    await expect(page.getByText(otherTripTitle)).toBeVisible()
    await expect(
      page.locator('a').filter({ hasText: matchingTripTitle }).locator('time'),
    ).toHaveCount(0)

    await page.getByLabel('Type').selectOption(category.slug)
    await expect(page).toHaveURL(new RegExp(`\\?category=${category.slug}$`))
    await expect(page.getByText(matchingTripTitle)).toBeVisible()
    await expect(page.getByText(otherTripTitle)).toHaveCount(0)
  })

  test('renders the compact presentation configured in CMS', async ({ page }) => {
    const payload = await getPayload({ config })
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'trips' } },
      limit: 1,
    })
    await payload.update({
      collection: 'pages',
      id: existing.docs[0].id,
      data: { layout: tripsLayout('compact') } as never,
    })

    await page.goto(`${BASE}/trips?category=${category.slug}`)
    const matchingTrip = page.locator('a').filter({ hasText: matchingTripTitle })
    await expect(matchingTrip.locator('time')).toBeVisible()
    await expect(page.getByText(otherTripTitle)).toHaveCount(0)
  })
})
