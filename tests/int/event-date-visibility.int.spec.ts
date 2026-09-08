import { describe, expect, it } from 'vitest'
import {
  catalogueDateFloor,
  isUpcomingEventDate,
  upcomingEventDateWhere,
} from '@/lib/event-date-visibility'

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
})
