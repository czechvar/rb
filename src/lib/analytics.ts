'use client'

export type AnalyticsEventParams = Record<string, boolean | number | string | null | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(eventName: string, params: AnalyticsEventParams = {}) {
  if (typeof window === 'undefined') return

  const eventParams = {
    ...params,
    ...(process.env.NODE_ENV !== 'production' ? { debug_mode: true } : {}),
  }

  if (window.gtag) {
    window.gtag('event', eventName, compactParams(eventParams))
    return
  }

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(['event', eventName, compactParams(eventParams)])
}

function compactParams(params: AnalyticsEventParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}
