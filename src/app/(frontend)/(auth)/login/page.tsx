// src/app/(frontend)/(auth)/login/page.tsx
import React from 'react'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Sign in — Rockbusters' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; verified?: string; ['password-reset']?: string }>
}) {
  const sp = await searchParams
  return (
    <>
      <h1>Sign in</h1>
      <LoginForm
        from={sp.from}
        verifiedFlash={sp.verified === '1'}
        passwordResetFlash={sp['password-reset'] === '1'}
      />
    </>
  )
}
