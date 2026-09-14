// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import { getPublicOccurrenceBySlugs } from '@/lib/queries'

const marker = `occurrence-slug-${Date.now()}-${Math.random().toString(36).slice(2)}`
const created: Record<string, number[]> = { 'event-dates': [], events: [], locations: [] }

function track(collection: keyof typeof created, id: number) {
  created[collection].push(id)
}

describe('Event Date public slug behavior', () => {
  let eventId: number
  let otherEventId: number
  let firstLocationId: number
  let secondLocationId: number

  beforeAll(async () => {
    const payload = await getTestPayload()
    const firstLocation = await payload.create({
      collection: 'locations',
      data: { name: `${marker} Kalymnos`, slug: `${marker}-kalymnos`, active: true },
      overrideAccess: true,
    })
    const secondLocation = await payload.create({
      collection: 'locations',
      data: { name: `${marker} Telendos`, slug: `${marker}-telendos`, active: true },
      overrideAccess: true,
    })
    const event = await payload.create({
      collection: 'events',
      data: { title: `${marker} trip`, slug: `${marker}-trip`, state: 'published' } as never,
      overrideAccess: true,
    })
    const otherEvent = await payload.create({
      collection: 'events',
      data: { title: `${marker} other`, slug: `${marker}-other`, state: 'published' } as never,
      overrideAccess: true,
    })
    firstLocationId = firstLocation.id
    secondLocationId = secondLocation.id
    eventId = event.id
    otherEventId = otherEvent.id
    track('locations', firstLocation.id)
    track('locations', secondLocation.id)
    track('events', event.id)
    track('events', otherEvent.id)
  })

  afterAll(async () => {
    const payload = await getTestPayload()
    for (const collection of ['event-dates', 'events', 'locations'] as const) {
      for (const id of created[collection].reverse()) {
        await payload.delete({ collection, id, overrideAccess: true })
      }
    }
  })

  const occurrence = (overrides: Record<string, unknown> = {}) => ({
    event: eventId,
    locations: [firstLocationId],
    dateFrom: '2027-10-12T23:30:00.000-02:00',
    dateTo: '2027-10-20T00:00:00.000Z',
    price: 100,
    vat: 0,
    currency: 'EUR',
    capacity: 8,
    active: true,
    ...overrides,
  })

  it('derives a stored slug once from one Location and the UTC start date', async () => {
    const payload = await getTestPayload()
    const date = await payload.create({
      collection: 'event-dates',
      data: occurrence() as never,
      overrideAccess: true,
    })
    track('event-dates', date.id)
    expect(date.slug).toBe(`${marker}-kalymnos-2027-10-13`)

    const changed = await payload.update({
      collection: 'event-dates',
      id: date.id,
      data: { dateFrom: '2027-11-01T00:00:00.000Z', locations: [secondLocationId] } as never,
      overrideAccess: true,
    })
    expect(changed.slug).toBe(date.slug)
  })

  it('requires an explicit editorial slug for missing or multiple Locations', async () => {
    const payload = await getTestPayload()
    await expect(payload.create({
      collection: 'event-dates', data: occurrence({ locations: [] }) as never, overrideAccess: true,
    })).rejects.toThrow(/occurrence slug explicitly/i)
    await expect(payload.create({
      collection: 'event-dates', data: occurrence({ locations: [firstLocationId, secondLocationId] }) as never, overrideAccess: true,
    })).rejects.toThrow(/occurrence slug explicitly/i)

    const explicit = await payload.create({
      collection: 'event-dates',
      data: occurrence({ locations: [firstLocationId, secondLocationId], slug: `${marker}-islands-2027-10-13` }) as never,
      overrideAccess: true,
    })
    track('event-dates', explicit.id)
    expect(explicit.slug).toBe(`${marker}-islands-2027-10-13`)
  })

  it('reserves current slugs and aliases within the parent while allowing another Event', async () => {
    const payload = await getTestPayload()
    const original = await payload.create({
      collection: 'event-dates', data: occurrence({ slug: `${marker}-reserved` }) as never, overrideAccess: true,
    })
    track('event-dates', original.id)

    await expect(payload.create({
      collection: 'event-dates', data: occurrence({ slug: original.slug }) as never, overrideAccess: true,
    })).rejects.toThrow(/already reserved/i)

    const renamed = await payload.update({
      collection: 'event-dates', id: original.id, data: { slug: `${marker}-renamed` }, overrideAccess: true,
    })
    expect(renamed.slugAliases?.map((alias) => alias.slug)).toContain(original.slug)

    await expect(payload.create({
      collection: 'event-dates', data: occurrence({ slug: original.slug }) as never, overrideAccess: true,
    })).rejects.toThrow(/already reserved/i)

    const other = await payload.create({
      collection: 'event-dates',
      data: occurrence({ event: otherEventId, slug: original.slug }) as never,
      overrideAccess: true,
    })
    track('event-dates', other.id)
    expect(other.slug).toBe(original.slug)
  })

  it('freezes parent reassignment and published parent slug changes', async () => {
    const payload = await getTestPayload()
    const date = await payload.create({
      collection: 'event-dates', data: occurrence({ slug: `${marker}-stable-parent` }) as never, overrideAccess: true,
    })
    track('event-dates', date.id)
    await expect(payload.update({
      collection: 'event-dates', id: date.id, data: { event: otherEventId }, overrideAccess: true,
    })).rejects.toThrow(/cannot be moved/i)
    await expect(payload.update({
      collection: 'events', id: eventId, data: { slug: `${marker}-changed-parent` }, overrideAccess: true,
    })).rejects.toThrow(/slugs.*frozen/i)
  })

  it('resolves only the exact active occurrence under its published parent', async () => {
    const payload = await getTestPayload()
    const date = await payload.create({
      collection: 'event-dates', data: occurrence({ slug: `${marker}-public` }) as never, overrideAccess: true,
    })
    track('event-dates', date.id)

    await expect(getPublicOccurrenceBySlugs(`${marker}-trip`, date.slug!)).resolves.toMatchObject({
      event: { id: eventId },
      occurrence: { id: date.id },
      requestedAlias: false,
    })
    await expect(getPublicOccurrenceBySlugs(`${marker}-other`, date.slug!)).resolves.toBeNull()

    await payload.update({
      collection: 'event-dates', id: date.id, data: { active: false }, overrideAccess: true,
    })
    await expect(getPublicOccurrenceBySlugs(`${marker}-trip`, date.slug!)).resolves.toBeNull()
  })
})
