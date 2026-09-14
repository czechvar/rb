import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { EventDateCard } from '@/components/blocks/CatalogueCards'
import { UpcomingTrips } from '@/components/marketing/team/UpcomingTrips'
import { toCatalogueResult } from '@/lib/catalogue-results'
import type { Event, EventDate } from '@/payload-types'

const event = {
  id: 41,
  title: 'Kalymnos camp',
  slug: 'kalymnos-camp',
  state: 'published',
  createdAt: '',
  updatedAt: '',
} as Event

const occurrence = {
  id: 77,
  event,
  slug: 'kalymnos-2999-10-12',
  dateFrom: '2999-10-12T00:00:00.000Z',
  dateTo: '2999-10-19T00:00:00.000Z',
  price: 1290,
  vat: 0,
  currency: 'EUR',
  capacity: 8,
  remainingSeats: 3,
  active: true,
  createdAt: '',
  updatedAt: '',
} as EventDate

describe('known occurrence discovery links', () => {
  it('uses the canonical occurrence URL in Event Date cards and upcoming team trips', () => {
    const expected = '/trips/kalymnos-camp/kalymnos-2999-10-12'
    expect(renderToStaticMarkup(<EventDateCard eventDate={occurrence} />)).toContain(`href="${expected}"`)
    expect(renderToStaticMarkup(<UpcomingTrips dates={[occurrence]} />)).toContain(`href="${expected}"`)
  })

  it('puts the canonical occurrence URL in catalogue result DTOs', () => {
    expect(toCatalogueResult(occurrence)?.href).toBe('/trips/kalymnos-camp/kalymnos-2999-10-12')
  })
})
