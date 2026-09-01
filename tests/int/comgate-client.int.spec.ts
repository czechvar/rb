import { afterEach, describe, expect, it, vi } from 'vitest'
import { PaymentGatewayError } from '@/payments/gateway'
import { comgatePostForm } from '@/payments/comgate/client'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('comgatePostForm', () => {
  it('sends a form-urlencoded POST and parses the form-urlencoded response', async () => {
    let capturedInit: RequestInit | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        capturedInit = init
        return new Response(
          'code=0&message=OK&transId=ABCD-1234-EFGH&redirect=https%3A%2F%2Fpayments.comgate.cz%2Fclient%2Finstructions%2Findex',
          {
            status: 200,
          },
        )
      }),
    )

    const result = await comgatePostForm('https://payments.comgate.cz/v1.0/create', {
      merchant: 'M123',
      secret: 's3cr3t',
      price: '19900',
    })

    expect(result).toEqual({
      code: '0',
      message: 'OK',
      transId: 'ABCD-1234-EFGH',
      redirect: 'https://payments.comgate.cz/client/instructions/index',
    })
    expect(capturedInit?.method).toBe('POST')
    expect((capturedInit?.headers as Record<string, string>)['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    )
    expect(String(capturedInit?.body)).toBe('merchant=M123&secret=s3cr3t&price=19900')
  })

  it('wraps a non-200 response in PaymentGatewayError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 })),
    )
    await expect(comgatePostForm('https://payments.comgate.cz/v1.0/create', {})).rejects.toThrow(
      PaymentGatewayError,
    )
  })

  it('wraps a network failure in PaymentGatewayError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNRESET')
      }),
    )
    await expect(comgatePostForm('https://payments.comgate.cz/v1.0/create', {})).rejects.toThrow(
      PaymentGatewayError,
    )
  })
})
