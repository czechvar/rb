import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { editorialContentKeys, tripSectionKeys } from '@/fields/tripEditorial'
import { normalizeActionHref } from '@/lib/safe-url'

const directory = path.resolve('scripts/data-import/trip-editorial')
const manifests = ['standalone', 'espana', 'rockroad'].flatMap((batch) =>
  JSON.parse(fs.readFileSync(path.join(directory, 'manifests', `${batch}.json`), 'utf8')),
)
const references = ['standalone', 'espana', 'rockroad'].flatMap((batch) =>
  JSON.parse(fs.readFileSync(path.join(directory, 'references', `${batch}.json`), 'utf8')),
)
// Audited booking-identity allowlist; similarly named catalogue Events are deliberately excluded.
const targets: Record<number, number[]> = {
  8: [714, 704, 775, 717, 707],
  9: [684, 687, 683, 689, 682, 685, 688, 681, 686],
  17: [749, 751, 748, 750, 747],
  49: [674],
  4: [676],
  20: [740],
  18: [774],
  62: [701],
  55: [758],
}
const tokens = new Set([
  'price',
  'weeklyPrice',
  'durationDays',
  'durationWeeks',
  'dates',
  'country',
  'capacity',
  'location',
  'coaches',
])
const nonempty = (value: unknown): boolean =>
  Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== ''
const strings = (value: unknown): string[] =>
  typeof value === 'string'
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(strings)
      : value && typeof value === 'object'
        ? Object.values(value).flatMap(strings)
        : []

it('covers exactly the 25 audited occurrences once, excluding the accepted Kalymnos pilot', () => {
  const ids = manifests.map((manifest) => manifest.target.eventDateId)
  expect(ids).toHaveLength(25)
  expect(new Set(ids).size).toBe(25)
  expect(ids).not.toContain(745)
  expect([...ids].sort()).toEqual(Object.values(targets).flat().sort())
})

describe.each(manifests)('editorial manifest $target.eventDateId', (manifest) => {
  const editorial = manifest.editorial
  it('retains its audited Event identity and source reference', () => {
    expect(targets[manifest.target.eventId]).toContain(manifest.target.eventDateId)
    const reference = references.find((row) => row.sourceFile === manifest.sourceFile)
    expect(reference).toBeDefined()
    expect(reference.target).toEqual(manifest.target)
    expect(Date.parse(manifest.target.dateTo)).toBeGreaterThan(Date.parse(manifest.target.dateFrom))
    expect(manifest.provenance).toBeTruthy()
  })

  it('does not clear authored content or expose relationship overrides', () => {
    for (const key of editorial.clearContentFields ?? []) {
      expect([...editorialContentKeys, 'tripDetail.sections']).toContain(key)
      const value =
        key === 'tripDetail.sections'
          ? editorial.content?.tripDetail?.sections
          : editorial.content?.[key]
      expect(nonempty(value), `Cleared field ${key} also contains authored copy`).toBe(false)
    }
    for (const key of Object.keys(editorial.content ?? {}))
      expect(editorialContentKeys).toContain(key)
    expect(editorial.content?.transport?.airports).toBeUndefined()
    for (const day of editorial.content?.itinerary?.days ?? []) expect(day.image).toBeUndefined()
    const guides = (editorial.coachProfiles ?? []).map(
      (profile: { guide: number }) => profile.guide,
    )
    expect(new Set(guides).size).toBe(guides.length)
    expect(guides.every((id: number) => Number.isInteger(id) && id > 0)).toBe(true)
  })

  it('preserves safe ordered heading segments and supported tokens', () => {
    const sections = editorial.sections ?? []
    expect(new Set(sections.map((section: { key: string }) => section.key)).size).toBe(
      sections.length,
    )
    for (const section of sections) expect(tripSectionKeys).toContain(section.key)
    for (const parts of [
      editorial.hero?.titleParts,
      ...sections.map((section: { headingParts: unknown }) => section.headingParts),
    ].filter(Boolean)) {
      for (const part of parts) {
        expect(typeof part.text).toBe('string')
        expect(part.text.length).toBeGreaterThan(0)
        expect(part.text).not.toMatch(/<\/?[a-z][^>]*>/i)
        for (const key of Object.keys(part))
          expect(['text', 'accent', 'breakBefore', 'id']).toContain(key)
        for (const key of ['accent', 'breakBefore'])
          if (part[key] != null) expect(typeof part[key]).toBe('boolean')
      }
    }
    for (const text of strings(editorial)) {
      for (const match of text.matchAll(/\{([^{}]+)\}/g))
        expect(tokens.has(match[1]), `Unknown token ${match[1]}`).toBe(true)
    }
  })

  it('keeps companion cell positions aligned and navigation safe', () => {
    const companion = editorial.companion
    for (const row of companion?.rows ?? [])
      expect(row.cells).toHaveLength(companion.columns.length)
    for (const link of companion?.links ?? [])
      expect(normalizeActionHref(link.href)).toBe(link.href)
    for (const review of editorial.previewReviews ?? []) {
      expect(review.name).toMatch(/design preview/i)
      expect(review.context).toMatch(/unverified/i)
    }
  })
})
