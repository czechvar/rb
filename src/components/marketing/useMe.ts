'use client'

import { useEffect, useState } from 'react'

export type MeState = 'out' | 'in'

/**
 * Client-side "am I logged in?" for shell chrome. Deliberately NOT a server
 * cookie read: shared shell components must not call headers()/cookies(),
 * or every marketing page goes dynamic. Until the fetch resolves (and on
 * any error) callers see 'out'.
 */
export function useMe(): MeState {
  const [state, setState] = useState<MeState>('out')

  useEffect(() => {
    let cancelled = false
    fetch('/api/users/me', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.user) setState('in')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
