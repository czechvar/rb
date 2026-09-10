import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Airport, Difficulty, Event, EventDate, Guide, Location } from '../../src/payload-types'
import { remainingTripAdditionalInfo, remainingTripContent, resolveTripDetail } from '../../src/lib/trip-detail'

// Pure in-memory fixtures: no Payload startup, environment loading or database writes.
const paragraph = (text: string) => ({ type: 'paragraph', version: 1, children: [{ type: 'text', text, version: 1, format: 0 }] })
const heading = (text: string) => ({ ...paragraph(text), type: 'heading', tag: 'h2' })
const rich = (...children: NonNullable<Event['content']>['root']['children']): NonNullable<Event['content']> => ({
  root: { type: 'root', children, version: 1, direction: null, format: '', indent: 0 },
})
const event = (overrides: Partial<Event> = {}): Event => ({ id: 10, title: 'Source title', slug: 'test-only-trip-detail', ...overrides } as Event)
const date = (id: number, overrides: Partial<EventDate> = {}): EventDate => ({
  id, event: 10, dateFrom: `2999-10-${String(id).padStart(2, '0')}T00:00:00.000Z`, dateTo: '2999-10-30T00:00:00.000Z',
  price: 1150, vat: 0, currency: 'EUR', capacity: 4, active: true, updatedAt: '', createdAt: '', ...overrides,
})

test('selects upcoming own active dates, skips known sold-out default and never mutates input order', () => {
  const dates = [date(3), date(1, { remainingSeats: 0 }), date(2, { remainingSeats: 2 }), date(4, { active: false }), date(5, { event: 99 }), date(6, { dateFrom: '2000-01-01' })]
  const before = structuredClone(dates)
  const view = resolveTripDetail(event(), dates)
  assert.equal(view.selectedDate?.id, 2)
  assert.deepEqual(view.dates.map(item => item.id), [1, 2, 3])
  assert.equal(view.bookingHref, '/book/2')
  assert.equal(view.availabilityLabel, '2 spots available')
  assert.equal(view.priceLabel, '€1,150.00')
  assert.deepEqual(dates, before)
})

test('explicit sold-out selection is visible but cannot book; unknown availability is not capacity', () => {
  const dates = [date(1, { remainingSeats: 0 }), date(2)]
  const soldOut = resolveTripDetail(event(), dates, 1)
  assert.equal(soldOut.selectedDate?.id, 1)
  assert.equal(soldOut.bookingHref, null)
  assert.equal(soldOut.availabilityLabel, 'Sold out')
  const unknown = resolveTripDetail(event(), dates, 2)
  assert.equal(unknown.availabilityLabel, null)
  assert.equal(unknown.bookingHref, '/book/2')
  assert.deepEqual(unknown.facts.find(fact => fact.label === 'Group size'), { label: 'Group size', value: 'Maximum 4' })
  assert.equal(resolveTripDetail(event(), [date(1, { remainingSeats: -1 })]).bookingHref, null)
})

test('no dates means no fabricated price, dates, capacity or booking', () => {
  const view = resolveTripDetail(event(), [], 999)
  assert.equal(view.selectedDate, null)
  assert.equal(view.priceLabel, null)
  assert.equal(view.dateLabel, null)
  assert.equal(view.availabilityLabel, null)
  assert.equal(view.bookingHref, null)
  assert.deepEqual(view.facts, [])
})

test('zero capacity disables booking even without remainingSeats and invalid selections fall back', () => {
  const dates = [date(1, { capacity: 0 }), date(2)]
  const view = resolveTripDetail(event(), dates)
  assert.equal(view.selectedDate?.id, 2)
  const full = resolveTripDetail(event(), dates, 1)
  assert.equal(full.bookingHref, null)
  assert.equal(full.availabilityLabel, 'Sold out')
  assert.equal(resolveTripDetail(event(), dates, Number.NaN).selectedDate?.id, 2)
  assert.equal(resolveTripDetail(event(), dates, Infinity).selectedDate?.id, 2)
  assert.equal(resolveTripDetail(event(), dates, -1).selectedDate?.id, 2)
})

test('calendar span describes the date interval without inventing coaching duration', () => {
  const view = resolveTripDetail(event(), [date(1, { dateFrom: '2999-09-12T00:00:00Z', dateTo: '2999-09-19T00:00:00Z' })])
  assert.equal(view.dateSpanLabel, '8 calendar days')
  assert.equal(resolveTripDetail(event(), []).dateSpanLabel, null)
})

test('difficulty facts preserve actual catalogue names without inferring a grade range', () => {
  const difficulties = [{ id: 1, name: 'Beginner' }, { id: 2, name: 'Intermediate' }] as Difficulty[]
  const view = resolveTripDetail(event({ difficulties }), [])
  assert.deepEqual(view.facts, [{ label: 'Difficulty', value: 'Beginner, Intermediate' }])
})

test('malformed and backwards intervals are excluded instead of breaking the page or offering a booking', () => {
  const view = resolveTripDetail(event(), [date(1, { dateTo: 'invalid' }), date(2, { dateTo: '2000-01-01' })], 1)
  assert.deepEqual(view.dates, [])
  assert.equal(view.bookingHref, null)
  assert.equal(view.dateLabel, null)
})

test('date airports take precedence with deduplication and fallback retains Event transport wording', () => {
  const original = { id: 1, name: 'Original airport' } as Airport
  const current = { id: 2, name: 'Date airport' } as Airport
  const description = rich(paragraph('Original transport copy'))
  const source = event({ transport: { description, airports: [original] } })
  const view = resolveTripDetail(source, [date(1, { airportFrom: current, airportTo: current })])
  assert.deepEqual(view.transport, { description, airports: [current] })
  assert.deepEqual(resolveTripDetail(source, [date(1, { airportFrom: 99 })]).transport, source.transport)
  assert.deepEqual(source.transport?.airports, [original])
})

test('occurrence relationships override Event defaults without silently substituting unresolved ids', () => {
  const oldGuide = { id: 1, name: 'Original guide' } as Guide
  const newGuide = { id: 2, name: 'Date guide' } as Guide
  const oldLocation = { id: 1, name: 'Original venue' } as Location
  const newLocation = { id: 2, name: 'Date venue' } as Location
  const source = event({ coaches: [oldGuide], locations: [oldLocation] })
  const view = resolveTripDetail(source, [date(1, { guides: [newGuide], locations: [newLocation] })])
  assert.deepEqual(view.guides, [newGuide])
  assert.deepEqual(view.locations, [newLocation])
  assert.deepEqual(resolveTripDetail(source, [date(1)]).guides, [oldGuide])
  assert.deepEqual(resolveTripDetail(source, [date(1, { guides: [99] })]).guides, [])
})

test('logistics fall back per field and retain richtext inclusion overrides separately', () => {
  const description = rich(paragraph('Shared accommodation'))
  const food = rich(paragraph('Original food copy'))
  const override = rich(paragraph('Date accommodation with exact wording'))
  const included = rich(paragraph('Date inclusions'))
  const source = event({ accommodation: { description, cuisineHighlights: food, included: [{ text: 'Original included' }], notIncluded: [{ text: 'Original excluded' }] } })
  const before = structuredClone(source)
  const view = resolveTripDetail(source, [date(1, { logisticsOverrides: { accommodation: override, food: rich(paragraph('  ')), included } })])
  assert.deepEqual(view.accommodation?.description, override)
  assert.deepEqual(view.accommodation?.cuisineHighlights, food)
  assert.equal(view.accommodation?.included, null)
  assert.deepEqual(view.accommodation?.notIncluded, [{ text: 'Original excluded' }])
  assert.deepEqual(view.logisticsOverrides?.included, included)
  assert.equal(view.logisticsOverrides?.food, undefined)
  assert.deepEqual(source, before)
})

test('removes only exact migrated source heading/body slices and preserves unmapped prose and formatting', () => {
  const body = rich(paragraph('Original learning copy'))
  const section = { kind: 'learning' as const, heading: 'What you learn', body }
  const content = rich(heading('Source title'), paragraph('Keep introduction'), heading(section.heading), ...body.root.children, heading('Disputed requirements'), paragraph('Bring a trad rack'))
  const source = event({ content, tripDetail: { sections: [section] } })
  const before = structuredClone(source)
  const view = resolveTripDetail(source, [])
  assert.deepEqual(view.remainingContent?.root.children, [content.root.children[0], content.root.children[1], content.root.children[4], content.root.children[5]])
  assert.deepEqual(source, before)
  assert.deepEqual(view.sections, [section])
  const changed = { ...section, body: rich(paragraph('Editor revised learning copy')) }
  assert.deepEqual(resolveTripDetail(event({ content, tripDetail: { sections: [changed] } }), []).remainingContent, content)
  assert.equal(resolveTripDetail(event({ content: rich(heading(section.heading), ...body.root.children), tripDetail: { sections: [section] } }), []).remainingContent, null)
})

test('preserves additionalInfo unless heading and complete richtext exactly match a rendered section', () => {
  const body = rich(paragraph('Exact gear text'))
  const info = { heading: 'What to bring', body }
  const section = { ...info, kind: 'equipment' as const }
  const source = event({ additionalInfo: [info, { heading: 'Unmapped', body }], tripDetail: { sections: [section] } })
  assert.deepEqual(resolveTripDetail(source, []).remainingAdditionalInfo, [{ heading: 'Unmapped', body }])
  assert.equal(source.additionalInfo?.length, 2)
})

test('equal text with different formatting is retained, and empty sections never remove source', () => {
  const body = rich(paragraph('Keep bold source'))
  const formatted = rich({ ...paragraph('Keep bold source'), children: [{ type: 'text', text: 'Keep bold source', format: 1, version: 1 }] })
  const content = rich(heading('Overview'), ...formatted.root.children)
  const view = resolveTripDetail(event({ content, tripDetail: { sections: [{ kind: 'overview', heading: 'Overview', body }] } }), [])
  assert.deepEqual(view.remainingContent, content)
  const blank = { kind: 'overview' as const, heading: 'Overview', body: rich(paragraph('')) }
  const emptyView = resolveTripDetail(event({ content, tripDetail: { sections: [blank] } }), [])
  assert.deepEqual(emptyView.sections, [])
  assert.deepEqual(emptyView.remainingContent, content)
})

test('custom layout removes only source slices whose section kinds it actually renders', () => {
  const overview = { kind: 'overview' as const, heading: 'Overview', body: rich(paragraph('Exact overview')) }
  const learning = { kind: 'learning' as const, heading: 'What you learn', body: rich(paragraph('Exact learning')) }
  const content = rich(heading(overview.heading), ...overview.body.root.children,
    heading(learning.heading), ...learning.body.root.children, paragraph('Unmapped conclusion'))
  const before = structuredClone(content)
  const remainder = remainingTripContent(content, [overview])
  assert.deepEqual(remainder, rich(heading(learning.heading), ...learning.body.root.children, paragraph('Unmapped conclusion')))
  assert.deepEqual(remainingTripContent(content, []), content)
  assert.deepEqual(remainingTripContent(content, [overview, learning]), rich(paragraph('Unmapped conclusion')))
  assert.deepEqual(content, before)
})

test('custom layout preserves additionalInfo for migrated sections omitted from its composition', () => {
  const equipment = { kind: 'equipment' as const, heading: 'What to bring', body: rich(paragraph('Exact equipment')) }
  const notes = { kind: 'notes' as const, heading: 'Need to know', body: rich(paragraph('Exact notes')) }
  const source = event({ additionalInfo: [
    { heading: equipment.heading, body: equipment.body },
    { heading: notes.heading, body: notes.body },
    { heading: 'Other details', body: rich(paragraph('Unmapped details')) },
  ], tripDetail: { sections: [equipment, notes] } })
  const before = structuredClone(source)
  assert.deepEqual(remainingTripAdditionalInfo(source, [equipment]), source.additionalInfo?.slice(1))
  assert.deepEqual(remainingTripAdditionalInfo(source, []), source.additionalInfo)
  assert.deepEqual(remainingTripAdditionalInfo(source, [equipment, notes]), source.additionalInfo?.slice(2))
  assert.deepEqual(source, before)
})
