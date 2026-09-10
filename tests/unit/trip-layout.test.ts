import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Event } from '../../src/payload-types'
import { resolveTripDetail } from '../../src/lib/trip-detail'
import { defaultTripLayout } from '../../src/lib/trip-layout'

const body: NonNullable<Event['content']> = { root: { type: 'root', version: 1, direction: null, format: '', indent: 0,
  children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'Original source copy' }] }],
} }
const kinds = ['overview', 'learning', 'itinerary', 'requirements', 'equipment', 'audience', 'highlights', 'notes'] as const
const event = { id: 10, title: 'Source title', slug: 'test-only-layout',
  tripDetail: { sections: kinds.map(kind => ({ kind, heading: `${kind} source heading`, body })) },
} as Event

test('default composition provides exactly one rendering slot for every migrated content kind', () => {
  const before = structuredClone(event)
  const layout = defaultTripLayout(resolveTripDetail(event, []))
  for (const kind of kinds) {
    assert.equal(layout.filter(block => block.blockType === 'tripContent' && block.section === kind).length, 1)
  }
  assert.equal(layout[0].blockType, 'tripHero')
  assert.equal(layout.at(-1)?.blockType, 'tripBookingCTA')
  assert.deepEqual(event, before)
})

test('remaining source slot is conditional and retains both main prose and additionalInfo', () => {
  const remainingCount = (source: Event) => defaultTripLayout(resolveTripDetail(source, []))
    .filter(block => block.blockType === 'tripContent' && block.section === 'remaining').length
  assert.equal(remainingCount(event), 0)
  assert.equal(remainingCount({ ...event, content: body }), 1)
  assert.equal(remainingCount({ ...event, additionalInfo: [{ heading: 'Unmapped source heading', body }] }), 1)
})

test('partner and enabled demo content retain a rendering slot even with no leftover prose', () => {
  const cases: Partial<Event>[] = [
    { partner: 12 },
    { partnerHeadline: 'Original partner headline' },
    { partnerDescription: 'Original partner description' },
    { partnerBenefits: [{ text: 'Original partner benefit' }] },
    { demoEnabled: true, demoHeading: 'Original demo heading' },
    { partnerHeadline: 'Original partner headline', demoEnabled: true },
  ]
  for (const fields of cases) {
    const source = { ...event, ...fields }
    const before = structuredClone(source)
    const layout = defaultTripLayout(resolveTripDetail(source, []))
    assert.equal(layout.filter(block => block.blockType === 'tripContent' && block.section === 'remaining').length, 1)
    assert.deepEqual(source, before)
  }
  const disabledDemo = defaultTripLayout(resolveTripDetail({ ...event, demoEnabled: false, demoHeading: 'Disabled source demo' }, []))
  assert.equal(disabledDemo.some(block => block.blockType === 'tripContent' && block.section === 'remaining'), false)
})
