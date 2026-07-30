'use client'
import React, { useActionState, useEffect, useState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { registerAction } from './actions'

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, INITIAL_ACTION_STATE)

  // Controlled inputs — React state is the source of truth so values survive
  // both the React 19 form-action input reset and the round-trip to the
  // server. Passwords stay client-side; never echoed back from the action.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  // If the server normalises a value (e.g. trims whitespace) the echoed
  // `values` in the error state may differ from what we hold locally —
  // adopt the server's version so what the user sees matches what was
  // validated.
  const echoed = !state.ok ? state.values : undefined
  /* eslint-disable react-hooks/set-state-in-effect -- syncing local state with
     the action result is the point here; each set is guarded by an inequality
     check, so it fires at most once per action round-trip. */
  useEffect(() => {
    if (!echoed) return
    if (echoed.name !== undefined && echoed.name !== name) setName(echoed.name)
    if (echoed.email !== undefined && echoed.email !== email) setEmail(echoed.email)
    if (echoed.phone !== undefined && echoed.phone !== phone) setPhone(echoed.phone)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [echoed])
  /* eslint-enable react-hooks/set-state-in-effect */

  const fieldErrors = !state.ok ? state.fieldErrors : undefined

  return (
    <>
      {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      <form action={formAction}>
        <FormField
          name="name"
          label="Full name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors?.name}
        />
        <FormField
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors?.email}
        />
        <FormField
          name="phone"
          label="Phone"
          required
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={fieldErrors?.phone}
        />
        <FormField
          name="password"
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          helpText="At least 8 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors?.password}
        />
        <FormField
          name="passwordConfirm"
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          error={fieldErrors?.passwordConfirm}
        />
        <SubmitButton>Create account</SubmitButton>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        Have an account? <a href="/login">Sign in</a>
      </p>
    </>
  )
}
