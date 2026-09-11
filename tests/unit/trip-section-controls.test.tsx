import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Event } from '@/payload-types'
import { resolveTripDetail } from '@/lib/trip-detail'
import { TripLogisticsBlock } from '@/components/blocks/TripLogisticsBlock'
import { TripContentBlock } from '@/components/blocks/TripContentBlocks'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))

const event = {
  id: 1,
  title: 'Trip',
  slug: 'section-controls',
  comparison: {
    heading: 'Which format?',
    leftHeading: 'One week',
    rightHeading: 'Two weeks',
    rows: [{ label: 'Coaching days', left: '5', right: '10' }],
  },
  editorial: { dailySchedule: [{ time: '09:00', title: 'Morning climbing' }] },
} as Event

function renderProgramme(editorial: Event['editorial']) {
  const trip = resolveTripDetail({ ...event, editorial: { ...event.editorial, ...editorial } }, [])
  return renderToStaticMarkup(
    TripContentBlock({ section: 'itinerary', variant: 'timeline' }, { event: trip.event, trip }),
  )
}

describe('independent trip section controls', () => {
  it('clears the comparison heading while retaining its table and accessible label', () => {
    const html = renderProgramme({ sections: [{ key: 'comparison', clearHeading: true }] })
    expect(html).not.toContain('Which format?')
    for (const text of ['<table>', 'One week', 'Two weeks', 'Coaching days', 'Morning climbing'])
      expect(html).toContain(text)
    expect(html).toContain('aria-label="Programme comparison"')
  })
})

it('keeps comparison visible when the itinerary is hidden', () => {
  const html = renderProgramme({
    sections: [
      { key: 'itinerary', visibility: 'hide' },
      { key: 'comparison', visibility: 'show' },
    ],
  })
  expect(html).toContain('Coaching days')
  expect(html).not.toContain('Morning climbing')
})
it('keeps companion links visible when the itinerary is hidden', () => {
  const html = renderProgramme({
    sections: [
      { key: 'itinerary', visibility: 'hide' },
      { key: 'comparison', visibility: 'show' },
    ],
    companion: { links: [{ label: 'Related course', href: '/trips/related' }] },
  })
  expect(html).toContain('Related course')
  expect(html).not.toContain('Morning climbing')
})
it('hides both independently and can hide only the comparison', () => {
  expect(
    renderProgramme({
      sections: [
        { key: 'itinerary', visibility: 'hide' },
        { key: 'comparison', visibility: 'hide' },
      ],
    }),
  ).toBe('')
  const html = renderProgramme({ sections: [{ key: 'comparison', visibility: 'hide' }] })
  expect(html).toContain('Morning climbing')
  expect(html).not.toContain('Coaching days')
})

it('renders the logistics intro with existing accommodation content', () => {
  const trip = resolveTripDetail(
    {
      ...event,
      accommodation: { included: [{ text: 'Shared accommodation' }] },
      editorial: { sections: [{ key: 'logistics', intro: 'We handle the practical details.' }] },
    },
    [],
  )
  const html = renderToStaticMarkup(TripLogisticsBlock({}, { event: trip.event, trip }))
  expect(html).toContain('We handle the practical details.')
  expect(html).toContain('Shared accommodation')
})
