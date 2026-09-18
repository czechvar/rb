'use client'
import React, { useActionState, useEffect, useState } from 'react'
import { FormBanner } from '@/components/forms/FormBanner'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountField, AccountSubmit } from '../form-controls'
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
    <div className={checkout.layout}>
      <div className={checkout.stack}>
        <section className={checkout.panel}>
          <h2 data-type="card-lg">Change password</h2>
          {state.ok && <FormBanner kind="success">Password updated.</FormBanner>}
          <form action={formAction}>
            <div className={checkout.fields}>
              <AccountField
                name="currentPassword"
                label="Current password"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={fieldErrors?.currentPassword}
              />
              <AccountField
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
              <AccountField
                name="confirm"
                label="Confirm new password"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={fieldErrors?.confirm}
              />
              <AccountSubmit>Change password</AccountSubmit>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
