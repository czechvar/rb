import { expect, it } from 'vitest'
import type { Payload } from 'payload'
import { remapRelationships, upsertRow, type SeedIDMap } from '../../scripts/seed'

it('remaps coach and plural taxonomy relationships with independently chosen IDs', () => {
  const maps: SeedIDMap = new Map([
    ['guides', new Map([['28', 3001]])],
    ['programs', new Map([['2', 50]])],
    ['difficulties', new Map([['1', 60]])],
  ])
  expect(
    remapRelationships(maps, 'events', {
      coaches: [28],
      programs: [2],
      difficulties: [1],
      editorial: { coachProfiles: [{ guide: 28 }] },
    }),
  ).toEqual({
    coaches: [3001],
    programs: [50],
    difficulties: [60],
    editorial: { coachProfiles: [{ guide: 3001 }] },
  })
})
it('remaps Event Dates to destination Trip Variant IDs', () => {
  const maps: SeedIDMap = new Map([['trip-variants', new Map([['651', 5001]])]])
  expect(remapRelationships(maps, 'event-dates', { tripVariant: 651 })).toEqual({
    tripVariant: 5001,
  })
})

it('matches a Trip Variant by its mapped Event and scoped slug', async () => {
  const target = { id: 102, event: 80, slug: 'kalymnos', title: 'Course — Kalymnos', locations: [28], indexable: false }
  const wrongParent = { ...target, id: 101, event: 70 }
  const payload = {
    find: async ({ where }: { where?: Record<string, unknown> }) => {
      if ('and' in (where ?? {})) return { docs: [target] }
      if ('slug' in (where ?? {})) return { docs: [wrongParent] }
      return { docs: [] }
    },
  } as unknown as Payload
  const maps: SeedIDMap = new Map([['events', new Map([['8', 80]])]])
  await expect(upsertRow(payload, 'trip-variants', {
    id: 651, event: 8, slug: 'kalymnos', title: 'Course — Kalymnos', locations: [28], indexable: false,
  }, maps)).resolves.toBe('skipped')
  expect(maps.get('trip-variants')?.get('651')).toBe(102)
})

it('never reuses an unrelated Trip Variant with the same source numeric ID', async () => {
  let created: Record<string, unknown> | undefined
  const payload = {
    find: async ({ where }: { where?: Record<string, unknown> }) => {
      if ('and' in (where ?? {})) return { docs: [] }
      if ('id' in (where ?? {})) return { docs: [{ id: 651, event: 70, slug: 'unrelated' }] }
      return { docs: [] }
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      created = { ...data, id: 9001 }
      return created
    },
  } as unknown as Payload
  const maps: SeedIDMap = new Map([['events', new Map([['8', 80]])]])

  await expect(upsertRow(payload, 'trip-variants', {
    id: 651, event: 8, slug: 'kalymnos', title: 'Course — Kalymnos', locations: [], indexable: false,
  }, maps)).resolves.toBe('created')
  expect(created).toMatchObject({ event: 80, slug: 'kalymnos' })
  expect(maps.get('trip-variants')?.get('651')).toBe(9001)
})
it('keeps the same historical date slug under different parent Events', async () => {
  const wrongParent = { id: 10001, event: 70, slug: 'etxauri-2016-07-02-to-2016-07-16' }
  let created: Record<string, unknown> | undefined
  const payload = {
    find: async ({ where }: { where?: Record<string, unknown> }) => {
      if ('and' in (where ?? {})) return { docs: [] }
      if ('slug' in (where ?? {})) return { docs: [wrongParent] }
      return { docs: [] }
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      created = { ...data, id: 10002 }
      return created
    },
  } as unknown as Payload
  const maps: SeedIDMap = new Map([['events', new Map([['4', 80]])]])
  await expect(upsertRow(payload, 'event-dates', {
    id: 24, event: 4, slug: wrongParent.slug,
  }, maps, { forceCreateWhenMissingID: true })).resolves.toBe('created')
  expect(created).toMatchObject({ event: 80, slug: wrongParent.slug })
  expect(maps.get('event-dates')?.get('24')).toBe(10002)
})
it('keeps identical scheduled occurrences distinct and reuses established mappings', async () => {
  const content = { event: 8, dateFrom: '2026-09-26', dateTo: '2026-10-10' }
  const rows = [
    { ...content, id: 10001 },
    { ...content, id: 10002 },
  ]
  const payload = {
    find: async (args: { where?: { id?: { equals: unknown } } }) => ({
      docs: args.where?.id ? rows.filter((row) => row.id === args.where?.id?.equals) : rows,
    }),
  } as unknown as Payload
  const maps: SeedIDMap = new Map()
  await upsertRow(payload, 'event-dates', { ...content, id: 267 }, maps)
  await upsertRow(payload, 'event-dates', { ...content, id: 780 }, maps)
  await upsertRow(payload, 'event-dates', { ...content, id: 267 }, maps)
  expect(Object.fromEntries(maps.get('event-dates')!)).toEqual({ '267': 10001, '780': 10002 })
})
it('lets a new database allocate numeric IDs', async () => {
  let written: Record<string, unknown> | undefined
  const payload = {
    find: async () => ({ docs: [] }),
    create: async ({ data }: { data: Record<string, unknown> }) => {
      written = data
      return { ...data, id: 10001 }
    },
  } as unknown as Payload
  const maps: SeedIDMap = new Map()
  await upsertRow(payload, 'event-dates', { id: 745, event: 8 }, maps, {
    forceCreateWhenMissingID: true,
  })
  expect(written).not.toHaveProperty('id')
  expect(maps.get('event-dates')?.get('745')).toBe(10001)
})

it('keeps stored occurrence URLs identical across fresh and repeat imports', async () => {
  let stored: Record<string, unknown> | undefined
  const payload = {
    find: async ({ where }: { where?: {
      id?: { equals?: unknown }, and?: Array<Record<string, { equals?: unknown }>>
    } }) => {
      const current = stored
      return { docs: current && (
        where?.id?.equals === current.id ||
        (where?.and?.some(item => item.slug?.equals === current.slug) &&
          where?.and?.some(item => item.event?.equals === current.event))
      ) ? [current] : [] }
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      stored = { ...data, id: 9001 }
      return stored
    },
    update: async ({ data }: { data: Record<string, unknown> }) => {
      stored = { ...stored, ...data }
      return stored
    },
  } as unknown as Payload
  const row = {
    id: 745, event: 8, slug: 'kalymnos-2026-09-26-to-2026-10-10',
    slugAliases: [], indexable: true,
  }
  const freshMaps: SeedIDMap = new Map([['events', new Map([['8', 80]])]])
  await expect(upsertRow(payload, 'event-dates', row, freshMaps, { forceCreateWhenMissingID: true })).resolves.toBe('created')
  expect(stored).toMatchObject({ event: 80, slug: row.slug, indexable: true })

  const repeatMaps: SeedIDMap = new Map([['events', new Map([['8', 80]])]])
  await expect(upsertRow(payload, 'event-dates', row, repeatMaps)).resolves.toBe('skipped')
  expect(repeatMaps.get('event-dates')?.get('745')).toBe(9001)
  expect(stored?.slug).toBe(row.slug)
})
