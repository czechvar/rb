import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AccountSidebar } from './AccountSidebar'
import styles from './account.module.css'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return (
    <div className={styles.shell}>
      <AccountSidebar email={user.email} />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
