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
  const { token } = await searchParams
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
  } catch {
    return (
      <>
        <h1>This link has expired</h1>
        <p>Verification links expire after a short time. Request a new one:</p>
        <ResendForm />
      </>
    )
  }
  redirect('/login?verified=1')
}
