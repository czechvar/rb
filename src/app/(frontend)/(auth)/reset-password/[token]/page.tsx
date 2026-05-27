import React from 'react'
import { ResetForm } from './ResetForm'

export const metadata = { title: 'Reset password — Rockbusters' }

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return (
    <>
      <h1>Set a new password</h1>
      <ResetForm token={token} />
    </>
  )
}
