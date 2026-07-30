import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sanitizeRedirect } from '@/lib/redirect'
import { getPayloadClient } from '@/lib/payload'
import {
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
  resolveReferralFromQuery,
} from '@/lib/referral'

const AUTH_PAGES = ['/login', '/register']

export async function middleware(req: NextRequest): Promise<NextResponse> {
  // Referral proxy: capture ?ref=CODE and set cookie if valid, then strip from URL
  const referralResult = await resolveReferralFromQuery(
    new URL(req.nextUrl.toString()),
    async (code) => {
      const payload = await getPayloadClient()
      const { docs } = await payload.find({
        collection: 'referrals',
        where: { and: [{ code: { equals: code } }, { active: { equals: true } }] },
        limit: 1,
        depth: 0,
      })
      const ref = docs[0] as { code: string } | undefined
      return ref ? { code: ref.code } : null
    },
  )

  // If ?ref was present, redirect to clean URL and set cookie if valid
  if (referralResult !== null) {
    const res = NextResponse.redirect(referralResult.cleanUrl, 302)
    if (referralResult.code) {
      res.cookies.set(REFERRAL_COOKIE_NAME, referralResult.code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
        path: '/',
      })
    }
    return res
  }

  // Auth middleware
  const { pathname } = req.nextUrl
  const token = req.cookies.get('payload-token')?.value

  if (pathname.startsWith('/account') && !token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname + (req.nextUrl.search ?? ''))
    return NextResponse.redirect(url)
  }

  if (token && AUTH_PAGES.includes(pathname)) {
    const target = sanitizeRedirect(req.nextUrl.searchParams.get('from')) ?? '/account'
    return NextResponse.redirect(new URL(target, req.url))
  }

  return NextResponse.next()
}

export const config = {
  // 'nodejs' runtime so the referral lookup can use the Payload local API
  // (Edge Runtime can't import @/lib/payload → @/payload.config which pulls in
  // node:path / node:url). Auth check below is also Node-runtime friendly.
  runtime: 'nodejs',
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
