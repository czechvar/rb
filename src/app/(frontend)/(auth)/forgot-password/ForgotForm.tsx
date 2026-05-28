'use client'
import React, { useActionState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { forgotPasswordAction } from './actions'

export function ForgotForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, INITIAL_ACTION_STATE)
  if (state.ok) {
    return (
      <FormBanner kind="success">
        If an account exists for that address, we sent a reset link. Check your inbox.
      </FormBanner>
    )
  }
  return (
    <form action={formAction}>
      {state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      <FormField name="email" label="Email" type="email" required autoComplete="email"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email} />
      <SubmitButton>Send reset link</SubmitButton>
    </form>
  )
}
