// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { useInsertionEffect } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RouteProgress } from '@/components/navigation/RouteProgress'

const route = vi.hoisted(() => ({ pathname: '/before' }))
vi.mock('next/navigation', () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(),
}))

// Next's HistoryUpdater writes history during the insertion-effect commit phase.
function HistoryCommit({ path, method }: { path: string; method: 'pushState' | 'replaceState' }) {
  useInsertionEffect(() => {
    window.history[method](null, '', path)
  }, [path, method])
  return null
}

beforeEach(() => {
  vi.useFakeTimers()
  route.pathname = '/before'
  window.history.replaceState(null, '', '/before')
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it.each(['pushState', 'replaceState'] as const)('handles %s during a React commit without insertion-effect updates', (method) => {
  const errors: string[] = []
  vi.spyOn(console, 'error').mockImplementation((message) => { errors.push(String(message)) })
  const view = render(<><HistoryCommit path="/before" method={method} /><RouteProgress /></>)
  route.pathname = '/after'
  view.rerender(<><HistoryCommit path="/after" method={method} /><RouteProgress /></>)
  expect(errors.filter(message => message.includes('useInsertionEffect must not schedule updates'))).toEqual([])
  act(() => vi.advanceTimersByTime(40))
  expect(view.container.querySelector('[aria-hidden="true"]')).not.toBeNull()
  act(() => vi.advanceTimersByTime(1000))
  expect(view.container.querySelector('[aria-hidden="true"]')).toBeNull()
})

it('cancels the pending visual start when unmounted', () => {
  const view = render(<RouteProgress />)
  act(() => window.history.pushState(null, '', '/after'))
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it('ignores history writes that keep the committed route', () => {
  const view = render(<RouteProgress />)
  act(() => window.history.replaceState(null, '', '/before#section'))
  act(() => vi.advanceTimersByTime(1000))
  expect(view.container.querySelector('[aria-hidden="true"]')).toBeNull()
  expect(vi.getTimerCount()).toBe(0)
})
