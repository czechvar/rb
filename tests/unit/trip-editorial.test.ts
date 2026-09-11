import { describe, expect, it } from 'vitest'
import type { Field } from 'payload'
import { tripEditorialField } from '@/fields/tripEditorial'
import type { Event } from '@/payload-types'
import { applyTripEditorial, headingText, resolveSectionCopy, resolveTripEditorial } from '@/lib/trip-editorial'

describe('trip occurrence editorial copy', () => {
  it('inherits untouched fields and scopes replacements to the selected occurrence', () => {
    const event = { id: 8, title: 'Sport climbing', editorial: { sections: [{ key: 'gallery' as const, eyebrow: 'Trip gallery', heading: 'Shared' }] } } as Event
    const selected = applyTripEditorial(event, { editorial: { content: { title: 'Kalymnos' }, sections: [{ key: 'gallery', heading: 'Greek rock' }] } })
    expect(selected.title).toBe('Kalymnos')
    expect(resolveSectionCopy('gallery', selected.editorial)).toMatchObject({ eyebrow: 'Trip gallery', heading: 'Greek rock' })
    expect(applyTripEditorial(event).title).toBe('Sport climbing')
    expect(event.title).toBe('Sport climbing')
  })
  it('supports explicit clears, reset to inheritance, and custom block precedence', () => {
    const base = { sections: [{ key: 'gallery' as const, heading: 'Default', eyebrow: 'Shared' }] }
    const cleared = resolveTripEditorial(base, { sections: [{ key: 'gallery', clearHeading: true, clearEyebrow: true }] })
    expect(resolveSectionCopy('gallery', cleared)).toMatchObject({ heading: '', eyebrow: '', headingParts: [] })
    expect(resolveSectionCopy('gallery', cleared, {}, { heading: 'Custom layout' }).heading).toBe('Custom layout')
    expect(resolveSectionCopy('gallery', resolveTripEditorial(base, { sections: [] })).heading).toBe('Default')
  })
  it('replaces heading fragments together and preserves partial-word accents and spaces', () => {
    const parts = [{ text: 'TU' }, { text: 'FAS', accent: true }, { text: ', POCKETS' }, { text: '& PURE GRIT', breakBefore: true }]
    expect(headingText(parts)).toBe('TUFAS, POCKETS\n& PURE GRIT')
    const result = resolveTripEditorial({ sections: [{ key: 'gallery', headingParts: parts }] }, { sections: [{ key: 'gallery', heading: 'Plain replacement' }] })
    expect(resolveSectionCopy('gallery', result).headingParts).toBeUndefined()
  })
  it('preserves clearing across empty Payload checkbox values and allows explicit replacement', () => {
    const base = { sections: [{ key: 'gallery' as const, clearHeading: true }], hero: { clearHashtag: true } }
    const cleared = resolveTripEditorial(base, { sections: [{ key: 'gallery', heading: null, headingParts: [], clearHeading: false }], hero: { hashtag: null, clearHashtag: false } })
    expect(resolveSectionCopy('gallery', cleared, { heading: 'Legacy heading' }).heading).toBe('')
    expect(cleared.hero?.hashtag).toBe('')
    expect(resolveTripEditorial(base, { hero: { hashtag: '#Replacement' } }).hero?.hashtag).toBe('#Replacement')
  })
  it('inherits hidden sections from empty CMS rows and requires explicit show to reveal them', () => {
    const shared = { sections: [{ key: 'gallery' as const, visibility: 'hide' as const }] }
    const defaults = resolveTripEditorial(shared, { sections: [{ key: 'gallery', visibility: 'inherit', hide: false, heading: null, clearHeading: false }] })
    expect(resolveSectionCopy('gallery', defaults).hide).toBe(true)
    const visible = resolveTripEditorial(shared, { sections: [{ key: 'gallery', visibility: 'show' }] })
    expect(resolveSectionCopy('gallery', visible).hide).toBe(false)
  })
  it('does not mutate source editorial and cannot override commercial fields through malformed content', () => {
    const editorial = { sections: [{ key: 'gallery' as const, heading: 'Original' }] }
    const snapshot = JSON.stringify(editorial)
    resolveTripEditorial(editorial)
    expect(JSON.stringify(editorial)).toBe(snapshot)
    const event = { id: 8, title: 'Original', locations: [12], tripDetail: { sections: [{ kind: 'overview', heading: 'Old', body: {} }] }, additionalInfo: [{ heading: 'Old' }] } as unknown as Event
    const applied = applyTripEditorial(event, { editorial: { content: { title: 'Edited', locations: [999] } as unknown as { title: string }, clearContentFields: ['additionalInfo', 'tripDetail.sections'] } })
    expect(applied.locations).toEqual([12])
    expect(applied.additionalInfo).toBeNull()
    expect(applied.tripDetail?.sections).toEqual([])
    expect(event.additionalInfo).toHaveLength(1)
    expect(event.tripDetail?.sections).toHaveLength(1)
  })
  it('omits nested relationship controls from editorial schema without renaming existing arrays', () => {
    const fields: Field[] = [
      { name: 'itinerary', type: 'group', fields: [{ name: 'days', type: 'array', fields: [
        { name: 'destinationName', type: 'text', required: true }, { name: 'image', type: 'upload', relationTo: 'media' },
      ] }] },
      { name: 'transport', type: 'group', fields: [{ name: 'description', type: 'richText' }, { name: 'airports', type: 'relationship', relationTo: 'airports', hasMany: true }] },
    ]
    const flatten = (field: Field, parent = ''): [string, unknown][] => {
      const path = 'name' in field ? `${parent}.${field.name}` : parent
      return [[path, 'dbName' in field ? field.dbName : null], ...('fields' in field ? field.fields.flatMap(child => flatten(child, path)) : [])]
    }
    const paths = Object.fromEntries(flatten(tripEditorialField('event', fields)))
    const reordered = Object.fromEntries(flatten(tripEditorialField('event', [...fields].reverse())))
    expect(Object.keys(paths)).not.toContain('.editorial.content.itinerary.days.image')
    expect(Object.keys(paths)).not.toContain('.editorial.content.transport.airports')
    expect(paths['.editorial.content.itinerary.days']).toBe(reordered['.editorial.content.itinerary.days'])
    expect(Object.keys(paths)).toContain('.editorial.content.itinerary.days.destinationName')
  })
  it('rejects forged nested relationships and retains original day media and transport airports', () => {
    const event = { id: 8, title: 'Original', transport: { airports: [12] }, itinerary: { days: [
      { id: 'source-day', destinationName: 'Kalymnos', image: 'original-image' },
      { id: 'second-day', destinationName: 'Telendos', image: 'second-image' },
    ] } } as Event
    const applied = applyTripEditorial(event, { editorial: { content: {
      transport: { airports: [999] }, itinerary: { days: [
        { id: 'source-day', destinationName: 'Edited heading', image: 'forged-image' },
        { destinationName: 'Telendos', image: 'forged-image' },
        { destinationName: 'Unmatched', image: 'forged-image' },
      ] },
    } } })
    expect(applied.transport?.airports).toEqual([12])
    expect(applied.itinerary?.days?.map(day => day.image)).toEqual(['original-image', 'second-image', undefined])
    expect(applyTripEditorial(event, { editorial: { clearContentFields: ['transport'] } }).transport?.airports).toEqual([12])
    expect(event.itinerary?.days?.[0].destinationName).toBe('Kalymnos')
  })
  it('replaces arrays without concatenating and inherits null CMS values', () => {
    const result = resolveTripEditorial({ dailySchedule: [{ time: '09:00', title: 'Original' }], hero: { description: 'Description' } }, { dailySchedule: [{ time: '10:00', title: 'Replacement' }], hero: { description: null } })
    expect(result.dailySchedule).toEqual([{ time: '10:00', title: 'Replacement' }])
    expect(result.hero?.description).toBe('Description')
  })
})
