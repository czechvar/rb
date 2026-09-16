import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { RegisterForm } from './RegisterForm'

export const metadata = { title: 'Create account — Rockbusters' }

export default async function RegisterPage() {
  const user = await getCurrentUser()
  if (user) redirect('/account')

  return (
    <>
      <h1 data-type="section">Create account</h1>
      <RegisterForm />
    </>
  )
}
