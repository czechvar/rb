import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Event, EventDate } from '@/payload-types'
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
      expect(html).toContain(event.title)
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

  it('retains default CTA routing while the image variant reuses only the existing photo', () => {
    expect(renderToStaticMarkup(<BookingCTA event={event} />)).toContain('href="/trips/in-memory-only/dates"')
    const withPhoto = { ...event, mainPicture: { id: 'photo-fixture', url: '/original-photo.jpg', alt: 'Original photo', createdAt: '', updatedAt: '' } } as Event
    expect(renderToStaticMarkup(<BookingCTA event={withPhoto} variant="image" />)).toContain('src="/original-photo.jpg"')
    expect(renderToStaticMarkup(<BookingCTA event={withPhoto} />)).not.toContain('<img')
  })
})
