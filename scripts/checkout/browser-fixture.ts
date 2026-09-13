/** Called only inside a source copy against the guarded disposable browser database. */
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { getPayload } from 'payload'
import { quoteCart } from '../../src/lib/checkout/quote'
import { reserveCheckout } from '../../src/lib/checkout/reservations'
import { withCheckoutTransaction } from '../../src/lib/checkout/transaction'

let fixtureStage = 'initialization'
async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '')
  assert(
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      /^\/rb_seed_verify_[a-f0-9]+$/.test(url.pathname),
  )
  const config = await (await import('../../src/payload.config')).default
  config.logger = { options: { level: 'silent' } } as typeof config.logger
  const payload = await getPayload({ config })
  payload.sendEmail = async () => ({ id: 'browser-fixture-no-mail' })
  fixtureStage = 'event'
  const event = await payload.create({
    collection: 'events',
    data: {
      title: 'Browser climbing trip',
      slug: 'checkout-browser-trip',
      state: 'published',
    } as never,
  })
  fixtureStage = 'event-date'
  const eventDate = await payload.create({
    collection: 'event-dates',
    data: {
      event: event.id,
      dateFrom: '2030-08-01T00:00:00Z',
      dateTo: '2030-08-08T00:00:00Z',
      price: 400,
      priceCzk: 10000,
      vat: 21,
      currency: 'EUR',
      capacity: 30,
      active: true,
    },
  })
  fixtureStage = 'user'
  const user = await payload.create({
    collection: 'users',
    disableVerificationEmail: true,
    data: {
      name: 'Browser Fixture',
      email: 'checkout-browser@example.invalid',
      phone: '+420123456789',
      password: process.env.CHECKOUT_BROWSER_PASSWORD ?? '',
      role: 'customer',
      _verified: true,
    },
  })
  const billing = {
    firstName: 'Browser',
    lastName: 'Fixture',
    street: 'Fixture 1',
    city: 'Fixture',
    postalCode: '12345',
    country: 'CZ',
  }
  fixtureStage = 'legacy-order'
  await payload.create({
    collection: 'orders',
    data: {
      user: user.id,
      eventDate: eventDate.id,
      participants: [
        { firstName: 'Browser', lastName: 'Fixture', email: user.email, phone: user.phone },
      ],
      participantCount: 1,
      billingAddress: billing,
      unitPrice: 400,
      totalPrice: 400,
      vat: 21,
      currency: 'EUR',
      state: 'completed',
    },
  })
  fixtureStage = 'reservation'
  const checkout = await reserveCheckout(
    {
      submissionKey: randomUUID(),
      contact: { name: user.name, email: user.email, phone: user.phone },
      items: [{ eventDateId: eventDate.id, quantity: 1 }],
      billingAddress: billing,
    },
    user,
  )
  fixtureStage = 'quote'
  const quote = await quoteCart({ items: [{ eventDateId: eventDate.id, quantity: 1 }] })
  fixtureStage = 'unverified'
  const unverified = await withCheckoutTransaction(payload, (req) =>
    payload.create({
      collection: 'checkouts',
      req,
      overrideAccess: true,
      data: {
        reference: `BROWSER-${randomUUID()}`,
        submissionKey: randomUUID(),
        requestDigest: 'browser-fixture',
        state: 'unverified',
        customerKind: 'new',
        contact: {
          name: 'Browser Guest',
          email: 'checkout-browser-guest@example.invalid',
          phone: '+420123456789',
        },
        items: quote.items,
        currency: quote.currency,
        verificationHash: createHash('sha256')
          .update(process.env.CHECKOUT_BROWSER_TOKEN ?? '')
          .digest('hex'),
        verificationExpiresAt: '2030-01-01T00:00:00Z',
      },
    }),
  )
  console.log(
    JSON.stringify({
      fixtureReady: true,
      eventDateId: eventDate.id,
      checkoutId: checkout.id,
      unverifiedId: unverified.id,
      userId: user.id,
    }),
  )
  await payload.destroy()
}
main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const detail = error instanceof Error ? error.message : ''
    const cause =
      error instanceof Error ? (error.cause as { code?: unknown } | undefined) : undefined
    const code =
      typeof cause?.code === 'string' && /^[A-Z0-9]{5}$/.test(cause.code) ? cause.code : undefined
    const category = /duplicate key/i.test(detail)
      ? 'duplicate'
      : /revalid|static generation/i.test(detail)
        ? 'revalidation'
        : /validat/i.test(detail)
          ? 'validation'
          : /query/i.test(detail)
            ? 'query'
            : /connect|socket/i.test(detail)
              ? 'connection'
              : 'other'
    console.log(JSON.stringify({ fixtureFailed: true, fixtureStage, category, code }))
    process.exit(1)
  })
