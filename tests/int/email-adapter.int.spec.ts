import { describe, expect, it, beforeEach } from 'vitest'
import { buildEmailAdapter, getTestInbox, clearTestInbox } from '../../src/lib/email/adapter'

describe('email adapter', () => {
  beforeEach(() => {
    clearTestInbox()
  })

  it('in test mode, captures sends into the test inbox', async () => {
    const adapter = buildEmailAdapter({
      apiKey: '',
      defaultFromAddress: 'noreply@test.example',
      defaultFromName: 'Test',
      mode: 'test',
    })
    const built = adapter({} as never)
    await built.sendEmail({
      to: 'a@example.com',
      subject: 'Hello',
      html: '<p>hi</p>',
    })
    const inbox = getTestInbox()
    expect(inbox).toHaveLength(1)
    expect(inbox[0]).toMatchObject({
      to: 'a@example.com',
      subject: 'Hello',
      html: '<p>hi</p>',
    })
  })
})
