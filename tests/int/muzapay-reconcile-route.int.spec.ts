// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import { GET } from '@/app/api/payments/muzapay/reconcile/route'

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

// sweepBenefitPlusPayments constructs the MuzaPay gateway unconditionally
// (before it even looks for begun transactions), so its config must be
// present or the 200-path test would fail for an unrelated reason.
process.env.MUZAPAY_BASE_URL = 'https://api.gate.int.pay.muza.cz'
process.env.MUZAPAY_ESHOP_ID = 'ESHOP1'
process.env.MUZAPAY_ESHOP_PASSWORD = 'pw'
process.env.MUZAPAY_PRIVATE_KEY = Buffer.from(privateKey).toString('base64')
process.env.NEXT_PUBLIC_SITE_URL = 'https://beta.rockbusters.net'

const RECONCILE_URL = 'https://beta.rockbusters.net/api/payments/muzapay/reconcile'
const REAL_SECRET = 'test-cron-secret-abc123'

let originalSecret: string | undefined

beforeEach(() => {
  originalSecret = process.env.CRON_SECRET
})

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.CRON_SECRET
  } else {
    process.env.CRON_SECRET = originalSecret
  }
  vi.unstubAllGlobals()
})

/** Stubs fetch so a 200-path invocation cannot make any real network calls. */
function stubFetchNoOp() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{}', { status: 404 })),
  )
}

function requestWith(authorization?: string): Request {
  const headers = new Headers()
  if (authorization !== undefined) headers.set('authorization', authorization)
  return new Request(RECONCILE_URL, { headers })
}

describe('GET /api/payments/muzapay/reconcile', () => {
  it('returns 503 and does not run the sweep when CRON_SECRET is unset', async () => {
    delete process.env.CRON_SECRET
    const fetchSpy = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)

    const response = await GET(requestWith(`Bearer whatever`))

    expect(response.status).toBe(503)
    // The sweep would call fetch (auth token, status checks) if it ran.
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns 401 when the authorization header is absent', async () => {
    process.env.CRON_SECRET = REAL_SECRET
    const response = await GET(requestWith(undefined))
    expect(response.status).toBe(401)
  })

  it('returns 401 when the header is malformed (missing the Bearer prefix)', async () => {
    process.env.CRON_SECRET = REAL_SECRET
    const response = await GET(requestWith(REAL_SECRET))
    expect(response.status).toBe(401)
  })

  it('returns 401 when the header carries only a strict prefix of the real secret', async () => {
    process.env.CRON_SECRET = REAL_SECRET
    const response = await GET(requestWith(`Bearer ${REAL_SECRET.slice(0, -1)}`))
    expect(response.status).toBe(401)
  })

  it('returns 200 with a JSON summary on an exact match', async () => {
    process.env.CRON_SECRET = REAL_SECRET
    stubFetchNoOp()

    const response = await GET(requestWith(`Bearer ${REAL_SECRET}`))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({
      checked: expect.any(Number),
      resolved: expect.any(Number),
      failed: expect.any(Number),
    })
  })
})
