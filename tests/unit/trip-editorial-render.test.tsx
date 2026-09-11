import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Event, EventDate } from '@/payload-types'
import { GalleryBlock } from '@/components/blocks/GalleryBlock'
import { TripContentBlock } from '@/components/blocks/TripContentBlocks'
import { resolveTripDetail } from '@/lib/trip-detail'
import { tripCopy } from '@/components/blocks/trip-copy'
import accentStyles from '@/components/ui/EditorialHeading.module.css'

vi.mock('next/image', () => ({ default: ({ fill: _fill, ...props }: React.ComponentProps<'img'> & { fill?: boolean }) => React.createElement('img', props) }))
vi.mock('next/link', () => ({ default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a> }))

// In-memory fixtures only. Freeze before both real occurrence dates to test selection.
const event = {
  id: 8, title: 'Sport climbing', slug: 'sport-climbing',
  gallery: [{ id: 'original', url: '/original.jpg', alt: 'Original image', createdAt: '', updatedAt: '' }],
  audienceCards: [{ heading: 'Shared audience', body: 'Shared audience description' }],
} as Event
const date = (id: number, from: string, to: string, editorial?: EventDate['editorial']): EventDate => ({
  id, event: 8, dateFrom: from, dateTo: to, price: 1890, currency: 'EUR', vat: 0, capacity: 8, remainingSeats: 8, active: true, createdAt: '', updatedAt: '', editorial,
})
const kalymnos = date(745, '2026-09-26', '2026-10-10', {
  content: { title: 'Kalymnos, Greece', audienceCards: [{ heading: 'Gym climbers', body: 'Ready for Greek limestone' }], comparison: { heading: 'Which format?', leftHeading: 'One week', rightHeading: 'Two weeks', rows: [{ label: 'Coaching days', left: '5', right: '10' }] } },
  sections: [
    { key: 'gallery', eyebrow: 'Real rock, real Kalymnos', headingParts: [{ text: 'TU' }, { text: 'FAS', accent: true }, { text: ', POCKETS' }, { text: '& PURE GRIT', breakBefore: true }] },
    { key: 'audience', heading: 'Built for the gym-to-crag gap' },
    { key: 'itinerary', heading: 'A typical day' },
  ],
  dailySchedule: [{ time: '08:00', title: 'Coffee and breakfast', description: 'Plan the climbing day' }],
})
const other = date(717, '2027-03-20', '2027-04-03')
const context = (selectedId: number, selected = kalymnos) => {
  const trip = resolveTripDetail(event, [selected, other], selectedId)
  return { event: trip.event, trip }
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-11T12:00:00Z')) })
afterEach(() => vi.useRealTimers())

describe('occurrence editorial rendering', () => {
  it('preserves fallback headings when generated block props omit copy', () => {
    expect(tripCopy(undefined, 'team', { __defaultCopy: true, variant: 'cards' }, { heading: 'Meet your guides', eyebrow: 'Team' })).toMatchObject({ heading: 'Meet your guides', eyebrow: 'Team' })
  })
  it('renders gallery partial-word accents and line breaks while retaining original imagery', () => {
    const html = renderToStaticMarkup(<GalleryBlock blockType="gallery" source="currentEvent" variant="featureLead" context={context(745)} />)
    expect(html).toContain(`TU<span class="${accentStyles.accent}">FAS</span>, POCKETS<br/>`)
    expect(html).toContain('Real rock, real Kalymnos')
    expect(html).toContain('Original image')
  })
  it('changes audience copy only for the actual selected occurrence', () => {
    const selected = context(745)
    const alternate = context(717)
    expect(selected.trip.selectedDate?.id).toBe(745)
    expect(alternate.trip.selectedDate?.id).toBe(717)
    const authored = renderToStaticMarkup(TripContentBlock({ section: 'audience' }, selected))
    expect(authored).toContain('Built for the gym-to-crag gap')
    expect(authored).toContain('Gym climbers')
    expect(authored).not.toContain('Shared audience')
    const inherited = renderToStaticMarkup(TripContentBlock({ section: 'audience' }, alternate))
    expect(inherited).toContain('Shared audience')
    expect(inherited).not.toContain('Gym climbers')
    expect(alternate.trip.event.title).toBe('Sport climbing')
    expect(event.title).toBe('Sport climbing')
  })
  it('renders the daily timetable beside its comparison and preserves booking selection', () => {
    const ctx = context(745)
    const html = renderToStaticMarkup(TripContentBlock({ section: 'itinerary', variant: 'timeline' }, ctx))
    expect(html).toContain('A typical day')
    expect(html).toContain('08:00')
    expect(html).toContain('Coffee and breakfast')
    expect(html).toContain('Plan the climbing day')
    expect(html).toContain('Which format?')
    expect(html).toContain('Coaching days')
    expect(ctx.trip.bookingHref).toBe('/book/745')
  })
  it('honours section hiding without deleting data and keeps custom layout headings authoritative', () => {
    const hidden = { ...kalymnos, editorial: { ...kalymnos.editorial, sections: [{ key: 'gallery' as const, visibility: 'hide' as const }, { key: 'audience' as const, visibility: 'hide' as const }] } }
    const ctx = context(745, hidden)
    expect(renderToStaticMarkup(<GalleryBlock blockType="gallery" source="currentEvent" variant="featureLead" context={ctx} />)).toBe('')
    expect(renderToStaticMarkup(TripContentBlock({ section: 'audience' }, ctx))).toBe('')
    expect(ctx.event.gallery).toHaveLength(1)
    const custom = renderToStaticMarkup(<GalleryBlock blockType="gallery" source="currentEvent" variant="featureLead" heading="Custom layout heading" context={context(745)} />)
    expect(custom).toContain('Custom layout heading')
    expect(custom).not.toContain('PURE GRIT')
  })
})
