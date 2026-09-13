'use client'

import Script from 'next/script'
import { Suspense, useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isPrivateAnalyticsPath } from '@/lib/analytics-privacy'
import { Ga4PageViews } from './Ga4PageViews'

const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
const debugMode = process.env.NODE_ENV !== 'production'

export function DirectGa4Client() {
  const pathname = usePathname()
  const privatePage = isPrivateAnalyticsPath(pathname ?? '/')
  useLayoutEffect(() => {
    if (measurementId)
      (window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = privatePage
  }, [privatePage])
  if (privatePage || !measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-direct-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false, page_location: window.location.origin + window.location.pathname, page_referrer: '', debug_mode: ${debugMode ? 'true' : 'false'} });
          window.dispatchEvent(new Event('rockbusters:analytics-ready'));
        `}
      </Script>
      <Suspense fallback={null}>
        <Ga4PageViews measurementId={measurementId} />
      </Suspense>
    </>
  )
}
