'use client'
import React, { useActionState, useState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { resetPasswordAction } from './actions'

export function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, INITIAL_ACTION_STATE)

  // Controlled — passwords can't be echoed from the server.
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const fieldErrors = !state.ok ? state.fieldErrors : undefined

  return (
    <>
      {!state.ok && state.formError && (
        <FormBanner kind="error">
          {state.formError} <a href="/forgot-password">Request a new link</a>.
        </FormBanner>
      )}
      <form action={formAction}>
        <input type="hidden" name="token" value={token} />
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
        <SubmitButton>Set new password</SubmitButton>
      </form>
    </>
  )
}
