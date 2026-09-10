'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './blocks.module.css'

type DestinationJumpNavItem = {
  href: string
  label: string
}

export function DestinationJumpNav({ items }: { items: DestinationJumpNavItem[] }) {
  const [activeHref, setActiveHref] = useState(items[0]?.href ?? '')
  const sectionIds = useMemo(
    () => items.map((item) => item.href.replace(/^#/, '')).filter(Boolean),
    [items],
  )

  useEffect(() => {
    if (!sectionIds.length) return

    const updateActiveSection = () => {
      const headerHeight = document.querySelector('header[data-scrolled]')
        ?.getBoundingClientRect().height ?? 0
      const navHeight = document
        .querySelector(`.${styles.destinationJumpNav}`)
        ?.getBoundingClientRect().height ?? 0
      const activationLine = headerHeight + navHeight + 24

      let currentId = sectionIds[0]
      for (const id of sectionIds) {
        const section = document.getElementById(id)
        if (!section) continue
        if (section.getBoundingClientRect().top <= activationLine) {
          currentId = id
        }
      }

      setActiveHref(`#${currentId}`)
    }

    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)
    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [sectionIds])

  if (!items.length) return null

  return (
    <nav className={styles.destinationJumpNav} aria-label="Destination sections">
      <div className={styles.destinationJumpNavScroller}>
        {items.map((item) => {
          const active = item.href === activeHref
          return (
            <a
              key={item.href}
              href={item.href}
              className={active ? styles.destinationJumpNavActive : undefined}
              aria-current={active ? 'true' : undefined}
              onClick={(event) => {
                const section = document.getElementById(item.href.slice(1))
                const headerHeight = document.querySelector('header[data-scrolled]')
                  ?.getBoundingClientRect().height ?? 0
                const navHeight = event.currentTarget.closest('nav')?.getBoundingClientRect().height ?? 0
                if (section) section.style.scrollMarginTop = `${headerHeight + navHeight + 16}px`
                setActiveHref(item.href)
              }}
            >
              {item.label}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
