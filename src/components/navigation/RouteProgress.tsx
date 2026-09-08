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

/** Width the bar mounts at, so a navigation registers instantly. */
const START_PROGRESS = 8
/** Bumped on the next frame, so the bar animates in instead of popping. */
const RAMP_PROGRESS = 20
/**
 * The bar is shown on every navigation, with no suppression window: prerendered
 * and prefetched routes commit in ~150ms, which any start delay long enough to
 * be worth having would swallow entirely. Instead a fast navigation is held
 * open to this minimum so it reads as a deliberate sweep rather than a flicker.
 */
const MIN_VISIBLE_MS = 250
const TRICKLE_INTERVAL_MS = 200
/** Trickle asymptote: never reach 100% until the route actually commits. */
const CEILING = 92
/** How long the filled bar sits at 100% before it fades out. */
const FILL_HOLD_MS = 120
const FADE_MS = 200
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
  const failsafe = useRef<number | null>(null)
  const raf = useRef<number | null>(null)
  /** A navigation is in flight. */
  const running = useRef(false)
  const startedAt = useRef(0)
  /** URL of the route currently rendered, used to ignore no-op history writes. */
  const committedUrl = useRef<string | null>(null)

  const clearTrickle = useCallback(() => {
    if (trickle.current !== null) {
      window.clearInterval(trickle.current)
      trickle.current = null
    }
  }, [])

  const clearTimers = useCallback(() => {
    timeouts.current.forEach((id) => window.clearTimeout(id))
    timeouts.current = []
    if (failsafe.current !== null) {
      window.clearTimeout(failsafe.current)
      failsafe.current = null
    }
    if (raf.current !== null) {
      window.cancelAnimationFrame(raf.current)
      raf.current = null
    }
    clearTrickle()
  }, [clearTrickle])

  const finish = useCallback(() => {
    if (!running.current) return
    running.current = false

    if (failsafe.current !== null) {
      window.clearTimeout(failsafe.current)
      failsafe.current = null
    }

    // Keep trickling through the remainder of the minimum, so the bar is still
    // moving rather than frozen while it waits to complete.
    const remaining = Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt.current))

    timeouts.current.push(
      window.setTimeout(() => {
        clearTrickle()
        setProgress(100)
        timeouts.current.push(window.setTimeout(() => setPhase('finishing'), FILL_HOLD_MS))
        timeouts.current.push(
          window.setTimeout(() => {
            setPhase('idle')
            setProgress(0)
          }, FILL_HOLD_MS + FADE_MS),
        )
      }, remaining),
    )
  }, [clearTrickle])

  const start = useCallback(() => {
    if (running.current) return
    running.current = true
    startedAt.current = performance.now()

    // A new navigation during the fade-out of the previous one resets the bar.
    clearTimers()
    setProgress(START_PROGRESS)
    setPhase('loading')

    raf.current = window.requestAnimationFrame(() => {
      raf.current = null
      setProgress((value) => Math.max(value, RAMP_PROGRESS))
    })

    trickle.current = window.setInterval(() => {
      setProgress((value) => value + (CEILING - value) * 0.12)
    }, TRICKLE_INTERVAL_MS)

    failsafe.current = window.setTimeout(finish, FAILSAFE_MS)
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
