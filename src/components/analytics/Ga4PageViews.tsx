'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { isPrivateAnalyticsPath } from '@/lib/analytics-privacy'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function Ga4PageViews(props: { measurementId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname || isPrivateAnalyticsPath(pathname)) return
    const send = () =>
      window.gtag?.('event', 'page_view', {
        page_path: pathname,
        page_location: window.location.origin + pathname,
        page_referrer: '',
      })
    if (window.gtag) send()
    else window.addEventListener('rockbusters:analytics-ready', send, { once: true })
    return () => window.removeEventListener('rockbusters:analytics-ready', send)
  }, [pathname, props.measurementId, searchParams])

  return null
}
