/** Disposable database fixtures only; the guarded runner drops their database. */
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { getPayload } from 'payload'
import {
  up as checkoutUp,
  down as checkoutDown,
} from '../../src/migrations/20260913_150000_grouped_checkout'
import { withCheckoutTransaction } from '../../src/lib/checkout/transaction'
import { quoteCart } from '../../src/lib/checkout/quote'
import {
  activateGuestReservation,
  reserveCheckout,
  cancelCheckout,
} from '../../src/lib/checkout/reservations'
import type { CheckoutRecord } from '../../src/lib/checkout/types'
import { verifyIdentity } from './verify-identity'
import { verifyPayments } from './verify-payments'
import { CANONICAL_SEED_COLLECTIONS } from '../canonical-seed/shared'

let stage = 'init'
async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '')
  assert(
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      /^\/rb_seed_verify_[a-f0-9]+$/.test(url.pathname),
  )
  const config = await (await import('../../src/payload.config')).default
  config.logger = { options: { level: 'silent' } } as typeof config.logger
  const payload = await getPayload({ config })
  payload.sendEmail = async () => ({})
  const passed = (checkPassed: string) => console.log(JSON.stringify({ checkPassed }))
  try {
    await checkoutDown({ db: payload.db.drizzle } as never)
    await checkoutUp({ db: payload.db.drizzle } as never)
    passed('empty-checkout-migration-down-up')

    assert(!CANONICAL_SEED_COLLECTIONS.some((item) => (item.slug as string) === 'checkouts'))
    passed('operational-checkouts-excluded-from-seed')
    const publicUser = await payload.create({
      collection: 'users',
      overrideAccess: false,
      disableVerificationEmail: true,
      data: {
        email: 'checkout-public-role@example.invalid',
        name: '[Checkout test] Public role',
        phone: '+420123456789',
        password: randomUUID(),
        role: 'admin',
      },
    })
    assert.equal(publicUser.role, 'customer')
    passed('public-registration-cannot-assign-admin-role')
    stage = 'event-create'
    const event = await payload.create({
      collection: 'events',
      data: {
        title: '[Checkout test] Trip',
        slug: 'checkout-test-trip',
        state: 'published',
      } as never,
    })
    stage = 'dates-create'
    const dates = await Promise.all(
      [1, 2, 3, 100].map((capacity) =>
        payload.create({
          collection: 'event-dates',
          data: {
            event: event.id,
            dateFrom: '2030-06-15T00:00:00Z',
            dateTo: '2030-06-22T00:00:00Z',
            price: 199.99,
            priceCzk: 4999.99,
            vat: 21,
            currency: 'EUR',
            capacity,
            active: true,
          },
        }),
      ),
    )
    await payload.update({ collection: 'events', id: event.id, data: { state: 'draft' } })
    await assert.rejects(() => quoteCart({ items: [{ eventDateId: dates[0].id, quantity: 1 }] }))
    await payload.update({ collection: 'events', id: event.id, data: { state: 'published' } })
    passed('unpublished-parent-cannot-be-reserved')
    const make = async (items: Array<{ eventDateId: number; quantity: number }>) => {
      const quote = await quoteCart({ items })
      const hash = createHash('sha256').update(randomUUID()).digest('hex')
      const record = await withCheckoutTransaction(payload, (req) =>
        payload.create({
          collection: 'checkouts',
          req,
          overrideAccess: true,
          data: {
            reference: `test-${randomUUID()}`,
            submissionKey: randomUUID(),
            requestDigest: 'fixture',
            state: 'unverified',
            customerKind: 'new',
            contact: {
              name: '[Checkout test]',
              email: 'checkout-test@example.invalid',
              phone: '+420123456789',
            },
            items: quote.items,
            currency: quote.currency,
            verificationHash: hash,
            verificationExpiresAt: '2030-01-01T00:00:00Z',
          },
        }),
      )
      return { record: record as unknown as CheckoutRecord, hash }
    }
    stage = 'guest-create'
    const guest = await make([
      { eventDateId: dates[1].id, quantity: 1 },
      { eventDateId: dates[2].id, quantity: 2 },
    ])
    stage = 'guest-activate'
    const activated = await activateGuestReservation(guest.record.id, guest.hash)
    assert.equal(activated.state, 'awaitingReview')
    assert.equal(activated.items.length, 2)
    const bookings = await payload.find({
      collection: 'orders',
      where: { checkout: { equals: activated.id } },
      depth: 0,
    })
    assert.equal(bookings.docs.length, 2)
    assert.deepEqual(bookings.docs.map((o) => o.participantCount).sort(), [1, 2])
    assert(bookings.docs.every((o) => !o.user && !o.participants?.length))
    passed('guest-basket-reserves-quantity-without-profiles')
    await assert.rejects(() => activateGuestReservation(guest.record.id, guest.hash))
    passed('verification-replay-does-not-duplicate-reservations')
    const first = await make([{ eventDateId: dates[0].id, quantity: 1 }])
    const second = await make([{ eventDateId: dates[0].id, quantity: 1 }])
    const race = await Promise.allSettled([
      activateGuestReservation(first.record.id, first.hash),
      activateGuestReservation(second.record.id, second.hash),
    ])
    assert.equal(race.filter((r) => r.status === 'fulfilled').length, 1)
    passed('concurrent-last-seat-allows-one-reservation')
    const failed = await make([
      { eventDateId: dates[1].id, quantity: 1 },
      { eventDateId: dates[2].id, quantity: 1 },
    ])
    const competitor = await make([{ eventDateId: dates[2].id, quantity: 1 }])
    await activateGuestReservation(competitor.record.id, competitor.hash)
    await assert.rejects(() => activateGuestReservation(failed.record.id, failed.hash))
    assert.equal(
      (
        await payload.find({
          collection: 'orders',
          where: { checkout: { equals: failed.record.id } },
          depth: 0,
        })
      ).totalDocs,
      0,
    )
    passed('unavailable-item-rolls-back-entire-basket')
    await assert.rejects(() =>
      payload.find({ collection: 'checkouts', overrideAccess: false, user: null }),
    )
    passed('anonymous-checkouts-are-private')
    const user = await payload.create({
      collection: 'users',
      disableVerificationEmail: true,
      data: {
        email: 'checkout-returning@example.invalid',
        name: '[Checkout test] Returning',
        phone: '+420123456789',
        password: randomUUID(),
        _verified: true,
        role: 'customer',
      },
    })
    const billing = {
      firstName: 'Test',
      lastName: 'Buyer',
      street: 'Test 1',
      city: 'Test',
      postalCode: '12345',
      country: 'CZ',
    }
    await payload.create({
      collection: 'orders',
      data: {
        user: user.id,
        eventDate: dates[3].id,
        participants: [
          { firstName: 'Test', lastName: 'Buyer', email: user.email, phone: user.phone },
        ],
        participantCount: 1,
        billingAddress: billing,
        unitPrice: 199.99,
        totalPrice: 199.99,
        vat: 21,
        currency: 'EUR',
        state: 'completed',
      },
    })
    const input = {
      submissionKey: randomUUID(),
      items: [{ eventDateId: dates[1].id, quantity: 1 }],
      contact: { name: user.name, email: user.email, phone: user.phone },
      billingAddress: billing,
    }
    const reserves = await Promise.all([reserveCheckout(input, user), reserveCheckout(input, user)])
    assert.equal(reserves[0].id, reserves[1].id)
    passed('returning-checkout-retries-are-idempotent')
    await cancelCheckout(reserves[0].id, user)
    assert.equal(
      (
        await payload.findByID({
          collection: 'orders',
          id: reserves[0].items[0].orderId!,
          depth: 0,
        })
      ).state,
      'cancelled',
    )
    passed('unpaid-cancellation-releases-booking')
    await assert.rejects(() =>
      payload.create({ collection: 'checkouts', overrideAccess: false, user, data: {} as never }),
    )
    passed('customers-cannot-write-financial-state-directly')
    await assert.rejects(() =>
      payload.update({
        collection: 'orders',
        id: activated.items[0].orderId!,
        data: { participantCount: 99 },
      }),
    )
    passed('grouped-bookings-reject-outside-writes')
    stage = 'identity-checks'
    await verifyIdentity(payload)
    stage = 'payment-checks'
    await verifyPayments(payload)
    await assert.rejects(() => checkoutDown({ db: payload.db.drizzle } as never))
    passed('rollback-refuses-to-discard-operational-data')
    // No fixture may enter canonical records; entire disposable database is teardown.
    console.log(JSON.stringify({ checkoutVerificationPassed: true }))
  } finally {
    await payload.destroy()
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(
      JSON.stringify({
        verificationFailed: true,
        checkFailed: stage,
        typeErrorProperty: error?.message?.match(
          /Cannot read properties of (?:undefined|null) \(reading '([a-zA-Z]+)'\)/,
        )?.[1],
        errorName: /^[A-Za-z]+$/.test(error?.name ?? '') ? error.name : undefined,
        frames: error?.stack
          ?.split('\n')
          .slice(1, 5)
          .map((x: string) => x.match(/at ([A-Za-z0-9_.]+) /)?.[1])
          .filter(Boolean),
        relation: error?.cause?.message?.match(/relation "([a-z_]+)" does not exist/)?.[1],
        knownError: [
          'Booking requires an active database transaction.',
          'This verification link has expired or is invalid.',
          'Use checkout operations for grouped bookings.',
          'A selected trip is no longer available.',
        ].find((x) => x === error?.message),
        sqlCode: /^[A-Z0-9]{5}$/.test(error?.cause?.code ?? error?.code ?? '')
          ? (error?.cause?.code ?? error?.code)
          : undefined,
        errorKind: error instanceof assert.AssertionError ? 'assertion' : 'operation',
        fields: error?.data?.errors
          ?.map((x: { path?: string }) => x.path)
          .filter((x: unknown) => typeof x === 'string' && /^[a-zA-Z0-9_.-]+$/.test(x)),
      }),
    )
    process.exit(1)
  })
