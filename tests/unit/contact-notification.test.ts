import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { notifyContact } from '@/lib/contact/notification'

const enquiry = {
  id: 12,
  name: 'Test Climber',
  email: 'visitor@example.test',
  preferredContact: 'email' as const,
  phone: '',
  level: 'beginner',
  interest: 'sport',
  message: '<b>A plain text question</b>',
}

function client() {
  const sendEmail = vi.fn().mockResolvedValue({ id: 'test-message' })
  const update = vi.fn().mockResolvedValue({})
  const find = vi
    .fn()
    .mockResolvedValue({
      docs: [{ layout: [{ blockType: 'contact-details', email: 'desk@example.test' }] }],
    })
  return { sendEmail, update, find, payload: { sendEmail, update, find } as unknown as Payload }
}

describe('saved contact notification', () => {
  it('sends plain text to the configured inbox with the visitor as Reply-To and records acceptance', async () => {
    const test = client()
    await notifyContact(test.payload, enquiry, { mode: 'test', recipient: 'desk@example.test' })
    expect(test.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'desk@example.test',
        replyTo: 'visitor@example.test',
        subject: 'Rockbusters contact enquiry #12',
        text: expect.stringContaining(enquiry.message),
      }),
    )
    expect(test.sendEmail.mock.calls[0][0].html).toBeUndefined()
    expect(test.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 12,
        data: { notificationStatus: 'sent', notifiedAt: expect.any(String) },
      }),
    )
  })
  it('resolves the published CMS contact inbox when the override is empty', async () => {
    const test = client()
    await notifyContact(test.payload, enquiry, { mode: 'test', recipient: '' })
    expect(test.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        overrideAccess: false,
        where: { and: [{ slug: { equals: 'contact' } }, { status: { equals: 'published' } }] },
      }),
    )
    expect(test.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'desk@example.test' }),
    )
  })
  it('never sends private content to the console adapter', async () => {
    const test = client()
    await notifyContact(test.payload, enquiry, { mode: 'console', recipient: 'desk@example.test' })
    expect(test.sendEmail).not.toHaveBeenCalled()
    expect(test.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { notificationStatus: 'notConfigured' } }),
    )
  })
  it('rejects malformed recipients without sending', async () => {
    const test = client()
    await notifyContact(test.payload, enquiry, {
      mode: 'test',
      recipient: 'desk@example.test\r\nBcc:other@example.test',
    })
    expect(test.sendEmail).not.toHaveBeenCalled()
    expect(test.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { notificationStatus: 'notConfigured' } }),
    )
  })
  it('records provider failure without exposing errors or failing the stored enquiry', async () => {
    const test = client()
    test.sendEmail.mockRejectedValue(new Error('private provider diagnostic'))
    await expect(
      notifyContact(test.payload, enquiry, { mode: 'test', recipient: 'desk@example.test' }),
    ).resolves.toBeUndefined()
    expect(test.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { notificationStatus: 'failed' } }),
    )
    test.update.mockRejectedValue(new Error('private database diagnostic'))
    await expect(
      notifyContact(test.payload, enquiry, { mode: 'test', recipient: 'desk@example.test' }),
    ).resolves.toBeUndefined()
  })
})
