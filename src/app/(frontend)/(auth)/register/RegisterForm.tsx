'use client'
import React, { useActionState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { registerAction } from './actions'

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, INITIAL_ACTION_STATE)
  return (
    <>
      {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      <form action={formAction}>
        <FormField name="name" label="Full name" required autoComplete="name"
          error={!state.ok ? state.fieldErrors?.name : undefined} />
        <FormField name="email" label="Email" type="email" required autoComplete="email"
          error={!state.ok ? state.fieldErrors?.email : undefined} />
        <FormField name="phone" label="Phone" required autoComplete="tel"
          error={!state.ok ? state.fieldErrors?.phone : undefined} />
        <FormField name="password" label="Password" type="password" required
          autoComplete="new-password" helpText="At least 8 characters."
          error={!state.ok ? state.fieldErrors?.password : undefined} />
        <SubmitButton>Create account</SubmitButton>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        Have an account? <a href="/login">Sign in</a>
      </p>
    </>
  )
}
