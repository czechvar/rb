import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

// Tiny seed helpers — mirror the pattern in orders.int.spec.ts.
async function seedEventDate(price = 200) {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: {
      title: `PricingTest ${unique}`,
      slug: `pricingtest-${unique}`,
      state: 'published',
    } as never,
    overrideAccess: true,
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-01-01',
      dateTo: '2027-01-08',
      price,
      vat: 21,
      currency: 'EUR',
      capacity: 10,
      active: true,
    } as never,
    overrideAccess: true,
  })
  return { eventDateId: ed.id as number }
}

async function seedUser() {
  const payload = await getTestPayload()
  const u = await payload.create({
    collection: 'users',
    data: {
      email: `u-${Date.now()}-${Math.random()}@x.test`,
      password: 'pwlong',
      _verified: true,
      name: 'Test User',
      phone: '+420 600 000 001',
    } as never,
    overrideAccess: true,
  })
  return u
}

const billing = {
  firstName: 'A',
  lastName: 'B',
  street: 'S 1',
  city: 'P',
  postalCode: '11000',
  country: 'CZ',
}

async function seedDiscount(payload: Awaited<ReturnType<typeof getTestPayload>>) {
  return payload.create({
    collection: 'discount-codes',
    data: {
      code: `DC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      title: 'T',
      discountPercent: 25,
      validFrom: '2020-01-01',
      validUntil: '2099-12-31',
      commissionPercent: 10,
    } as never,
    overrideAccess: true,
  })
}

async function seedReferral(payload: Awaited<ReturnType<typeof getTestPayload>>) {
  return payload.create({
    collection: 'referrals',
    data: {
      code: `R-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      name: 'P',
      email: `r-${Math.random()}@x.test`,
      discountPercent: 10,
      commissionPercent: 15,
    } as never,
    overrideAccess: true,
  })
}

describe('order pricing — snowbusters stacking rule', () => {
  it('discount code only: discounts price + records commission', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDate(200)
    const u = await seedUser()
    const dc = await seedDiscount(payload)
    const order = await payload.create({
      collection: 'orders',
      data: {
        user: u.id,
        eventDate: eventDateId,
        participants: [
          {
            firstName: 'A',
            lastName: 'B',
            email: 'a@x.test',
            phone: '+1',
          },
        ],
        billingAddress: billing,
        unitPrice: 200,
        vat: 21,
        currency: 'EUR',
        discountCode: dc.id,
        state: 'pending',
      } as never,
      overrideAccess: true,
    })
    expect(order.discountAmount).toBe(50) // 200 * 25%
    expect(order.totalPrice).toBe(150)
    expect(order.discountCommission).toBe(20) // 200 * 10%
    expect(order.referralCommission).toBe(0)
  })

  it('referral only: discounts price + records commission', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDate(200)
    const u = await seedUser()
    const ref = await seedReferral(payload)
    const order = await payload.create({
      collection: 'orders',
      data: {
        user: u.id,
        eventDate: eventDateId,
        participants: [
          {
            firstName: 'A',
            lastName: 'B',
            email: 'a@x.test',
            phone: '+1',
          },
        ],
        billingAddress: billing,
        unitPrice: 200,
        vat: 21,
        currency: 'EUR',
        referral: ref.id,
        state: 'pending',
      } as never,
      overrideAccess: true,
    })
    expect(order.discountAmount).toBe(20) // 200 * 10%
    expect(order.totalPrice).toBe(180)
    expect(order.referralCommission).toBe(30) // 200 * 15%
    expect(order.discountCommission).toBe(0)
  })

  it('both present: DC wins on price; referral commission still recorded', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDate(200)
    const u = await seedUser()
    const dc = await seedDiscount(payload)
    const ref = await seedReferral(payload)
    const order = await payload.create({
      collection: 'orders',
      data: {
        user: u.id,
        eventDate: eventDateId,
        participants: [
          {
            firstName: 'A',
            lastName: 'B',
            email: 'a@x.test',
            phone: '+1',
          },
        ],
        billingAddress: billing,
        unitPrice: 200,
        vat: 21,
        currency: 'EUR',
        discountCode: dc.id,
        referral: ref.id,
        state: 'pending',
      } as never,
      overrideAccess: true,
    })
    expect(order.discountAmount).toBe(50) // DC's 25% wins, not referral's 10%
    expect(order.totalPrice).toBe(150)
    expect(order.discountCommission).toBe(20) // DC commission tracked
    expect(order.referralCommission).toBe(30) // referral commission ALSO tracked
  })

  it('neither present: no change to existing behavior', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDate(200)
    const u = await seedUser()
    const order = await payload.create({
      collection: 'orders',
      data: {
        user: u.id,
        eventDate: eventDateId,
        participants: [
          {
            firstName: 'A',
            lastName: 'B',
            email: 'a@x.test',
            phone: '+1',
          },
          {
            firstName: 'C',
            lastName: 'D',
            email: 'c@x.test',
            phone: '+2',
          },
        ],
        billingAddress: billing,
        unitPrice: 200,
        vat: 21,
        currency: 'EUR',
        state: 'pending',
      } as never,
      overrideAccess: true,
    })
    expect(order.discountAmount).toBe(0)
    expect(order.totalPrice).toBe(400)
    expect(order.discountCommission).toBe(0)
    expect(order.referralCommission).toBe(0)
  })
})

async function seedEventDateWithCzk(price = 200, priceCzk = 5000) {
  const payload = await getTestPayload()
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const event = await payload.create({
    collection: 'events',
    data: {
      title: `CzkPricingTest ${unique}`,
      slug: `czkpricingtest-${unique}`,
      state: 'published',
    } as never,
    overrideAccess: true,
  })
  const ed = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2027-01-01',
      dateTo: '2027-01-08',
      price,
      priceCzk,
      vat: 21,
      currency: 'EUR',
      capacity: 10,
      active: true,
    } as never,
    overrideAccess: true,
  })
  return { eventDateId: ed.id as number }
}

describe('CZK order pricing', () => {
  it('derives totalPriceCzk with the same discount formula as totalPrice', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDateWithCzk(200, 5000)
    const user = await seedUser()
    const discount = await payload.create({
      collection: 'discount-codes',
      data: {
        code: `CZK${Date.now()}${Math.floor(Math.random() * 1000)}`,
        title: 'CZK test',
        discountPercent: 10,
        validFrom: '2020-01-01',
        validUntil: '2099-01-01',
        active: true,
      } as never,
      overrideAccess: true,
    })

    const order = await payload.create({
      collection: 'orders',
      data: {
        user: user.id,
        eventDate: eventDateId,
        participants: [
          { firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' },
          { firstName: 'C', lastName: 'D', email: 'c@x.test', phone: '+2' },
        ],
        billingAddress: billing,
        unitPrice: 200,
        unitPriceCzk: 5000,
        vat: 21,
        currency: 'EUR',
        discountCode: discount.id,
        state: 'pending',
      } as never,
      overrideAccess: true,
    })

    // EUR: 200 * 2 = 400, less 10% = 360. CZK: 5000 * 2 = 10000, less 10% = 9000.
    expect(order.totalPrice).toBe(360)
    expect(order.unitPriceCzk).toBe(5000)
    expect(order.totalPriceCzk).toBe(9000)
  })

  it('leaves totalPriceCzk null when the trip has no CZK price', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDate(200)
    const user = await seedUser()

    const order = await payload.create({
      collection: 'orders',
      data: {
        user: user.id,
        eventDate: eventDateId,
        participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
        billingAddress: billing,
        unitPrice: 200,
        vat: 21,
        currency: 'EUR',
        state: 'pending',
      } as never,
      overrideAccess: true,
    })

    expect(order.totalPrice).toBe(200)
    expect(order.unitPriceCzk ?? null).toBeNull()
    expect(order.totalPriceCzk ?? null).toBeNull()
  })

  it('treats a zero CZK price as a real price, not as "unavailable"', async () => {
    const payload = await getTestPayload()
    const { eventDateId } = await seedEventDateWithCzk(200, 0)
    const user = await seedUser()

    const order = await payload.create({
      collection: 'orders',
      data: {
        user: user.id,
        eventDate: eventDateId,
        participants: [{ firstName: 'A', lastName: 'B', email: 'a@x.test', phone: '+1' }],
        billingAddress: billing,
        unitPrice: 200,
        unitPriceCzk: 0,
        vat: 21,
        currency: 'EUR',
        state: 'pending',
      } as never,
      overrideAccess: true,
    })

    expect(order.totalPriceCzk).toBe(0)
  })
})
