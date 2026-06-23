import { NextResponse, type NextRequest } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import {
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
  resolveReferralFromQuery,
} from '@/lib/referral'

export const config = {
  // Run on every page request (excluding _next/static + admin + api which never
  // carry ?ref). Keep the matcher tight to avoid cookie chatter on assets.
  matcher: ['/((?!_next/static|_next/image|api|admin|favicon.ico).*)'],
}

export default async function proxy(req: NextRequest) {
  const result = await resolveReferralFromQuery(
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

  if (result === null) return NextResponse.next()

  const res = NextResponse.redirect(result.cleanUrl, 302)
  if (result.code) {
    res.cookies.set(REFERRAL_COOKIE_NAME, result.code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
      path: '/',
    })
  }
  return res
}
