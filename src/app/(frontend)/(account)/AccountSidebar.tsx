'use client'
import React from 'react'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/lib/actions/logout'
import styles from './account.module.css'

type SidebarItem = { href: string; label: string; exact?: boolean }

const ITEMS: readonly SidebarItem[] = [
  { href: '/account', label: 'Overview', exact: true },
  { href: '/account/profile', label: 'Profile' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/security', label: 'Security' },
  { href: '/account/orders', label: 'Orders' },
]

export function AccountSidebar({ email }: { email: string }) {
  const pathname = usePathname()
  return (
    <nav className={styles.sidebar}>
      {ITEMS.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href)
        return (
          <a
            key={it.href}
            href={it.href}
            className={`${styles.link} ${active ? styles.linkActive : ''}`}
          >
            {it.label}
          </a>
        )
      })}
      <div className={styles.divider} />
      <div className={styles.email}>Signed in as {email}</div>
      <form action={logoutAction}>
        <button type="submit" className={styles.signout}>
          Sign out
        </button>
      </form>
    </nav>
  )
}
