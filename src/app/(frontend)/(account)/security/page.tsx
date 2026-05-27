import React from 'react'
import { SecurityForm } from './SecurityForm'

export const metadata = { title: 'Security — Rockbusters' }

export default function SecurityPage() {
  return (
    <>
      <h1>Security</h1>
      <p>Change the password you use to sign in.</p>
      <SecurityForm />
    </>
  )
}
