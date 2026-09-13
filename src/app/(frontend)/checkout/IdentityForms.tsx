'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { FormBanner } from '@/components/forms/FormBanner'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import {
  verifyGuestCheckoutAction,
  acceptCheckoutInvitationAction,
  reviewGuestCheckoutAction,
  checkoutInvitationKindAction,
} from './identity-actions'
import forms from '@/components/forms/forms.module.css'
import styles from './identity.module.css'

function useLinkToken(kind: 'verify' | 'invite', id: number) {
  const [token, setToken] = useState('')
  const key = `rb-checkout-${kind}-${id}`
  useEffect(() => {
    const fragmentToken = new URLSearchParams(window.location.hash.slice(1)).get('token')
    // Fragments are never sent to the server; remove immediately before any navigation.
    if (window.location.hash)
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + window.location.search,
      )
    let value = fragmentToken || ''
    try {
      if (value && /^[A-Za-z0-9_-]{43}$/.test(value))
        sessionStorage.setItem(
          key,
          JSON.stringify({ token: value, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }),
        )
      else {
        const saved = JSON.parse(sessionStorage.getItem(key) || 'null') as {
          token?: string
          expiresAt?: number
        } | null
        if (saved?.expiresAt && saved.expiresAt > Date.now() && typeof saved.token === 'string')
          value = saved.token
      }
    } catch {
      /* A link still works when session storage is unavailable. */
    }
    const frame = requestAnimationFrame(() =>
      setToken(/^[A-Za-z0-9_-]{43}$/.test(value) ? value : ''),
    )
    return () => cancelAnimationFrame(frame)
  }, [key])
  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(key)
    } catch {
      /* Storage is optional. */
    }
  }, [key])
  return { token, clear }
}

export function VerifyCheckoutForm({ id }: { id: number }) {
  const { token, clear } = useLinkToken('verify', id)
  const [state, action, pending] = useActionState(verifyGuestCheckoutAction, INITIAL_ACTION_STATE)
  useEffect(() => {
    if (state.ok) clear()
  }, [state.ok, clear])
  if (state.ok)
    return (
      <FormBanner kind="success">
        Your email is confirmed and your selected seats are reserved for staff review. We will email
        you after reviewing your checkout.
      </FormBanner>
    )
  return (
    <form action={action}>
      <input type="hidden" name="checkout" value={id} />
      <input type="hidden" name="token" value={token} />
      {state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      {!token && <p>Open the confirmation link from your email to continue.</p>}
      <button className={forms.submit} disabled={pending || !token}>
        {pending ? 'Confirming…' : 'Confirm email and reserve for review'}
      </button>
    </form>
  )
}

export function CheckoutInvitationForm({ id }: { id: number }) {
  const { token, clear } = useLinkToken('invite', id)
  const [kind, setKind] = useState<'checking' | 'create' | 'login' | 'continue' | 'invalid'>(
    'checking',
  )
  useEffect(() => {
    if (!token) return
    let active = true
    void checkoutInvitationKindAction(id, token)
      .then((result) => {
        if (active) setKind(result)
      })
      .catch(() => {
        if (active) setKind('invalid')
      })
    return () => {
      active = false
    }
  }, [id, token])
  const createAccount = kind === 'create'
  const [state, action, pending] = useActionState(
    acceptCheckoutInvitationAction,
    INITIAL_ACTION_STATE,
  )
  useEffect(() => {
    if (state.ok) clear()
  }, [state.ok, clear])
  if (state.ok)
    return (
      <FormBanner kind="success">
        Your checkout is connected to your account.{' '}
        <Link href={state.redirect || '/account'}>Continue to your checkout</Link>
      </FormBanner>
    )
  if (!token) return <p>Open your invitation email in this tab to continue.</p>
  if (kind === 'checking') return <p role="status">Checking your invitation…</p>
  if (kind === 'invalid')
    return (
      <p>
        This invitation has expired or was already used. Sign in to view your checkouts, or ask our
        team for a new invitation.
      </p>
    )
  if (kind === 'login')
    return (
      <p>
        Sign in to your existing account, then return here to connect your checkout.{' '}
        <Link href={`/login?from=${encodeURIComponent(`/checkout/invite?checkout=${id}`)}`}>
          Sign in
        </Link>
      </p>
    )
  return (
    <form action={action}>
      <input type="hidden" name="checkout" value={id} />
      <input type="hidden" name="token" value={token} />
      {state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      {createAccount && (
        <>
          <div className={forms.field}>
            <label className={forms.label} htmlFor="checkout-password">
              Choose a password
            </label>
            <input
              className={forms.input}
              id="checkout-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              disabled={pending}
            />
          </div>
          <div className={forms.field}>
            <label className={forms.label} htmlFor="checkout-password-confirm">
              Confirm password
            </label>
            <input
              className={forms.input}
              id="checkout-password-confirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              disabled={pending}
            />
          </div>
        </>
      )}
      <button className={forms.submit} disabled={pending}>
        {pending ? 'Saving…' : createAccount ? 'Create account' : 'Connect my account'}
      </button>
    </form>
  )
}

export function CheckoutReviewForm({ id, approved }: { id: number; approved: boolean }) {
  const [state, action, pending] = useActionState(reviewGuestCheckoutAction, INITIAL_ACTION_STATE)
  return (
    <form action={action}>
      <input type="hidden" name="checkout" value={id} />
      {state.ok ? (
        <FormBanner kind="success">
          Review saved and invitation sent, or the checkout declined.
        </FormBanner>
      ) : state.formError ? (
        <FormBanner kind="error">{state.formError}</FormBanner>
      ) : null}
      <div className={forms.field}>
        <label className={forms.label} htmlFor={`note-${id}`}>
          Staff note
        </label>
        <textarea
          className={forms.input}
          id={`note-${id}`}
          name="note"
          maxLength={2000}
          disabled={pending}
        />
      </div>
      <div className={styles.actions}>
        <button className={forms.submit} name="decision" value="approve" disabled={pending}>
          {approved ? 'Resend invitation' : 'Approve and invite'}
        </button>
        <button className={forms.submit} name="decision" value="decline" disabled={pending}>
          Decline and release seats
        </button>
      </div>
    </form>
  )
}
