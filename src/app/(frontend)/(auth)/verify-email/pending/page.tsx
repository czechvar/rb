import React from 'react'
import { ResendForm } from './ResendForm'

export const metadata = { title: 'Check your inbox — Rockbusters' }

export default async function VerifyPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  return (
    <>
      <h1>Check your inbox</h1>
      <p>
        We sent a verification link {email ? <>to <strong>{email}</strong></> : 'to your email address'}.
        Click it to activate your account.
      </p>
      <p>Didn&apos;t get the email? Check spam, or resend it:</p>
      <ResendForm defaultEmail={email} />
    </>
  )
}
