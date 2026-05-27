import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { ProfileForm } from './ProfileForm'

export const metadata = { title: 'Profile — Rockbusters' }

export default async function ProfilePage() {
  const user = (await getCurrentUser())!
  return (
    <>
      <h1>Profile</h1>
      <ProfileForm
        initial={{ name: user.name, phone: user.phone, email: user.email }}
        pendingEmail={user.pendingEmail ?? undefined}
      />
    </>
  )
}
