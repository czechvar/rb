'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './RouteProgress.module.css'

/**
 * GitHub-style top loading bar.
 *
 * App Router navigations have no built-in progress UI: the current page stays
 * on screen while the next route's RSC payload streams in, so a slow page looks
 * like a dead click. This bar starts when a navigation is initiated and
 * finishes when the new route commits (i.e. when `usePathname` /
 * `useSearchParams` change).
 *
 * Navigation starts are detected from three sources so both `<Link>` clicks and
 * programmatic `router.push` / `router.replace` calls are covered:
 *   - capture-phase clicks on same-origin anchors,
 *   - patched `history.pushState` / `replaceState` (what the App Router calls),
 *   - `popstate` (browser back/forward).
 */

/** Nothing is drawn for navigations faster than this — avoids a flash. */
const START_DELAY_MS = 120
const TRICKLE_INTERVAL_MS = 200
/** Trickle asymptote: never reach 100% until the route actually commits. */
const CEILING = 92
/** How long the filled bar sits at 100% before it fades out. */
const FILL_HOLD_MS = 160
const FADE_MS = 260
/** Last resort, in case a navigation never commits (error, aborted fetch). */
const FAILSAFE_MS = 20_000

type Phase = 'idle' | 'loading' | 'finishing'

const urlKey = (url: URL) => `${url.pathname}${url.search}`

export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)

  const timeouts = useRef<number[]>([])
  const trickle = useRef<number | null>(null)
  /** A navigation is in flight (may still be inside the start delay). */
  const running = useRef(false)
  /** The bar is actually on screen (start delay has elapsed). */
  const visible = useRef(false)
  /** URL of the route currently rendered, used to ignore no-op history writes. */
  const committedUrl = useRef<string | null>(null)

  const clearTimers = useCallback(() => {
    timeouts.current.forEach((id) => window.clearTimeout(id))
    timeouts.current = []
    if (trickle.current !== null) {
      window.clearInterval(trickle.current)
      trickle.current = null
    }
  }, [])

  const finish = useCallback(() => {
    if (!running.current) return
    running.current = false
    clearTimers()

    if (!visible.current) {
      // Navigation resolved before the bar was ever shown.
      setPhase('idle')
      setProgress(0)
      return
    }

    setProgress(100)
    timeouts.current.push(window.setTimeout(() => setPhase('finishing'), FILL_HOLD_MS))
    timeouts.current.push(
      window.setTimeout(() => {
        visible.current = false
        setPhase('idle')
        setProgress(0)
      }, FILL_HOLD_MS + FADE_MS),
    )
  }, [clearTimers])

  const start = useCallback(() => {
    if (running.current) return
    running.current = true

    // A new navigation during the fade-out of the previous one resets the bar.
    clearTimers()
    visible.current = false
    setPhase('idle')
    setProgress(0)

    timeouts.current.push(
      window.setTimeout(() => {
        visible.current = true
        setProgress(8)
        setPhase('loading')
        trickle.current = window.setInterval(() => {
          setProgress((value) => value + (CEILING - value) * 0.12)
        }, TRICKLE_INTERVAL_MS)
      }, START_DELAY_MS),
    )

    timeouts.current.push(window.setTimeout(finish, FAILSAFE_MS))
  }, [clearTimers, finish])

  // The route committed: record the new URL and complete the bar.
  useEffect(() => {
    const url = `${pathname}${searchParams.toString() ? `?${searchParams}` : ''}`
    if (committedUrl.current === url) return
    const isFirstRender = committedUrl.current === null
    committedUrl.current = url
    if (!isFirstRender) finish()
  }, [pathname, searchParams, finish])

  useEffect(() => {
    const startUnless = (target: URL) => {
      // Ignore history writes that only re-state the URL we already render —
      // Next.js does this for scroll restoration and post-commit syncing.
      if (urlKey(target) === committedUrl.current) return
      start()
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as Element | null)?.closest?.('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || anchor.hasAttribute('download')) return
      const target = anchor.getAttribute('target')
      if (target && target !== '_self') return

      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      startUnless(url)
    }

    const onPopState = () => {
      startUnless(new URL(window.location.href))
    }

    const patch = (original: History['pushState']) =>
      function patched(this: History, ...args: Parameters<History['pushState']>) {
        const [, , nextUrl] = args
        if (nextUrl != null) {
          try {
            startUnless(new URL(String(nextUrl), window.location.href))
          } catch {
            // Malformed URL — leave navigation untouched.
          }
        }
        return original.apply(this, args)
      }

    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState
    window.history.pushState = patch(originalPushState)
    window.history.replaceState = patch(originalReplaceState)

    document.addEventListener('click', onClick, { capture: true })
    window.addEventListener('popstate', onPopState)

    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      document.removeEventListener('click', onClick, { capture: true })
      window.removeEventListener('popstate', onPopState)
      clearTimers()
    }
  }, [start, clearTimers])

  if (phase === 'idle') return null

  return (
    <div className={styles.track} aria-hidden="true">
      <div
        className={phase === 'finishing' ? `${styles.bar} ${styles.finishing}` : styles.bar}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
