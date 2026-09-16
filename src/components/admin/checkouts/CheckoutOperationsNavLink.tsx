'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const href = '/admin/collections/checkouts/operations'

export function CheckoutOperationsNavLink() {
  const pathname = usePathname()
  const [host, setHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const checkoutsLink = document.getElementById('nav-checkouts')
    if (!checkoutsLink?.parentElement) return

    const navHost = document.createElement('div')
    navHost.dataset.checkoutOperationsNav = 'true'
    navHost.style.display = 'contents'
    checkoutsLink.insertAdjacentElement('afterend', navHost)
    const frame = requestAnimationFrame(() => setHost(navHost))

    return () => {
      cancelAnimationFrame(frame)
      navHost.remove()
    }
  }, [])

  if (!host) return null
  const active = pathname.startsWith(href)

  return createPortal(
    <Link
      aria-current={active ? 'page' : undefined}
      className={`nav__link${active ? ' nav__link--active' : ''}`}
      href={href}
      id="nav-checkout-operations"
      prefetch={false}
    >
      {active && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Operations queue</span>
    </Link>,
    host,
  )
}
