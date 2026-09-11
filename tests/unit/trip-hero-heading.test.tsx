import React from 'react'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Event } from '@/payload-types'
import { DetailHero } from '@/components/sections/DetailHero'
import styles from '@/components/sections/DetailHero.module.css'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))

const parts = [{ text: 'Un' }, { text: 'stopp', accent: true }, { text: 'able' }]
const base = { id: 1, title: 'Climb: Together', slug: 'heading-fixture' } as Event

function renderHero(event: Event) {
  // Exercise the real cascade: markup-only assertions cannot catch a CSS line break.
  const css = readFileSync('src/components/sections/DetailHero.module.css', 'utf8').replace(
    /\.([a-zA-Z][\w-]*)/g,
    (selector, name: string) => (styles[name] ? `.${styles[name]}` : selector),
  )
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
  document.body.innerHTML = renderToStaticMarkup(<DetailHero event={event} variant="editorial" />)
  return document.querySelector('h1')!
}

afterEach(() => {
  document.body.innerHTML = ''
  document.head.querySelectorAll('style').forEach((style) => style.remove())
})

describe('editorial hero heading cascade', () => {
  it('keeps an authored accent inside a word inline', () => {
    const heading = renderHero({ ...base, editorial: { hero: { titleParts: parts } } })
    expect(heading.textContent).toBe('Unstoppable')
    expect(heading.querySelector('br')).toBeNull()
    expect(getComputedStyle(heading.querySelector('span')!).display).not.toBe('block')
  })

  it('preserves an explicit authored break without making the accent a block', () => {
    const heading = renderHero({
      ...base,
      editorial: {
        hero: { titleParts: [...parts, { text: 'Together', accent: true, breakBefore: true }] },
      },
    })
    expect(heading.querySelectorAll('br')).toHaveLength(1)
    for (const span of heading.querySelectorAll('span'))
      expect(getComputedStyle(span).display).not.toBe('block')
  })

  it('retains the legacy colon subtitle on its own line', () => {
    const heading = renderHero(base)
    expect(heading.textContent).toBe('Climb: Together')
    expect(getComputedStyle(heading.querySelector('span')!).display).toBe('block')
  })
})
