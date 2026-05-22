import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('payload test harness', () => {
  it('boots a Payload instance against the test database', async () => {
    const payload = await getTestPayload()
    expect(payload.config.collections.length).toBeGreaterThan(0)
  })
})
