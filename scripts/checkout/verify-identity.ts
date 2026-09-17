/** Disposable fixture data only; invoked by the guarded checkout sandbox runner. */
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import {
  createGuestCheckout,
  completeGuestPayment,
  completeGuestReservation,
  verifyGuestCheckout,
  reviewGuestCheckout,
  acceptCheckoutInvitation,
  checkoutVerificationCodeHash,
  lookupCheckoutJourney,
  invitationKind,
} from '../../src/lib/checkout/identity'
import {
  isReturningPurchaser,
  reserveCheckoutForReview,
} from '../../src/lib/checkout/reservations'
import { withCheckoutTransaction } from '../../src/lib/checkout/transaction'
import type { CheckoutRecord } from '../../src/lib/checkout/types'

export async function verifyIdentity(payload: Payload): Promise<void> {
  const originalSend = payload.sendEmail
  const messages: Array<{ to: unknown; text: string }> = []
  payload.sendEmail = async (args) => {
    messages.push({ to: args.to, text: typeof args.text === 'string' ? args.text : '' })
    return { id: 'checkout-identity-test' }
  }
  const passed = (checkPassed: string) => console.log(JSON.stringify({ checkPassed }))
  const record = async (id: number) =>
    (await payload.findByID({
      collection: 'checkouts',
      id,
      depth: 0,
      overrideAccess: true,
    })) as unknown as CheckoutRecord
  const verificationCodeFromLastMessage = () => {
    const text = messages.at(-1)?.text ?? ''
    assert(!/https?:\/\//.test(text), 'verification-email-has-no-link')
    const code = text.match(/\b\d{6}\b/)?.[0]
    assert(Boolean(code), 'fixture-email-code-present')
    return code!
  }
  const invitationTokenFromLastMessage = () => {
    const text = messages.at(-1)?.text ?? ''
    const match = text.match(/https?:\/\/[^\s]+/)
    assert(Boolean(match), 'fixture-email-link-present')
    const link = new URL(match![0])
    assert(!link.searchParams.has('token'), 'token-must-not-reach-request-url')
    const token = new URLSearchParams(link.hash.slice(1)).get('token')
    assert(Boolean(token), 'fixture-email-token-present')
    return token!
  }
  try {
    const event = await payload.create({
      collection: 'events',
      data: {
        title: '[Checkout identity test] Trip',
        slug: 'checkout-identity-test',
        state: 'published',
      } as never,
    })
    const date = await payload.create({
      collection: 'event-dates',
      data: {
        slug: 'test-occurrence-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        event: event.id,
        dateFrom: '2030-08-01T00:00:00Z',
        dateTo: '2030-08-08T00:00:00Z',
        price: 100,
        vat: 21,
        currency: 'EUR',
        capacity: 20,
        active: true,
      },
    })
    const staff = await payload.create({
      collection: 'users',
      disableVerificationEmail: true,
      data: {
        name: '[Checkout identity test] Staff',
        email: 'checkout-identity-staff@example.invalid',
        phone: '+420123456789',
        password: randomUUID(),
        role: 'admin',
        _verified: true,
      },
    })
    const contact = {
      name: '[Checkout identity test] Guest',
      email: 'checkout-identity-guest@example.invalid',
      phone: '',
    }
    const id = await createGuestCheckout(
      { submissionKey: randomUUID(), contact, items: [{ eventDateId: date.id, quantity: 2 }] },
      'fixture-guest-network',
    )
    const verificationCode = verificationCodeFromLastMessage()
    assert.equal((await record(id)).state, 'unverified')
    assert(
      (await record(id)).verificationHash ===
        checkoutVerificationCodeHash(verificationCode, process.env.PAYLOAD_SECRET ?? ''),
      'only-keyed-code-hash-persisted',
    )
    assert.equal(
      (await payload.find({ collection: 'orders', where: { checkout: { equals: id } }, depth: 0 }))
        .totalDocs,
      0,
    )
    passed('guest-code-email-sent-without-reserving-seats')
    await assert.rejects(() => verifyGuestCheckout(id, '12345', 'fixture-guest-network'))
    const wrongCode = String((Number(verificationCode) + 1) % 1_000_000).padStart(6, '0')
    await assert.rejects(() => verifyGuestCheckout(id, wrongCode, 'fixture-guest-network'))
    assert.equal((await record(id)).state, 'unverified')
    passed('malformed-and-wrong-codes-never-reserve-seats')
    await verifyGuestCheckout(id, verificationCode, 'fixture-guest-network')
    await assert.rejects(() => verifyGuestCheckout(id, verificationCode, 'fixture-guest-network'))
    assert.equal((await record(id)).verificationHash, null)
    assert.equal((await record(id)).state, 'awaitingReview')
    passed('valid-code-reserves-once-and-clears-code')
    await reviewGuestCheckout(id, staff, 'approve', '[Checkout identity test] Approved')
    const invitationToken = invitationTokenFromLastMessage()
    assert.equal((await record(id)).state, 'approved')
    const orders = await payload.find({
      collection: 'orders',
      where: { checkout: { equals: id } },
      depth: 0,
    })
    assert(orders.docs.every((order) => order.state === 'confirmed'))
    passed('staff-approval-confirms-orders-and-sends-invitation')
    const accepted = await acceptCheckoutInvitation(
      id,
      invitationToken,
      { name: '[Checkout identity test] Edited account name', password: 'FixturePassword42!' },
      null,
      'fixture-invite-network',
    )
    assert.equal(accepted.created, true)
    assert.equal(accepted.email, contact.email)
    const attached = await record(id)
    assert(attached.user)
    assert.equal(attached.invitationHash, null)
    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: contact.email } },
      limit: 1,
      depth: 0,
    })
    assert.equal(users.totalDocs, 1)
    assert.equal(users.docs[0].name, '[Checkout identity test] Edited account name')
    assert.equal(users.docs[0]._verified, true)
    assert.equal(users.docs[0].role, 'customer')
    assert(!users.docs[0].phone)
    await assert.rejects(() =>
      acceptCheckoutInvitation(
        id,
        invitationToken,
        { name: contact.name, password: 'FixturePassword42!' },
        null,
        'fixture-invite-network',
      ),
    )
    assert.equal(await isReturningPurchaser(payload, users.docs[0]), false)
    passed('guest-invitation-creates-verified-account-once-without-purchase-shortcut')

    const existingContact = {
      name: '[Checkout identity test] Existing',
      email: 'checkout-identity-existing@example.invalid',
      phone: '+420123456789',
    }
    const existingId = await createGuestCheckout(
      {
        submissionKey: randomUUID(),
        contact: existingContact,
        items: [{ eventDateId: date.id, quantity: 1 }],
      },
      'fixture-existing-network',
    )
    await verifyGuestCheckout(
      existingId,
      verificationCodeFromLastMessage(),
      'fixture-existing-network',
    )
    await reviewGuestCheckout(
      existingId,
      staff,
      'approve',
      '[Checkout identity test] Existing account',
    )
    const existingToken = invitationTokenFromLastMessage()
    const existing = await payload.create({
      collection: 'users',
      disableVerificationEmail: true,
      data: {
        ...existingContact,
        password: 'OriginalFixturePassword42!',
        role: 'customer',
        _verified: true,
      },
    })
    await assert.rejects(() =>
      acceptCheckoutInvitation(
        existingId,
        existingToken,
        { name: existing.name, password: 'ChangedPassword42!' },
        null,
        'fixture-existing-invite-network',
      ),
    )
    await acceptCheckoutInvitation(
      existingId,
      existingToken,
      {},
      existing,
      'fixture-existing-invite-network',
    )
    assert.equal((await record(existingId)).user, existing.id)
    const login = await payload.login({
      collection: 'users',
      data: { email: existing.email, password: 'OriginalFixturePassword42!' },
    })
    assert(Boolean(login.user), 'existing-account-password-preserved')
    passed('invitation-reuses-only-matching-authenticated-account-and-preserves-password')

    assert.equal(
      await lookupCheckoutJourney(
        'checkout-identity-unknown@example.invalid',
        'fixture-lookup-network',
      ),
      'new',
    )
    assert.equal(await lookupCheckoutJourney(existing.email, 'fixture-lookup-network'), 'login')

    const payEmail = 'checkout-identity-pay-now@example.invalid'
    const payId = await createGuestCheckout(
      {
        submissionKey: randomUUID(),
        contact: { name: '[Pending checkout]', email: payEmail, phone: '' },
        items: [{ eventDateId: date.id, quantity: 1 }],
      },
      'fixture-pay-now-network',
    )
    const payCode = verificationCodeFromLastMessage()
    await completeGuestPayment(
      payId,
      payCode,
      {
        name: '[Checkout identity test] Pay now',
        email: payEmail,
        phone: '+420123456789',
        password: 'FixturePassword42!',
      },
      'fixture-pay-now-network',
    )
    const paidNow = await record(payId)
    assert.equal(paidNow.state, 'reserved')
    assert(paidNow.user)
    assert.equal(paidNow.verificationHash, null)
    assert.equal(
      (await payload.find({ collection: 'orders', where: { checkout: { equals: payId } } }))
        .totalDocs,
      1,
    )
    await assert.rejects(() =>
      completeGuestPayment(
        payId,
        payCode,
        {
          name: '[Checkout identity test] Pay now',
          email: payEmail,
          phone: '+420123456789',
          password: 'FixturePassword42!',
        },
        'fixture-pay-now-replay-network',
      ),
    )
    passed('pay-now-verification-creates-account-and-reserves-once')

    const reserveEmail = 'checkout-identity-reserve-now@example.invalid'
    const reserveId = await createGuestCheckout(
      {
        submissionKey: randomUUID(),
        contact: { name: '[Pending checkout]', email: reserveEmail, phone: '' },
        items: [{ eventDateId: date.id, quantity: 1 }],
      },
      'fixture-reserve-now-network',
    )
    await completeGuestReservation(
      reserveId,
      verificationCodeFromLastMessage(),
      {
        name: '[Checkout identity test] Reserve now',
        email: reserveEmail,
        phone: '',
      },
      'fixture-reserve-now-network',
    )
    const reservedNow = await record(reserveId)
    assert.equal(reservedNow.state, 'awaitingReview')
    assert.equal(reservedNow.contact.name, '[Checkout identity test] Reserve now')
    assert(!reservedNow.user)
    passed('reserve-now-verification-collects-details-before-review')

    const knownReview = await reserveCheckoutForReview(
      {
        submissionKey: randomUUID(),
        contact: existingContact,
        items: [{ eventDateId: date.id, quantity: 1 }],
      },
      existing,
    )
    assert.equal(knownReview.state, 'awaitingReview')
    await reviewGuestCheckout(
      knownReview.id,
      staff,
      'approve',
      '[Checkout identity test] Known reserve now',
    )
    assert.deepEqual(
      await invitationKind(knownReview.id, invitationTokenFromLastMessage(), null),
      { kind: 'login' },
    )
    passed('known-reserve-now-approval-routes-to-login')

    const buyer = await payload.create({
      collection: 'users',
      disableVerificationEmail: true,
      data: {
        name: '[Checkout identity test] Buyer',
        email: 'checkout-identity-buyer@example.invalid',
        phone: '+420123456789',
        password: randomUUID(),
        role: 'customer',
        _verified: true,
      },
    })
    await payload.create({
      collection: 'orders',
      data: {
        user: buyer.id,
        eventDate: date.id,
        participants: [
          { firstName: 'Fixture', lastName: 'Buyer', email: buyer.email, phone: buyer.phone },
        ],
        participantCount: 1,
        billingAddress: {
          firstName: 'Fixture',
          lastName: 'Buyer',
          street: 'Fixture 1',
          city: 'Fixture',
          postalCode: '12345',
          country: 'CZ',
        },
        unitPrice: 100,
        totalPrice: 100,
        vat: 21,
        currency: 'EUR',
        state: 'paid',
      },
    })
    assert.equal(await lookupCheckoutJourney(buyer.email, 'fixture-lookup-network'), 'login')
    const bypassKey = randomUUID()
    await assert.rejects(
      () =>
        createGuestCheckout(
          {
            submissionKey: bypassKey,
            contact: { name: buyer.name, email: buyer.email, phone: buyer.phone },
            items: [{ eventDateId: date.id, quantity: 1 }],
          },
          'fixture-buyer-network',
        ),
      /Sign in to your existing purchaser account/,
    )
    assert.equal(
      (
        await payload.find({
          collection: 'checkouts',
          where: { submissionKey: { equals: bypassKey } },
          overrideAccess: true,
        })
      ).totalDocs,
      0,
    )
    passed('email-first-routes-any-known-account-to-login')
    passed('returning-purchaser-cannot-bypass-login-through-guest-create')

    const expiredId = await createGuestCheckout(
      {
        submissionKey: randomUUID(),
        contact: { ...contact, email: 'checkout-identity-expired@example.invalid' },
        items: [{ eventDateId: date.id, quantity: 1 }],
      },
      'fixture-expiry-network',
    )
    const expiredCode = verificationCodeFromLastMessage()
    await withCheckoutTransaction(payload, (req) =>
      payload.update({
        collection: 'checkouts',
        id: expiredId,
        data: { verificationExpiresAt: '2020-01-01T00:00:00Z' },
        req,
        overrideAccess: true,
      }),
    )
    await assert.rejects(() =>
      verifyGuestCheckout(expiredId, expiredCode, 'fixture-expiry-network'),
    )
    assert.equal((await record(expiredId)).state, 'unverified')
    passed('expired-verification-never-reserves-seats')

    payload.sendEmail = async () => {
      throw new Error('isolated-provider-failure')
    }
    const failedKey = randomUUID()
    await assert.rejects(() =>
      createGuestCheckout(
        {
          submissionKey: failedKey,
          contact: { ...contact, email: 'checkout-identity-mailfailure@example.invalid' },
          items: [{ eventDateId: date.id, quantity: 1 }],
        },
        'fixture-failure-network',
      ),
    )
    const failed = await payload.find({
      collection: 'checkouts',
      where: { submissionKey: { equals: failedKey } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    assert.equal(failed.docs[0].state, 'unverified')
    assert.equal(failed.docs[0].notificationStatus, 'failed')
    assert.equal(
      (
        await payload.find({
          collection: 'orders',
          where: { checkout: { equals: failed.docs[0].id } },
          depth: 0,
        })
      ).totalDocs,
      0,
    )
    passed('email-failure-is-honest-and-never-reserves-seats')
  } finally {
    payload.sendEmail = originalSend
  }
}
