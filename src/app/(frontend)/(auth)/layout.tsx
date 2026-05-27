import React from 'react'
import styles from './auth-card.module.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.shell}>
      <div className={styles.card}>{children}</div>
    </main>
  )
}
