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
