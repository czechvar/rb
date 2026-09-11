import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EditorialHeading, HeadingText } from '@/components/ui/EditorialHeading'
import { WhatYouLearn } from '@/components/sections/WhatYouLearn'

describe('editorial heading authoring', () => {
  it('preserves word fragments and multiple accents without inserting spaces', () => {
    const html = renderToStaticMarkup(<EditorialHeading as="h1" parts={[
      { text: 'Un' }, { text: 'stopp', accent: true }, { text: 'able & ' },
      { text: 'ready', accent: true },
    ]} />)
    expect(html.replace(/<[^>]*>/g, '')).toBe('Unstoppable &amp; ready')
    expect(html.match(/<span /g)).toHaveLength(2)
    expect(html).toMatch(/^<h1>/)
  })

  it('escapes authored markup and only renders requested line breaks', () => {
    const html = renderToStaticMarkup(<EditorialHeading parts={[
      { text: '<script>alert(1)</script>', accent: true, breakBefore: true },
      { text: 'Second line', breakBefore: true },
    ]} />)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html.match(/<br\/>/g)).toHaveLength(1)
    expect(html).toContain('<br/>Second line')
  })

  it('uses fallback headings for absent segments and preserves explicit empty text', () => {
    for (const parts of [undefined, null, []]) {
      expect(renderToStaticMarkup(<HeadingText parts={parts} fallback="Existing heading" />)).toBe('Existing heading')
    }
    expect(renderToStaticMarkup(<HeadingText parts={[{ text: '' }]} fallback="Existing heading" />)).toBe('')
  })

  it('allows section copy overrides while retaining the existing learning content and defaults', () => {
    const data = { intro: 'Legacy introduction', box1Heading: 'Technique', box1Bullets: [{ text: 'Footwork' }] }
    const original = renderToStaticMarkup(<WhatYouLearn data={data} />)
    expect(original).toContain('What you&#x27;ll learn')
    expect(original).toContain('Legacy introduction')

    const authored = renderToStaticMarkup(<WhatYouLearn data={data} intro="" eyebrow="The programme" heading={
      <HeadingText parts={[{ text: 'Three ' }, { text: 'skills', accent: true }]} />
    } />)
    expect(authored).toContain('The programme')
    expect(authored.replace(/<[^>]*>/g, '')).toContain('Three skills')
    expect(authored).toContain('Footwork')
    expect(authored).not.toContain('Legacy introduction')
  })
})
