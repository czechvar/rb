import React from 'react'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { ResendForm } from './pending/ResendForm'

export const metadata = { title: 'Verify email — Rockbusters' }

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token: rawToken } = await searchParams
  // Tokens are 40-char hex from crypto.randomBytes(20).toString('hex'). Strip
  // any non-hex characters that may have been appended by terminal/email
  // hyperlink detectors (e.g. VSCode terminal grabbing the trailing JSON-quote
  // backslash) before handing to verifyEmail.
  const token = rawToken?.replace(/[^a-fA-F0-9]/g, '') ?? ''
  if (!token) {
    return (
      <>
        <h1>Verification link invalid</h1>
        <p>No verification token in the URL. Request a new email:</p>
        <ResendForm />
      </>
    )
  }
  const payload = await getPayloadClient()
  try {
    await payload.verifyEmail({ collection: 'users', token })
  } catch (err) {
    // Most common cause: the link has already been used (Payload nulls the
    // token on first successful verify). Less common: a different account
    // was just verified, the token is genuinely invalid, or the link is
    // truncated. We can't tell them apart cheaply without the user's email,
    // so explain both possibilities and offer both next steps.
    console.error('[verify-email] failed for token:', token, err)
    return (
      <>
        <h1>This link is no longer valid</h1>
        <p>
          Verification links work only once. If you&apos;ve already verified, you can{' '}
          <a href="/login">sign in</a>. Otherwise request a new email:
        </p>
        <ResendForm />
      </>
    )
  }
  redirect('/login?verified=1')
}
