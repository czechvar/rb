import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { contactNetwork, intakeContact } from '@/lib/contact/intake'

describe('contact request identity', () => {
  it('ignores spoofable forwarded headers outside Vercel and missing trusted headers', () => {
    const headers = new Headers({
      'x-forwarded-for': '192.0.2.5',
      'x-vercel-forwarded-for': '192.0.2.6',
    })
    expect(contactNetwork(headers, false)).toBe('unknown')
    expect(contactNetwork(new Headers({ 'x-forwarded-for': '192.0.2.5' }), true)).toBe('unknown')
    expect(contactNetwork(headers, true)).toBe('192.0.2.6')
  })
  it('groups equivalent IPv6 addresses and interface changes into one network', () => {
    const network = (ip: string) =>
      contactNetwork(new Headers({ 'x-vercel-forwarded-for': ip }), true)
    expect(network('2001:db8:1234:5678::1')).toBe(network('2001:0db8:1234:5678:abcd:1234:0:2'))
    expect(network('2001:db8::1')).toBe(network('2001:0db8:0000:0000:0:0:0:2'))
    expect(network('192.0.2.1, 192.0.2.2')).toBe('unknown')
  })
})

describe('contact intake failures', () => {
  const data = () => {
    const value = new FormData()
    for (const [key, field] of Object.entries({
      name: '[TEST contact-intake]',
      email: 'test@example.test',
      message: 'Question about a trip',
      preferredContact: 'email',
      submissionId: '8c141946-a4ed-4eee-b312-a9d745307b4a',
    }))
      value.set(key, field)
    return value
  }
  it('rejects honeypots before any database operation', async () => {
    const form = data()
    form.set('website', 'spam')
    const result = await intakeContact(form, {} as Payload, 'test', 'isolated-test-secret')
    expect(result.ok).toBe(false)
  })
  it('fails closed on unavailable rate storage, without querying or creating enquiries', async () => {
    const find = vi.fn()
    const create = vi.fn()
    const execute = vi.fn().mockRejectedValue(new Error('private diagnostic'))
    const payload = { db: { drizzle: { execute } }, find, create } as unknown as Payload
    const result = await intakeContact(data(), payload, 'test', 'isolated-test-secret')
    expect(result).toMatchObject({
      ok: false,
      formError: 'Your enquiry could not be saved. Please try again or contact us directly.',
    })
    expect(find).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })
  it('applies rate limits before even an identical retry can look up existing data', async () => {
    const find = vi.fn()
    const create = vi.fn()
    const execute = vi.fn().mockResolvedValue({ rows: [{ admitted: 2 }] })
    const payload = { db: { drizzle: { execute } }, find, create } as unknown as Payload
    expect(await intakeContact(data(), payload, 'test', 'isolated-test-secret')).toMatchObject({
      ok: false,
      formError: expect.stringContaining('Too many attempts'),
    })
    expect(find).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })
})
