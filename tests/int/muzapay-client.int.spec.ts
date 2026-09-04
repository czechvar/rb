// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PaymentGatewayError } from '@/payments/gateway'
import { MuzaPayClient } from '@/payments/muzapay/client'

afterEach(() => {
  vi.unstubAllGlobals()
})

const client = new MuzaPayClient('https://api.gate.int.pay.muza.cz')

describe('MuzaPayClient.postJson', () => {
  it('posts JSON against the base URL and parses the response', async () => {
    let capturedUrl = ''
    let capturedInit: RequestInit | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        capturedUrl = String(url)
        capturedInit = init
        return new Response(JSON.stringify({ paymentId: 'P1' }), { status: 200 })
      }),
    )

    const result = await client.postJson('/v2/payments/init?signature=abc', { amount: '9900' }, {
      Authorization: 'Bearer t',
    })

    expect(capturedUrl).toBe('https://api.gate.int.pay.muza.cz/v2/payments/init?signature=abc')
    expect(capturedInit?.method).toBe('POST')
    expect(capturedInit?.body).toBe('{"amount":"9900"}')
    const headers = capturedInit?.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers.Accept).toBe('application/json')
    expect(headers.Authorization).toBe('Bearer t')
    expect(result).toEqual({ paymentId: 'P1' })
  })

  it('throws on an unexpected status code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 400 })))
    await expect(client.postJson('/v2/payments/init', {})).rejects.toThrow(PaymentGatewayError)
  })

  it('throws on an unparseable body', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 200 })))
    await expect(client.postJson('/v2/payments/init', {})).rejects.toThrow(/parse/i)
  })

  it('wraps a transport failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED')
      }),
    )
    await expect(client.postJson('/v2/payments/init', {})).rejects.toThrow(PaymentGatewayError)
  })

  it('rejects a JSON array body', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[1,2,3]', { status: 200 })))
    await expect(client.postJson('/v2/payments/init', {})).rejects.toThrow(PaymentGatewayError)
  })
})

describe('MuzaPayClient.getJson', () => {
  it('sends a GET with the Accept header and parses the response', async () => {
    let capturedInit: RequestInit | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        capturedInit = init
        return new Response(JSON.stringify({ paymentState: 'PAID' }), { status: 200 })
      }),
    )

    const result = await client.getJson('/v2/payments/P1/state?signature=abc')
    expect(capturedInit?.method).toBe('GET')
    expect(result).toEqual({ paymentState: 'PAID' })
  })
})

describe('MuzaPayClient.put', () => {
  it('accepts the expected 202 and returns nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 202 })))
    await expect(client.put('/v2/payments/P1/cancel?signature=abc', {}, 202)).resolves.toBeUndefined()
  })

  it('throws when the status differs from the expected one', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })))
    await expect(client.put('/v2/payments/P1/cancel', {}, 202)).rejects.toThrow(/202/)
  })
})
