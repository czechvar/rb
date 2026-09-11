import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Event, EventDate, Guide, Location } from '@/payload-types'
import { tripSummary } from '@/lib/trip-summary'
import { resolveTripDetail } from '@/lib/trip-detail'
import { DetailHero } from '@/components/sections/DetailHero'
import { EventDatesList } from '@/components/sections/EventDatesList'
import { BookingCTA } from '@/components/sections/BookingCTA'

// Keep server rendering in memory: never import the capacity module or start Payload.
vi.mock('@/components/trip/DateRowBookButton', () => ({
  DateRowBookButton: ({ eventDateId }: { eventDateId: number }) => <span data-book-button={eventDateId} />,
}))
vi.mock('next/link', () => ({ default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a> }))
vi.mock('next/image', () => ({
  default: ({ fill: _fill, priority: _priority, ...props }: React.ComponentProps<'img'> & { fill?: boolean; priority?: boolean }) => React.createElement('img', props),
}))

const event = { id: 10, title: 'Original trip: original subtitle', slug: 'in-memory-only', shortDescription: 'Original description.' } as Event
const date = (id: number, overrides: Partial<EventDate> = {}): EventDate => ({
  id, event: 10, dateFrom: '2999-10-12T00:00:00.000Z', dateTo: '2999-10-19T00:00:00.000Z',
  price: 1150, vat: 0, currency: 'EUR', capacity: 9, remainingSeats: 2, active: true,
  updatedAt: '', createdAt: '', ...overrides,
})

function renderRows(items: EventDate[], selectedId?: number) {
  return renderToStaticMarkup(<EventDatesList items={items} variant="rows" eventSlug={event.slug} selectedId={selectedId} />)
}

describe('trip booking presentation', () => {
  it('shows actual remaining seats instead of capacity and preserves the selected date URL', () => {
    const html = renderRows([date(1), date(2, { remainingSeats: 1 })], 2)
    expect(html).toContain('2 spots available')
    expect(html).toContain('1 spot available')
    expect(html).not.toContain('9 spots available')
    expect(html).toContain('href="/trips/in-memory-only?date=2#dates" aria-current="true"')
    expect(html).toContain('href="/book/2"')
    expect(html).toContain('8 calendar days')
    expect(html.match(/data-selected="true"/g)).toHaveLength(1)
  })

  it('disables sold-out, unavailable and zero-capacity rows without advertising invented availability', () => {
    const html = renderRows([date(1, { remainingSeats: 0 }), date(2, { active: false }), date(3, { capacity: 0, remainingSeats: null })])
    expect(html).toContain('Sold out')
    expect(html).toContain('Unavailable')
    expect(html).not.toContain('href="/book/')
    expect(html).not.toContain('0 spots available')
    const unknown = renderRows([date(4, { remainingSeats: null })])
    expect(unknown).not.toContain('spots available')
  })

  it('omits an empty dates section and preserves the existing default date-card path', () => {
    expect(renderRows([])).toBe('')
    const html = renderToStaticMarkup(<EventDatesList items={[date(1)]} />)
    expect(html).toContain('data-book-button="1"')
    expect(html).not.toContain('?date=')
    expect(html).not.toContain('calendar days')
  })

  it('uses one selected date for hero summary and closing CTA across variants', () => {
    const trip = resolveTripDetail(event, [date(1), date(2, { price: 300 })], 2)
    for (const variant of ['default', 'editorial'] as const) {
      const html = renderToStaticMarkup(<DetailHero event={event} trip={trip} variant={variant} />)
      expect(html.replace(/<[^>]*>/g, '')).toContain(event.title)
      expect(html).toContain('€300.00')
      expect(html).toContain('href="/book/2"')
      expect(html).not.toContain('/book/1')
      expect(html).not.toMatch(/Rodellar|Klemen|May 2026|950/)
      expect(html).not.toContain('href="#overview"')
      expect(html).toContain('href="/trips/in-memory-only/dates"')
      // One semantic title and one summary serve desktop and mobile; no duplicated hidden content.
      expect(html.match(/<h1 /g)).toHaveLength(1)
      expect(html.match(/<aside /g)).toHaveLength(1)
    }
    for (const variant of ['default', 'image'] as const) {
      const html = renderToStaticMarkup(<BookingCTA event={event} trip={trip} variant={variant} />)
      expect(html).toContain('href="/book/2"')
      expect(html).toContain('€300.00')
    }
  })

  it('renders contact actions for absent dates and explicit sold-out selection', () => {
    for (const dates of [[], [date(1, { remainingSeats: 0 })], [date(1, { capacity: 0, remainingSeats: null })]]) {
      const trip = resolveTripDetail(event, dates)
      const html = renderToStaticMarkup(<><DetailHero event={event} trip={trip} variant="editorial" /><BookingCTA event={event} trip={trip} variant="image" /></>)
      expect(html).toContain('href="mailto:info@rockbusters.net"')
      expect(html).not.toContain('href="/book/')
      if (!dates.length) expect(html).not.toContain('per person')
    }
  })


  it('offers a secondary inquiry only beside a bookable image CTA and never duplicates an unavailable action', () => {
    const bookable = resolveTripDetail(event, [date(1)])
    const image = renderToStaticMarkup(<BookingCTA event={event} trip={bookable} variant="image" />)
    expect(image.match(/href="mailto:info@rockbusters.net"/g)).toHaveLength(1)
    expect(image.match(/href="\/book\/1"/g)).toHaveLength(1)
    const defaultHtml = renderToStaticMarkup(<BookingCTA event={event} trip={bookable} />)
    expect(defaultHtml).not.toContain('mailto:')
    for (const dates of [[], [date(1, { remainingSeats: 0 })]]) {
      const unavailable = renderToStaticMarkup(<BookingCTA event={event} trip={resolveTripDetail(event, dates)} variant="image" />)
      expect(unavailable.match(/href="mailto:info@rockbusters.net"/g)).toHaveLength(1)
      expect(unavailable).not.toContain('href="/book/')
    }
  })


  it('shows source metadata and destination-style title emphasis without rewriting the title or description', () => {
    const trip = resolveTripDetail(event, [date(1)])
    trip.locations = [{ id: 1, country: 'Czech Republic' }, { id: 2, country: 'Czech Republic' }] as Location[]
    trip.guides = [{ id: 1, name: 'Selected Guide' }] as Guide[]
    trip.facts.push({ label: 'Difficulty', value: 'Original difficulty' })
    const html = renderToStaticMarkup(<DetailHero event={event} trip={trip} variant="editorial" />)
    const title = html.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1] ?? ''
    expect(title.replace(/<[^>]*>/g, '')).toBe(event.title)
    expect(title).toContain('heroAccentWord')
    expect(html).toContain('Czech Republic')
    expect(html).toContain('With <strong>Selected Guide</strong>')
    expect(html).toContain('Original difficulty')
    expect(html).toContain(event.shortDescription!)
    const missing = renderToStaticMarkup(<DetailHero event={{ ...event, title: 'Title without colon' }} variant="editorial" />)
    expect(missing).not.toContain('heroAccentWord')
    expect(missing).not.toContain('With ')
  })

  it('retains default CTA routing while the image variant reuses only the existing photo', () => {
    expect(renderToStaticMarkup(<BookingCTA event={event} />)).toContain('href="/trips/in-memory-only/dates"')
    const withPhoto = { ...event, mainPicture: { id: 'photo-fixture', url: '/original-photo.jpg', alt: 'Original photo', createdAt: '', updatedAt: '' } } as Event
    expect(renderToStaticMarkup(<BookingCTA event={withPhoto} variant="image" />)).toContain('src="/original-photo.jpg"')
    expect(renderToStaticMarkup(<BookingCTA event={withPhoto} />)).not.toContain('<img')
  })
})


describe('editorial trip summaries', () => {
  const authored = { ...event, tripDetail: { locationDescriptor: 'Greek Limestone', gradeRange: '5+–7c', leadRequirement: 'Lead 5+ outdoor / 6a indoor', minimumParticipants: 3, travelNote: 'Fly into Kos — we handle the rest' } } as Event
  const weekly = date(1, { price: 1090, locations: [1] })
  const fortnight = date(2, { dateTo: '2999-10-26T00:00:00.000Z', price: 1890, locations: [1] })
  it('separates editorial minimum/grade from capacity and follows the chosen occurrence', () => {
    const two = tripSummary(resolveTripDetail(authored, [weekly, fortnight], 2))!
    expect(two.primaryPrice).toBe('€1,890 / 2 weeks')
    expect(two.secondaryPrice).toBe('Or €1,090 per week individually')
    expect(two.rows.find(row => row.label === 'Duration')?.value).toBe('14 Days (2 Weeks)')
    expect(two.strip.map(row => row.label)).toEqual(['Greek Limestone', '14 Days', 'Grade', 'Min. Participants', 'Price (2 Weeks)'])
    expect(two.strip.find(row => row.label === 'Min. Participants')?.value).toBe('3')
    const one = tripSummary(resolveTripDetail(authored, [weekly, fortnight], 1))!
    expect(one.primaryPrice).toBe('€1,090 / 1 week')
    expect(one.secondaryPrice).toBeUndefined()
    expect(one.rows.find(row => row.label === 'Duration')?.value).toBe('7 Days (1 Week)')
  })
  it('does not borrow a weekly price from another venue or hide sold-out status', () => {
    const trip = resolveTripDetail(authored, [{ ...weekly, locations: [2] }, { ...fortnight, remainingSeats: 0 }], 2)
    expect(tripSummary(trip)?.secondaryPrice).toBeUndefined()
    expect(tripSummary(trip)?.callout).toBe('Sold out')
    expect(tripSummary(resolveTripDetail(event, [weekly]))).toBeNull()
    expect(tripSummary(resolveTripDetail(authored, []))).toBeNull()
  })
})
