import React from 'react'
import { RegisterForm } from './RegisterForm'

export const metadata = { title: 'Create account — Rockbusters' }

export default function RegisterPage() {
  return (
    <>
      <h1>Create account</h1>
      <RegisterForm />
    </>
  )
}
