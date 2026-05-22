import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('users collection', () => {
  it('creates a customer with a role', async () => {
    const payload = await getTestPayload()
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `c-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test Customer',
        role: 'customer',
      },
    })
    expect(user.id).toBeDefined()
    expect(user.role).toBe('customer')
  })

  it('defaults role to customer', async () => {
    const payload = await getTestPayload()
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `d-${Date.now()}@example.com`,
        password: 'password123',
        name: 'No Role',
      },
    })
    expect(user.role).toBe('customer')
  })
})
