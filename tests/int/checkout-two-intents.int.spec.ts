// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { User } from '@/payload-types'
import {
  reserveCheckout,
  reserveCheckoutForReview,
} from '@/lib/checkout/reservations'
import { getTestPayload } from '../helpers/payload'

describe('checkout pay-now and reserve-now intents', () => {
  const marker = `checkout-two-intents-${randomUUID()}`
  let eventId = 0
  let eventDateId = 0
  let user: User

  beforeAll(async () => {
    const payload = await getTestPayload()
    const event = await payload.create({
      collection: 'events',
      data: { title: `[TEST] ${marker}`, slug: marker, state: 'published' } as never,
    })
    eventId = event.id
    const eventDate = await payload.create({
      collection: 'event-dates',
      data: {
        slug: `${marker}-date`,
        event: event.id,
        dateFrom: '2099-08-01T00:00:00Z',
        dateTo: '2099-08-08T00:00:00Z',
        price: 100,
        vat: 21,
        currency: 'EUR',
        capacity: 10,
        active: true,
      },
    })
    eventDateId = eventDate.id
    user = await payload.create({
      collection: 'users',
      disableVerificationEmail: true,
      data: {
        name: `[TEST] ${marker}`,
        email: `${marker}@example.invalid`,
        phone: '+420123456789',
        password: randomUUID(),
        role: 'customer',
        _verified: true,
      },
    })
  })

  afterAll(async () => {
    const payload = await getTestPayload()
    await payload.delete({
      collection: 'orders',
      where: { eventDate: { equals: eventDateId } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'checkouts',
      where: { 'contact.email': { equals: user.email } },
      overrideAccess: true,
    })
    await payload.delete({ collection: 'event-dates', id: eventDateId, overrideAccess: true })
    await payload.delete({ collection: 'events', id: eventId, overrideAccess: true })
    await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
  })

  const input = (submissionKey: string) => ({
    submissionKey,
    contact: { name: user.name, email: user.email, phone: user.phone },
    items: [{ eventDateId, quantity: 1 }],
  })

  it('keeps Pay now self-service and binds intent to idempotency', async () => {
    const request = input(randomUUID())
    const checkout = await reserveCheckout(request, user)

    expect(checkout.state).toBe('reserved')
    expect(checkout.expiresAt).toBeTruthy()
    await expect(reserveCheckoutForReview(request, user)).rejects.toThrow(
      'This request has already been used',
    )
  })

  it('keeps Reserve now in staff review without an expiry', async () => {
    const checkout = await reserveCheckoutForReview(input(randomUUID()), user)

    expect(checkout.state).toBe('awaitingReview')
    expect(checkout.expiresAt).toBeNull()
    const checkoutUserId =
      checkout.user && typeof checkout.user === 'object' ? checkout.user.id : checkout.user
    expect(checkoutUserId).toBe(user.id)
    expect(checkout.items.every((item) => item.orderId)).toBe(true)
  })
})
