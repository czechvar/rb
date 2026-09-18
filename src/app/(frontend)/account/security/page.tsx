import React from 'react'
import { AccountPage } from '../AccountPage'
import { SecurityForm } from './SecurityForm'

export const metadata = { title: 'Security — Rockbusters' }

export default function SecurityPage() {
  return (
    <AccountPage title="Security" lead="Change the password you use to sign in.">
      <SecurityForm />
    </AccountPage>
  )
}
