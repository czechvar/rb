/** Disposable marked fixtures only; invoked by the guarded runner, never against local content or production. */
import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { getPayload } from 'payload'
import { sql } from 'drizzle-orm'
import { intakeContact } from '../../src/lib/contact/intake'
import { notifyContact } from '../../src/lib/contact/notification'
import { clearTestInbox, getTestInbox } from '../../src/lib/email/adapter'
import { CANONICAL_SEED_COLLECTIONS } from '../canonical-seed/shared'

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '')
  assert(
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      /^\/rb_seed_verify_[a-f0-9]+$/.test(url.pathname),
  )
  const config = await (await import('../../src/payload.config')).default
  config.logger = { options: { level: 'silent' } } as typeof config.logger
  const payload = await getPayload({ config })
  const checks: string[] = []
  const passed = (name: string) => {
    checks.push(name)
    console.log(JSON.stringify({ checkPassed: name }))
  }
  const form = (email = 'contact-fixture@example.invalid', id = randomUUID()) => {
    const data = new FormData()
    for (const [key, value] of Object.entries({
      submissionId: id,
      name: '[Contact test] Visitor',
      email,
      message: 'Fixture enquiry for isolated intake verification.',
      level: 'not-sure',
      interest: 'advice',
      preferredContact: 'email',
      phone: '',
      website: '',
    }))
      data.set(key, value)
    return data
  }
  const submit = (data: FormData, network = 'fixture-network') =>
    intakeContact(data, payload, network, 'isolated-test-signing-key')
  const resetLimits = () => payload.db.drizzle.execute(sql`DELETE FROM contact_intake_rate_limits`)
  try {
    assert(payload.db.tables.contact_intake_rate_limits)
    assert.equal(
      payload.db.schema.contact_intake_rate_limits,
      payload.db.tables.contact_intake_rate_limits,
    )
    passed('rate-table-registered-in-managed-payload-schema')
    assert(
      !CANONICAL_SEED_COLLECTIONS.some((item) => (item.slug as string) === 'contact-enquiries'),
    )
    passed('operational-intake-excluded-from-content-seed')
    await payload.create({
      collection: 'pages',
      data: {
        title: '[Contact test] Public desk fixture',
        slug: 'contact',
        status: 'published',
        layout: [
          {
            blockType: 'contact-details',
            heading: 'Fixture desks',
            email: 'contact-desk@example.invalid',
            desks: [{ label: 'Fixture desk', phone: '+420000000001' }],
          },
        ],
      },
      overrideAccess: true,
    })
    clearTestInbox()
    const data = form()
    assert.equal((await submit(data)).ok, true)
    assert.equal((await submit(data)).ok, true)
    const saved = await payload.find({
      collection: 'contact-enquiries',
      depth: 0,
      overrideAccess: true,
    })
    assert.equal(saved.totalDocs, 1)
    assert.equal(saved.docs[0].status, 'new')
    assert.equal(saved.docs[0].source, 'contact-page')
    assert.equal(saved.docs[0].notificationStatus, 'sent')
    assert(saved.docs[0].notifiedAt)
    assert.equal(getTestInbox().length, 1)
    assert.equal(getTestInbox()[0].to, 'contact-desk@example.invalid')
    passed('new-save-notifies-configured-cms-desk-once-through-test-adapter')
    passed('persisted-once-and-idempotent-retry')
    data.set('message', 'Changed fixture content must not reuse a receipt.')
    assert.equal((await submit(data)).ok, false)
    passed('changed-payload-cannot-reuse-submission-id')
    await resetLimits()
    const concurrent = form('parallel-contact@example.invalid')
    const retryResults = await Promise.all([submit(concurrent), submit(concurrent)])
    assert(retryResults.every((result) => result.ok))
    assert.equal(
      (
        await payload.find({
          collection: 'contact-enquiries',
          where: { submissionId: { equals: concurrent.get('submissionId') } },
          overrideAccess: true,
        })
      ).totalDocs,
      1,
    )
    assert.equal(getTestInbox().length, 2)
    passed('concurrent-identical-retries-create-one-record-and-one-notification')
    await resetLimits()
    const attempts = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        submit(form(`parallel-${index}@example.invalid`), 'shared-network'),
      ),
    )
    assert.equal(attempts.filter((result) => result.ok).length, 5)
    passed('atomic-network-limit-under-concurrency')
    await payload.db.drizzle.execute(
      sql`UPDATE contact_intake_rate_limits SET expires_at = now() - interval '1 second'`,
    )
    assert.equal((await submit(form('after-expiry@example.invalid'), 'shared-network')).ok, true)
    passed('expired-network-limit-resets')
    const retained = await payload.db.drizzle.execute(
      sql`SELECT count(*)::int total, count(*) FILTER (WHERE expires_at > now())::int active FROM contact_intake_rate_limits`,
    )
    assert.equal(retained.rows[0].total, 3)
    assert.equal(retained.rows[0].active, 3)
    passed('expired-buckets-cleaned-and-renewed-buckets-retained')
    await resetLimits()
    const emailResults = []
    for (let i = 0; i < 4; i++)
      emailResults.push(await submit(form('same-email@example.invalid'), `email-network-${i}`))
    assert.equal(emailResults.filter((result) => result.ok).length, 3)
    passed('email-limit-enforced-across-networks')
    await resetLimits()
    const globalKey = createHmac('sha256', 'isolated-test-signing-key')
      .update('global')
      .digest('hex')
    await payload.db.drizzle.execute(
      sql`INSERT INTO contact_intake_rate_limits (key,count,expires_at) VALUES (${globalKey},100,now() + interval '10 minutes')`,
    )
    const beforeGlobal = (
      await payload.count({ collection: 'contact-enquiries', overrideAccess: true })
    ).totalDocs
    assert.equal((await submit(form('global-cap@example.invalid'), 'new-global-network')).ok, false)
    assert.equal(
      (await payload.count({ collection: 'contact-enquiries', overrideAccess: true })).totalDocs,
      beforeGlobal,
    )
    const globalBuckets = await payload.db.drizzle.execute(
      sql`SELECT count(*)::int total FROM contact_intake_rate_limits`,
    )
    assert.equal(globalBuckets.rows[0].total, 1)
    for (let i = 0; i < 5; i++)
      assert.equal(
        (await submit(form(`global-rotate-${i}@example.invalid`), `global-rotate-network-${i}`)).ok,
        false,
      )
    assert.equal(
      (
        await payload.db.drizzle.execute(
          sql`SELECT count(*)::int total FROM contact_intake_rate_limits`,
        )
      ).rows[0].total,
      1,
    )
    passed('global-limit-rejects-without-persistence-or-identity-bucket-growth')
    const countBefore = (
      await payload.count({ collection: 'contact-enquiries', overrideAccess: true })
    ).totalDocs
    const trap = form()
    trap.set('website', 'https://fixture.invalid')
    assert.equal((await submit(trap)).ok, false)
    const phone = form()
    phone.set('preferredContact', 'phone')
    phone.set('phone', '')
    assert.equal((await submit(phone)).ok, false)
    assert.equal(
      (await payload.count({ collection: 'contact-enquiries', overrideAccess: true })).totalDocs,
      countBefore,
    )
    passed('honeypot-and-invalid-phone-create-no-record')
    const id = saved.docs[0].id
    for (const user of [undefined, { id: 999999, role: 'customer', collection: 'users' }]) {
      const access = { overrideAccess: false, user: user as never }
      await assert.rejects(() => payload.find({ ...access, collection: 'contact-enquiries' }))
      await assert.rejects(() =>
        payload.create({
          ...access,
          collection: 'contact-enquiries',
          data: { ...saved.docs[0], submissionId: randomUUID() },
        }),
      )
      await assert.rejects(() =>
        payload.update({
          ...access,
          collection: 'contact-enquiries',
          id,
          data: { status: 'handled' },
        }),
      )
      await assert.rejects(() => payload.delete({ ...access, collection: 'contact-enquiries', id }))
    }
    passed('anonymous-and-customer-crud-denied')
    const admin = { id: 999998, role: 'admin', collection: 'users' } as never
    assert.equal(
      (
        await payload.findByID({
          collection: 'contact-enquiries',
          id,
          overrideAccess: false,
          user: admin,
        })
      ).id,
      id,
    )
    await payload.update({
      collection: 'contact-enquiries',
      id,
      data: { status: 'handled' },
      overrideAccess: false,
      user: admin,
    })
    passed('admin-can-read-and-handle-enquiry')
    await payload.db.drizzle.execute(
      sql`ALTER TABLE contact_intake_rate_limits RENAME TO contact_intake_rate_limits_fixture_unavailable`,
    )
    try {
      assert.equal((await submit(form('store-failure@example.invalid'))).ok, false)
      assert.equal(
        (await payload.count({ collection: 'contact-enquiries', overrideAccess: true })).totalDocs,
        countBefore,
      )
    } finally {
      await payload.db.drizzle.execute(
        sql`ALTER TABLE contact_intake_rate_limits_fixture_unavailable RENAME TO contact_intake_rate_limits`,
      )
    }
    passed('rate-store-failure-fails-closed-without-persistence')
    await resetLimits()
    const originalSendEmail = payload.sendEmail
    let failureSendCalls = 0
    payload.sendEmail = async () => {
      failureSendCalls += 1
      throw new Error('isolated-provider-failure')
    }
    try {
      const failing = form('provider-failure@example.invalid')
      assert.equal((await submit(failing, 'provider-failure-network')).ok, true)
      assert.equal((await submit(failing, 'provider-failure-network')).ok, true)
      assert.equal(failureSendCalls, 1)
      const failed = await payload.find({
        collection: 'contact-enquiries',
        where: { submissionId: { equals: failing.get('submissionId') } },
        overrideAccess: true,
      })
      assert.equal(failed.totalDocs, 1)
      assert.equal(failed.docs[0].notificationStatus, 'failed')
      assert.equal(failed.docs[0].notifiedAt, null)
      passed('provider-failure-keeps-accepted-record-and-does-not-resend-on-retry')
      const silent = form('console-mode@example.invalid')
      assert.equal(
        (
          await intakeContact(
            silent,
            payload,
            'console-mode-network',
            'isolated-test-signing-key',
            (client, enquiry) => notifyContact(client, enquiry, { mode: 'console' }),
          )
        ).ok,
        true,
      )
      const notConfigured = await payload.find({
        collection: 'contact-enquiries',
        where: { submissionId: { equals: silent.get('submissionId') } },
        overrideAccess: true,
      })
      assert.equal(notConfigured.docs[0].notificationStatus, 'notConfigured')
      assert.equal(notConfigured.docs[0].notifiedAt, null)
      assert.equal(failureSendCalls, 1)
      passed('console-mode-persists-not-configured-and-never-calls-mail-adapter')
    } finally {
      payload.sendEmail = originalSendEmail
      clearTestInbox()
    }
    console.log(JSON.stringify({ intakeVerificationPassed: true, checks }))
  } finally {
    await payload.destroy()
  }
}
main()
  .then(() => process.exit(0))
  .catch(() => {
    console.error('intake verification failed; details suppressed')
    process.exit(1)
  })
