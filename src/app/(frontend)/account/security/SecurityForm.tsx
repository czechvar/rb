'use client'
import React, { useActionState, useEffect, useState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { changePasswordAction } from './actions'

export function SecurityForm() {
  const [state, formAction] = useActionState(changePasswordAction, INITIAL_ACTION_STATE)

  // Controlled — passwords can't be echoed from the server.
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  // Clear all password fields after a successful change so the next visit
  // to this page starts clean.
  /* eslint-disable react-hooks/set-state-in-effect -- one-shot reset gated on
     state.ok flipping; fires once per successful action, no render cascade. */
  useEffect(() => {
    if (state.ok) {
      setCurrentPassword('')
      setPassword('')
      setConfirm('')
    }
  }, [state.ok])
  /* eslint-enable react-hooks/set-state-in-effect */

  const fieldErrors = !state.ok ? state.fieldErrors : undefined

  return (
    <>
      {state.ok && <FormBanner kind="success">Password updated.</FormBanner>}
      <form action={formAction}>
        <FormField
          name="currentPassword"
          label="Current password"
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={fieldErrors?.currentPassword}
        />
        <FormField
          name="password"
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          helpText="At least 8 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors?.password}
        />
        <FormField
          name="confirm"
          label="Confirm new password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors?.confirm}
        />
        <SubmitButton>Change password</SubmitButton>
      </form>
    </>
  )
}
