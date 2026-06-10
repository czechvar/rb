import { describe, expect, it, beforeEach } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import { clearTestInbox, getTestInbox } from '@/lib/email/adapter'

const baseBilling = {
  firstName: 'A', lastName: 'B', street: 'Main 1', city: 'Prague', postalCode: '11000', country: 'CZ',
}

async function seed() {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: { title: `EmailTest ${unique}`, slug: `emailtest-${unique}`, state: 'published' },
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-06-01T00:00:00.000Z',
      dateTo: '2027-06-05T00:00:00.000Z',
      price: 100, vat: 21, currency: 'EUR', capacity: 10, active: true,
    },
  })
  const user = await payload.create({
    collection: 'users',
    data: {
      name: 'Email Tester', phone: '+420 600 000 030',
      email: `email-${Date.now()}-${Math.random()}@x.test`,
      password: 'emails-pwd',
      role: 'customer', _verified: true,
    } as never,
  })
  return { event, ed, user }
}

async function createOrder(eventDateId: number, userId: number) {
  const payload = await getTestPayload()
  return payload.create({
    collection: 'orders',
    data: {
      user: userId, eventDate: eventDateId,
      participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
      billingAddress: baseBilling,
      unitPrice: 100, vat: 21, currency: 'EUR', state: 'pending',
    } as never,
    overrideAccess: true,
  })
}

beforeEach(() => clearTestInbox())

describe('orders email dispatcher', () => {
  it('on create: sends "Booking received" to user and admin', async () => {
    const { ed, user } = await seed()
    await createOrder(ed.id, user.id)
    const inbox = getTestInbox()
    const subjects = inbox.map((e) => e.subject)
    expect(subjects).toEqual(
      expect.arrayContaining([expect.stringMatching(/booking received/i), expect.stringMatching(/new booking/i)]),
    )
    const toUser = inbox.find((e) => String(e.to).includes(user.email))
    expect(toUser).toBeDefined()
  })
  it('on pending -> confirmed: sends "Booking confirmed" to user', async () => {
    const payload = await getTestPayload()
    const { ed, user } = await seed()
    const o = await createOrder(ed.id, user.id)
    clearTestInbox()
    await payload.update({ collection: 'orders', id: o.id, data: { state: 'confirmed' }, overrideAccess: true })
    const inbox = getTestInbox()
    expect(inbox.find((e) => /confirmed/i.test(e.subject))).toBeDefined()
  })
  it('on confirmed -> paid: sends no email', async () => {
    const payload = await getTestPayload()
    const { ed, user } = await seed()
    const o = await createOrder(ed.id, user.id)
    await payload.update({ collection: 'orders', id: o.id, data: { state: 'confirmed' }, overrideAccess: true })
    clearTestInbox()
    await payload.update({ collection: 'orders', id: o.id, data: { state: 'paid' }, overrideAccess: true })
    expect(getTestInbox()).toHaveLength(0)
  })
  it('on any -> cancelled: sends "Booking cancelled" to user', async () => {
    const payload = await getTestPayload()
    const { ed, user } = await seed()
    const o = await createOrder(ed.id, user.id)
    clearTestInbox()
    await payload.update({ collection: 'orders', id: o.id, data: { state: 'cancelled' }, overrideAccess: true })
    const inbox = getTestInbox()
    expect(inbox.find((e) => /cancelled/i.test(e.subject))).toBeDefined()
  })
})
