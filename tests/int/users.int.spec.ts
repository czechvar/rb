import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('users collection', () => {
  // payload.create() via the Local API bypasses access control. These tests
  // cover field persistence and defaults; access rules are unit-tested in
  // helpers.int.spec.ts.

  it('creates a customer with a role', async () => {
    const payload = await getTestPayload()
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `c-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test Customer',
        phone: '+420 777 000 099',
        role: 'customer',
      },
    })
    expect(user.id).toBeDefined()
    expect(user.role).toBe('customer')
  })

  it('defaults role to customer', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error role is intentionally omitted to verify the collection's defaultValue
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `d-${Date.now()}@example.com`,
        password: 'password123',
        name: 'No Role',
        phone: '+420 777 000 098',
      },
    })
    expect(user.role).toBe('customer')
  })

  it('requires phone and validates format', async () => {
    const payload = await getTestPayload()
    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: `p-${Date.now()}@example.com`,
          password: 'password123',
          name: 'No Phone',
        } as never,
      }),
    ).rejects.toThrow()

    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: `p-${Date.now()}@example.com`,
          password: 'password123',
          name: 'Bad Phone',
          phone: 'not-a-phone-AAAA',
        } as never,
      }),
    ).rejects.toThrow()

    const ok = await payload.create({
      collection: 'users',
      data: {
        email: `p-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Good Phone',
        phone: '+420 777 123 456',
      } as never,
    })
    expect(ok.phone).toBe('+420 777 123 456')
  })

  it('creates user with _verified false (auth.verify is on)', async () => {
    const payload = await getTestPayload()
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `v-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Verify Me',
        phone: '+420 777 000 000',
      } as never,
    })
    expect(user._verified).toBe(false)
  })

  it('stores an address with optional company block', async () => {
    const payload = await getTestPayload()
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `a-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Addr',
        phone: '+420 777 111 222',
        addresses: [
          {
            label: 'Work',
            isDefault: true,
            firstName: 'Jan',
            lastName: 'Antl',
            street: 'Prazska 1',
            city: 'Brno',
            postalCode: '60200',
            country: 'CZ',
            company: { companyName: 'Acme', ico: '12345678', dic: 'CZ12345678' },
          },
        ],
      } as never,
    })
    expect(user.addresses?.[0]?.company?.ico).toBe('12345678')
  })

  it('rejects bad ICO format', async () => {
    const payload = await getTestPayload()
    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: `ic-${Date.now()}@example.com`,
          password: 'password123',
          name: 'Bad Ico',
          phone: '+420 777 333 444',
          addresses: [
            {
              firstName: 'X',
              lastName: 'Y',
              street: 's',
              city: 'c',
              postalCode: 'p',
              country: 'CZ',
              company: { companyName: 'Acme', ico: '1234' },
            },
          ],
        } as never,
      }),
    ).rejects.toThrow()
  })
})
