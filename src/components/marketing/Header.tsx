'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import styles from './marketing.module.css'
import { useMe } from './useMe'

const NAV_LINKS = [
  { href: '/trips', label: 'Trips & Clinics' },
  { href: '/destinations', label: 'Destinations' },
  { href: '/team', label: 'The Crew' },
  { href: '/contact', label: 'Contact' },
  { href: '/blog', label: 'Blog' },
]

function MenuBurger() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.42 1.41L10.59 13.4l-6.3 6.3 1.41 1.42 6.3-6.3 6.3 6.3 1.42-1.42-6.3-6.3 6.3-6.3z" />
    </svg>
  )
}

// One rule for every public route; page shells cannot override scroll behavior.
const SCROLL_THRESHOLD = 60

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const me = useMe()
  const userHref = me === 'in' ? '/account' : '/login'
  const userLabel = me === 'in' ? 'My account' : 'Log in'

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pageshow', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pageshow', onScroll)
    }
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <>
      <header className={styles.header} data-scrolled={scrolled}>
        <div className={styles.menuBar}>
          <Link href="/" className={styles.brand} aria-label="Rockbusters home">
            <Image
              src="/logo-rockbusters.png"
              alt="Rockbusters"
              width={240}
              height={48}
              priority
            />
          </Link>

          <nav className={styles.nav}>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className={styles.headerActions}>
            <Link
              href="https://wa.me/420776805045"
              className={styles.joinUs}
              data-testid="nav-cta-lets-talk"
            >
              LET&apos;S TALK
            </Link>
          </div>

          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <MenuBurger />
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div className={styles.mobileDrawer} role="dialog" aria-label="Site menu">
          <button
            type="button"
            className={styles.mobileDrawerClose}
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setDrawerOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="https://wa.me/420776805045" onClick={() => setDrawerOpen(false)}>
            LET&apos;S TALK
          </Link>
          <Link href={userHref} onClick={() => setDrawerOpen(false)}>
            {userLabel}
          </Link>
        </div>
      )}
    </>
  )
}
