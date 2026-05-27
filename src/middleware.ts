import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_PAGES = ['/login', '/register']

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('payload-token')?.value

  if (pathname.startsWith('/account') && !token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname + (req.nextUrl.search ?? ''))
    return NextResponse.redirect(url)
  }

  if (token && AUTH_PAGES.includes(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = '/account'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/login', '/register'],
}
