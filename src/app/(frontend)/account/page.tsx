import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { FormBanner } from '@/components/forms/FormBanner'

export const metadata = { title: 'Account — Rockbusters' }

export default async function AccountOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ ['password-reset']?: string; ['email-changed']?: string }>
}) {
  const sp = await searchParams
  const user = (await getCurrentUser())!
  const addressCount = user.addresses?.length ?? 0
  return (
    <>
      {sp['password-reset'] === '1' && (
        <FormBanner kind="success">Password changed. You&apos;re signed in.</FormBanner>
      )}
      {sp['email-changed'] === '1' && (
        <FormBanner kind="success">Your sign-in email has been updated.</FormBanner>
      )}
      <h1>Welcome back, {user.name.split(' ')[0]}</h1>
      <p>Manage your account using the menu on the left.</p>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 24 }}>
        <li>You have <strong>0</strong> orders.</li>
        <li>
          {addressCount} address{addressCount === 1 ? '' : 'es'} on file.
        </li>
      </ul>
    </>
  )
}
