'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function Ga4PageViews(props: { measurementId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!window.gtag || !pathname) return

    const query = searchParams.toString()
    const pagePath = query ? `${pathname}?${query}` : pathname

    window.gtag('config', props.measurementId, {
      page_path: pagePath,
    })
  }, [pathname, props.measurementId, searchParams])

  return null
}
