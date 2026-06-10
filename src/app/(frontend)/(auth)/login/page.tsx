// src/app/(frontend)/(auth)/login/page.tsx
import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { sanitizeRedirect } from '@/lib/redirect'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Sign in — Rockbusters' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; verified?: string; ['password-reset']?: string }>
}) {
  const sp = await searchParams
  const user = await getCurrentUser()
  if (user) redirect(sanitizeRedirect(sp.from) ?? '/account')
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
