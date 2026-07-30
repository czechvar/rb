'use client'
import React, { useActionState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { resendVerificationAction } from '../actions'

export function ResendForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, formAction] = useActionState(resendVerificationAction, INITIAL_ACTION_STATE)
  return (
    <>
      {state.ok && (
        <FormBanner kind="success">
          If an unverified account exists for that address, we re-sent the verification email. Check
          your inbox.
        </FormBanner>
      )}
      <form action={formAction}>
        <FormField
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          defaultValue={(!state.ok && state.values?.email) || defaultEmail}
          error={!state.ok ? state.fieldErrors?.email : undefined}
        />
        <SubmitButton>Resend verification email</SubmitButton>
      </form>
    </>
  )
}
