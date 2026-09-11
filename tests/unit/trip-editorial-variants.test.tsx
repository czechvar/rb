import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Event, EventDate } from '@/payload-types'
import { resolveTripDetail } from '@/lib/trip-detail'
import { tripCommercialText } from '@/lib/trip-summary'
import { TripProgrammeComparison } from '@/components/sections/TripComparison'
import { GalleryBlock } from '@/components/blocks/GalleryBlock'
import { TripDatesBlock } from '@/components/blocks/TripDatesBlock'
import { TripFactsBlock } from '@/components/blocks/TripContentBlocks'

vi.mock('@/lib/queries', () => ({
  getActiveEventDatesForEvent: vi.fn(() => {
    throw new Error('Unexpected query')
  }),
}))
vi.mock('@/components/sections/EventDatesList', () => ({
  EventDatesList: () => <div>Live dates list</div>,
}))
vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))
const event = { id: 8, title: 'Trip', slug: 'trip', gallery: [] } as unknown as Event
const date = {
  id: 707,
  event: 8,
  dateFrom: '2999-01-01',
  dateTo: '2999-01-15',
  active: true,
  price: 2000,
  currency: 'EUR',
  capacity: 12,
  remainingSeats: 12,
} as EventDate

describe('observed trip editorial variants', () => {
  it('keeps companion cells aligned when an editor clears a column label', () => {
    const html = renderToStaticMarkup(
      <TripProgrammeComparison
        programme={null}
        companion={{
          columns: [{ label: '' }, { label: 'Length' }],
          rows: [{ cells: [{ text: 'Chulilla' }, { text: '7 days' }] }],
        }}
      />,
    )
    expect(html.match(/scope="col"/g)).toHaveLength(2)
    expect(html).toContain('scope="row">Chulilla</th><td>7 days</td>')
  })
  it('renders any comparison column count and safe related options without discarding the programme', () => {
    const html = renderToStaticMarkup(
      <TripProgrammeComparison
        programme={<p>Daily coaching</p>}
        heading="Choose your route"
        companion={{
          columns: [{ label: 'Stop' }, { label: 'Length' }, { label: 'Price' }],
          rows: [{ cells: [{ text: 'Chulilla' }, { text: '7 days' }, { text: '{price}' }] }],
          links: [
            {
              label: 'Next stop',
              href: '/trips/example?date=751',
              description: 'Continue climbing',
            },
            { label: 'Unsafe target', href: 'javascript:alert(1)' },
          ],
        }}
        text={(value) => value?.replace('{price}', '€2,000')}
      />,
    )
    for (const text of [
      'Daily coaching',
      'Choose your route',
      'Chulilla',
      '7 days',
      '€2,000',
      'Continue climbing',
    ])
      expect(html).toContain(text)
    expect(html).toContain('href="/trips/example?date=751"')
    expect(html).not.toContain('javascript:')
    expect(html.match(/scope="col"/g)).toHaveLength(3)
  })
  it('retains authored gallery text when source imagery is absent, while an unconfigured gallery stays absent', () => {
    const trip = resolveTripDetail(
      event,
      [
        {
          ...date,
          editorial: {
            sections: [
              { key: 'gallery', headingParts: [{ text: 'Real ' }, { text: 'rock', accent: true }] },
            ],
          },
        },
      ],
      707,
    )
    const props = {
      blockType: 'gallery' as const,
      source: 'currentEvent' as const,
      variant: 'featureLead' as const,
    }
    const html = renderToStaticMarkup(
      <GalleryBlock {...props} context={{ event: trip.event, trip }} />,
    )
    expect(html).toContain('Real ')
    expect(html).toContain('rock')
    expect(html).not.toContain('<img')
    expect(renderToStaticMarkup(<GalleryBlock {...props} context={{ event }} />)).toBe('')
  })
  it('renders a dates notice without querying or advertising unrelated departures', async () => {
    const trip = resolveTripDetail(
      event,
      [
        {
          ...date,
          editorial: {
            datesMode: 'notice',
            sections: [
              { key: 'dates', heading: 'Plan your dates', intro: 'Contact us for arrangements.' },
            ],
          },
        },
      ],
      707,
    )
    const html = renderToStaticMarkup(await TripDatesBlock({}, { event: trip.event, trip }))
    expect(html).toContain('Plan your dates')
    expect(html).toContain('Contact us for arrangements.')
    expect(html).not.toContain('/book/')
  })
  it('uses selected occurrence facts and tokens, even without the legacy summary descriptor', () => {
    const trip = resolveTripDetail(
      event,
      [
        {
          ...date,
          editorial: {
            factsStrip: [
              { label: 'Days', value: '{durationDays}' },
              { label: 'Maximum', value: '{capacity}' },
            ],
          },
        },
      ],
      707,
    )
    expect(tripCommercialText(trip, '{durationDays}/{durationWeeks}/{capacity}')).toBe('14/2/12')
    const html = renderToStaticMarkup(TripFactsBlock({}, { event: trip.event, trip }))
    expect(html).toContain('Maximum')
    expect(html).toContain('14')
    expect(html).toContain('12')
    expect(html).not.toContain('{capacity}')
  })
})
