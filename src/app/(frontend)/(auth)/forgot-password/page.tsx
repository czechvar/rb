import React from 'react'
import { ForgotForm } from './ForgotForm'

export const metadata = { title: 'Forgot password — Rockbusters' }

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 data-type="section">Forgot password</h1>
      <p>Enter the email address on your account. We&apos;ll send you a link to reset your password.</p>
      <ForgotForm />
    </>
  )
}
