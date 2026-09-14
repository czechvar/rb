import { describe, expect, it } from 'vitest'
import {
  catalogueDateFloor,
  eventDateLifecycle,
  isBookableEventDate,
  isUpcomingEventDate,
  selectBookableOccurrence,
  upcomingEventDateWhere,
} from '@/lib/event-date-visibility'
import type { EventDate } from '@/payload-types'

describe('event date public visibility helpers', () => {
  it('uses the start of the current UTC day as the catalogue floor', () => {
    const now = new Date('2026-09-02T19:45:00.000Z')

    expect(catalogueDateFloor(now)).toBe('2026-09-02T00:00:00.000Z')
    expect(upcomingEventDateWhere(now)).toEqual({
      dateFrom: { greater_than_equal: '2026-09-02T00:00:00.000Z' },
    })
  })

  it('keeps today visible but hides dates before today', () => {
    const now = new Date('2026-09-02T19:45:00.000Z')

    expect(isUpcomingEventDate({ dateFrom: '2026-09-01T00:00:00.000Z' }, now)).toBe(false)
    expect(isUpcomingEventDate({ dateFrom: '2026-09-02T00:00:00.000Z' }, now)).toBe(true)
    expect(isUpcomingEventDate({ dateFrom: '2026-09-03T00:00:00.000Z' }, now)).toBe(true)
  })

  it('distinguishes upcoming, in-progress and ended occurrences at their exact boundaries', () => {
    const now = new Date('2026-09-14T12:00:00.000Z')

    expect(eventDateLifecycle({ dateFrom: '2026-09-15T00:00:00.000Z', dateTo: '2026-09-20T00:00:00.000Z' }, now)).toBe('upcoming')
    expect(eventDateLifecycle({ dateFrom: '2026-09-14T12:00:00.000Z', dateTo: '2026-09-20T00:00:00.000Z' }, now)).toBe('in-progress')
    expect(eventDateLifecycle({ dateFrom: '2026-09-10T00:00:00.000Z', dateTo: '2026-09-14T12:00:00.000Z' }, now)).toBe('in-progress')
    expect(eventDateLifecycle({ dateFrom: '2026-09-10T00:00:00.000Z', dateTo: '2026-09-14T11:59:59.999Z' }, now)).toBe('ended')
  })

  it('matches checkout eligibility and chooses the earliest bookable slug deterministically', () => {
    const now = new Date('2026-09-14T12:00:00.000Z')
    const occurrence = (id: number, overrides: Partial<EventDate> = {}) => ({
      id,
      slug: `venue-${id}`,
      active: true,
      dateFrom: '2026-09-15T00:00:00.000Z',
      dateTo: '2026-09-20T00:00:00.000Z',
      capacity: 8,
      remainingSeats: 2,
      ...overrides,
    }) as EventDate
    const started = occurrence(1, { dateFrom: now.toISOString() })
    const soldOut = occurrence(2, { remainingSeats: 0 })
    const invalidSlug = occurrence(3, { slug: null })
    const reservedSlug = occurrence(7, { slug: 'dates' })
    const later = occurrence(4, { dateFrom: '2026-09-16T00:00:00.000Z', slug: 'later' })
    const sameDateB = occurrence(5, { slug: 'z-venue' })
    const sameDateA = occurrence(6, { slug: 'a-venue' })

    expect(isBookableEventDate(started, now)).toBe(false)
    expect(isBookableEventDate(soldOut, now)).toBe(false)
    expect(isBookableEventDate(invalidSlug, now)).toBe(false)
    expect(isBookableEventDate(reservedSlug, now)).toBe(false)
    expect(selectBookableOccurrence([started, soldOut, invalidSlug, reservedSlug, later, sameDateB, sameDateA], now)?.id).toBe(6)
  })
})
