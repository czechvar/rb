import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Event, EventDate } from '@/payload-types'
import { resolveTripDetail } from '@/lib/trip-detail'
import { tripCommercialText } from '@/lib/trip-summary'
import { TripContentBlock } from '@/components/blocks/TripContentBlocks'
import { BookingCTA } from '@/components/sections/BookingCTA'

vi.mock('next/link', () => ({ default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a> }))
const event = { id: 8, state: 'published', createdAt: '', updatedAt: '', title: 'Kalymnos', slug: 'test-commercial', tripDetail: { locationDescriptor: 'Greek limestone', sections: [{ kind: 'overview', heading: 'Overview', body: { root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'Course description', format: 0, detail: 0, mode: 'normal', style: '' }] }] } } }] }, comparison: { heading: 'Which format?', leftHeading: 'One week {weeklyPrice}', rightHeading: 'Two weeks {price}', rows: [{ label: 'Coaching', left: '5 days', right: '10 days' }] } } as Event
const occurrence = (id: number, days: 7 | 14, price: number): EventDate => ({ id, event: 8, dateFrom: '2999-09-01T00:00:00.000Z', dateTo: `2999-09-${days === 7 ? '08' : '15'}T00:00:00.000Z`, price, currency: 'EUR', vat: 0, active: true, capacity: 8, remainingSeats: 8, locations: [12], updatedAt: '', createdAt: '', editorial: days === 14 ? { overviewFacts: [{ label: 'Price', value: '{price}', description: 'Or {weeklyPrice} per week' }, { label: 'Group size', value: '5–{capacity}' }], booking: { primaryLabel: 'Book now — {price}' }, dailySchedule: [{ time: '08:00', title: 'Breakfast' }] } : undefined })

describe('authored commercial placeholders', () => {
  it.each([[2200, 1200, '€2,200', '€1,200'], [2500, 1400, '€2,500', '€1,400']] as const)('projects actual selected and weekly prices %i / %i in every target slot', (price, weeklyPrice, formatted, weeklyFormatted) => {
    const trip = resolveTripDetail(event, [occurrence(745, 14, price), occurrence(746, 7, weeklyPrice)], 745)
    expect(tripCommercialText(trip, '{price}; {weeklyPrice}; {durationDays}; {capacity}')).toBe(`${formatted}; ${weeklyFormatted}; 14; 8`)
    const ctx = { event: trip.event, trip }
    const overview = renderToStaticMarkup(TripContentBlock({ section: 'overview', variant: 'overview' }, ctx))
    const programme = renderToStaticMarkup(TripContentBlock({ section: 'itinerary', variant: 'timeline' }, ctx))
    const booking = renderToStaticMarkup(<BookingCTA event={trip.event} trip={trip} variant="image" />)
    for (const html of [overview, programme, booking]) {
      expect(html).toContain(formatted)
      expect(html).toContain(weeklyFormatted)
      expect(html).not.toMatch(/\{(?:price|weeklyPrice|durationDays|capacity)\}/)
      expect(html).not.toContain('€1,890')
    }
    expect(booking).toContain('href="/book/745"')
  })
  it('uses inquiry when no matching weekly date exists and never interprets ordinary prose as tokens', () => {
    const trip = resolveTripDetail(event, [occurrence(745, 14, 2200)], 745)
    expect(tripCommercialText(trip, 'Or {weeklyPrice} per week')).toBe('Or Enquire per week')
    expect(tripCommercialText(trip, 'Original €1,890 prose')).toBe('Original €1,890 prose')
    expect(tripCommercialText(trip, undefined)).toBeUndefined()
    const unavailable = resolveTripDetail(event, [])
    expect(tripCommercialText(unavailable, '{price} / {capacity}')).toBe('Enquire / Enquire')
  })
  it('retains sold-out inquiry behavior even when a booking label has a price token', () => {
    const sold = occurrence(745, 14, 2300)
    sold.remainingSeats = 0
    const trip = resolveTripDetail(event, [sold], 745)
    const html = renderToStaticMarkup(<BookingCTA event={trip.event} trip={trip} variant="image" />)
    expect(html).toContain('mailto:info@rockbusters.net')
    expect(html).not.toContain('href="/book/')
    expect(html).not.toContain('{price}')
    expect(html).not.toContain('Book now')
  })
})
