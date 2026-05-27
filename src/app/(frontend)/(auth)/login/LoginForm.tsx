// src/app/(frontend)/(auth)/login/LoginForm.tsx
'use client'
import React, { useActionState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import { loginAction } from './actions'

interface Props {
  from?: string
  verifiedFlash?: boolean
  passwordResetFlash?: boolean
}

export function LoginForm({ from, verifiedFlash, passwordResetFlash }: Props) {
  const [state, formAction] = useActionState(loginAction, INITIAL_ACTION_STATE)
  const verifyRequired =
    !state.ok && state.formError?.startsWith('verify_required:')
  const verifyEmail = verifyRequired ? state.formError!.slice('verify_required:'.length) : null

  return (
    <>
      {verifiedFlash && (
        <FormBanner kind="success">Email verified. You can sign in now.</FormBanner>
      )}
      {passwordResetFlash && (
        <FormBanner kind="success">Password changed. You can sign in with your new password.</FormBanner>
      )}
      {verifyRequired ? (
        <FormBanner kind="error">
          Please verify your email address before signing in.{' '}
          <a href={`/verify-email/pending?email=${encodeURIComponent(verifyEmail!)}`}>
            Resend verification email
          </a>
        </FormBanner>
      ) : (
        !state.ok &&
        state.formError && <FormBanner kind="error">{state.formError}</FormBanner>
      )}
      <form action={formAction}>
        {from && <input type="hidden" name="from" value={from} />}
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={!state.ok ? state.fieldErrors?.email : undefined}
        />
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          error={!state.ok ? state.fieldErrors?.password : undefined}
        />
        <SubmitButton>Sign in</SubmitButton>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        <a href="/forgot-password">Forgot password?</a>
      </p>
      <p style={{ fontSize: 14 }}>
        No account? <a href="/register">Create one</a>
      </p>
    </>
  )
}
