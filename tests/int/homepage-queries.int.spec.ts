import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import { getFeaturedEventsForHomepage } from '@/lib/queries'

describe('getFeaturedEventsForHomepage', () => {
  it('returns at most 6 published+featured events', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    // @ts-expect-error slug auto-filled by the slugField beforeValidate hook
    await payload.create({
      collection: 'events',
      data: {
        title: `Homepage Featured ${stamp}`,
        shortDescription: 'Used by getFeaturedEventsForHomepage test',
        state: 'published',
        featured: true,
      },
    })

    const events = await getFeaturedEventsForHomepage()
    expect(events.length).toBeGreaterThan(0)
    expect(events.length).toBeLessThanOrEqual(6)
    expect(events.every((e) => e.featured === true)).toBe(true)
    expect(events.every((e) => e.state === 'published')).toBe(true)
  })
})
