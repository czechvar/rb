import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { FormBanner } from '@/components/forms/FormBanner'
import { AccountPage } from '../AccountPage'
import { ProfileForm } from './ProfileForm'

export const metadata = { title: 'Your details — Rockbusters' }

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ ['email-changed']?: string }>
}) {
  const sp = await searchParams
  const user = (await getCurrentUser())!
  return (
    <AccountPage title="Your details">
      {/* confirm-email redirects here once the new address is confirmed. */}
      {sp['email-changed'] === '1' && (
        <FormBanner kind="success">Your sign-in email has been updated.</FormBanner>
      )}
      <ProfileForm
        initial={{ name: user.name, phone: user.phone ?? '', email: user.email }}
        pendingEmail={user.pendingEmail ?? undefined}
      />
    </AccountPage>
  )
}
