'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from './marketing.module.css'
import { useMe } from './useMe'

const NAV_LINKS = [
  { href: '/programs', label: 'Programs' },
  { href: '/destinations', label: 'Destinations' },
  { href: '/team', label: 'Team' },
  { href: '/blog', label: 'Blog' },
]

const PHONE_DISPLAY = '+420 776 805 045'
const PHONE_TEL = '00420776805045'

function PhoneIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2Z"
      />
    </svg>
  )
}

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

function UserIcon() {
  return (
    <svg className={styles.iconLarge} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"
      />
    </svg>
  )
}

export function Header({ transparent = false }: { transparent?: boolean } = {}) {
  const [scrolled, setScrolled] = useState(false)
  const [hideContacts, setHideContacts] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const me = useMe()
  const userHref = me === 'in' ? '/account' : '/login'
  const userLabel = me === 'in' ? 'My account' : 'Log in'

  useEffect(() => {
    let lastY = 0
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 0)
      setHideContacts(y > 80 && y > lastY)
      setPastHero(y > window.innerHeight * 0.8)
      lastY = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  // In transparent mode, treat "at top of hero" as scrolled-hidden so the contacts bar is gone.
  const transparentAtTop = transparent && !pastHero

  const classes = [
    styles.header,
    scrolled ? styles.headerScrolled : '',
    hideContacts || transparentAtTop ? styles.headerScrolledHide : '',
    transparentAtTop ? styles.headerTransparent : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <header className={classes}>
        <div className={styles.contactsBar}>
          <ul>
            <li>
              <a href={`tel:${PHONE_TEL}`} aria-label="Call us">
                <PhoneIcon />
                <span>{PHONE_DISPLAY}</span>
              </a>
            </li>
            <li className={styles.desktopOnly}>
              <Link href="/contact" className={styles.contactsCTA}>
                Contact
              </Link>
            </li>
          </ul>
          <ul>
            <li>
              <a href="https://wa.me/+420776805045" aria-label="WhatsApp">
                <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M20.5 3.5A11.94 11.94 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.55 4.13 1.6 5.93L0 24l6.34-1.66a11.94 11.94 0 0 0 5.66 1.44h.01c6.6 0 11.9-5.3 11.9-11.9 0-3.18-1.24-6.16-3.41-8.38ZM12 21.78h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.76.98 1-3.66-.23-.38a9.86 9.86 0 0 1-1.52-5.23c0-5.45 4.44-9.89 9.91-9.89 2.64 0 5.13 1.03 6.99 2.9a9.83 9.83 0 0 1 2.9 6.99c0 5.45-4.44 9.88-9.89 9.88Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97s-.47-.15-.67.15-.77.97-.94 1.17c-.17.2-.35.22-.65.07s-1.26-.46-2.4-1.48a8.97 8.97 0 0 1-1.66-2.06c-.17-.3 0-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.11 3.22 5.11 4.51.71.31 1.27.49 1.7.63.71.23 1.36.2 1.88.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.34Z"
                  />
                </svg>
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/rockbustersclimbing/" aria-label="Facebook">
                <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95Z"
                  />
                </svg>
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/rockbusters_climbing/" aria-label="Instagram">
                <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.42 2.23a3.72 3.72 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0-2.16C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.91 5.91 0 0 0-2.13 1.38A5.91 5.91 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.73 1.46 1.38 2.13a5.91 5.91 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.91 5.91 0 0 0 2.13-1.38 5.91 5.91 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.91 5.91 0 0 0-1.38-2.13A5.91 5.91 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z"
                  />
                </svg>
              </a>
            </li>
          </ul>
        </div>

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
            <Link href="/calendar" className={styles.joinUs}>
              Join Us
            </Link>
            <Link href={userHref} className={styles.userLink} aria-label={userLabel}>
              <UserIcon />
            </Link>
          </nav>

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
          <Link href="/calendar" onClick={() => setDrawerOpen(false)}>
            Join Us
          </Link>
          <Link href="/contact" onClick={() => setDrawerOpen(false)}>
            Contact
          </Link>
          <Link href={userHref} onClick={() => setDrawerOpen(false)}>
            {userLabel}
          </Link>
        </div>
      )}
    </>
  )
}
