import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

describe('auth middleware', () => {
  it('lets the login page validate a stale session cookie', async () => {
    const request = new NextRequest('http://localhost/login', {
      headers: { cookie: 'payload-token=stale-session-fixture' },
    })

    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(response.headers.get('location')).toBeNull()
  })
})
