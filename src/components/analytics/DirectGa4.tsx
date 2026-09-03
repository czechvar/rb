import Script from 'next/script'
import { Suspense } from 'react'
import { Ga4PageViews } from './Ga4PageViews'

const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
const debugMode = process.env.NODE_ENV !== 'production'

export function DirectGa4() {
  if (!measurementId || process.env.SITE_INDEXABLE === 'true') return null

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
          gtag('config', '${measurementId}', { debug_mode: ${debugMode ? 'true' : 'false'} });
        `}
      </Script>
      <Suspense fallback={null}>
        <Ga4PageViews measurementId={measurementId} />
      </Suspense>
    </>
  )
}
