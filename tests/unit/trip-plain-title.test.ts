import { describe, expect, it } from 'vitest'
import { tripPlainTitle } from '@/lib/trip-card-content'
import type { Event, EventDate } from '@/payload-types'

const event = { id: 5, title: 'Europe Climbing Trip' } as Event

describe('tripPlainTitle', () => {
  it('uses the authored trip name on one line, even when the hero breaks it across lines', () => {
    const date = {
      id: 9,
      event,
      tripVariant: {
        id: 51,
        event: event.id,
        title: 'Gorges du Tarn',
        editorial: {
          hero: {
            titleParts: [
              { text: 'ROCK & ROAD EUROPE:' },
              { text: 'GORGES DU TARN', accent: true, breakBefore: true },
            ],
          },
        },
      },
    } as unknown as EventDate

    expect(tripPlainTitle(event, date)).toBe('ROCK & ROAD EUROPE: GORGES DU TARN')
  })

  it('falls back to the event title when no trip name is authored', () => {
    expect(tripPlainTitle(event, { id: 9, event } as unknown as EventDate)).toBe(
      'Europe Climbing Trip',
    )
  })
})
