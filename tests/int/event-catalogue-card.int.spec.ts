import { describe, expect, it } from 'vitest'
import type { Event } from '@/payload-types'
import { eventCatalogueDescription, eventCatalogueTitle } from '@/lib/event-catalogue-card'

function event(overrides: Partial<Event>): Event {
  return {
    id: 1,
    title: 'Full Trip Title',
    slug: 'full-trip-title',
    updatedAt: '2026-09-02T00:00:00.000Z',
    createdAt: '2026-09-02T00:00:00.000Z',
    ...overrides,
  } as Event
}

describe('event catalogue card copy', () => {
  it('uses explicit catalogue copy when present', () => {
    const item = event({
      shortDescription: 'Long page intro.',
      catalogueCard: {
        title: 'Card title',
        description: 'Tight catalogue teaser.',
      },
    })

    expect(eventCatalogueTitle(item)).toBe('Card title')
    expect(eventCatalogueDescription(item)).toBe('Tight catalogue teaser.')
  })

  it('falls back to the canonical event title and short description', () => {
    const item = event({
      shortDescription: 'Long page intro.',
      catalogueCard: {
        title: ' ',
        description: '',
      },
    })

    expect(eventCatalogueTitle(item)).toBe('Full Trip Title')
    expect(eventCatalogueDescription(item)).toBe('Long page intro.')
  })
})
