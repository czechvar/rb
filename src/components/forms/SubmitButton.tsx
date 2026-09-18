// src/components/forms/SubmitButton.tsx
'use client'
import React from 'react'
import { useFormStatus } from 'react-dom'
import styles from './forms.module.css'

export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className ?? styles.submit} disabled={pending}>
      {pending ? 'Working…' : children}
    </button>
  )
}
