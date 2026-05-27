'use client'
import React, { useActionState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { changePasswordAction } from './actions'

export function SecurityForm() {
  const [state, formAction] = useActionState(changePasswordAction, INITIAL_ACTION_STATE)
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
          error={!state.ok ? state.fieldErrors?.currentPassword : undefined}
        />
        <FormField
          name="password"
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          helpText="At least 8 characters."
          error={!state.ok ? state.fieldErrors?.password : undefined}
        />
        <FormField
          name="confirm"
          label="Confirm new password"
          type="password"
          required
          autoComplete="new-password"
          error={!state.ok ? state.fieldErrors?.confirm : undefined}
        />
        <SubmitButton>Change password</SubmitButton>
      </form>
    </>
  )
}
