import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Event } from '@/payload-types'
import { TripContentBlock, TripTeamBlock } from '@/components/blocks/TripContentBlocks'
import { resolveTripDetail } from '@/lib/trip-detail'
import { defaultTripLayout } from '@/lib/trip-layout'

vi.mock('next/link', () => ({ default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a> }))

// In-memory source fixtures; no Payload client, database or environment setup.
function rich(text: string): NonNullable<Event['content']> {
  return { root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children: [
    { type: 'paragraph', version: 1, direction: null, format: '', indent: 0, children: [
      { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
    ] },
  ] } }
}
function source(overrides: Partial<Event> = {}): Event {
  return { id: -1, title: 'In-memory trip', slug: 'unit-trip-content', ...overrides } as Event
}
function context(event: Event) { return { event, trip: resolveTripDetail(event, []) } }

describe('trip source content preservation', () => {
  it('keeps team bullets and framing when there are no populated guide records', () => {
    const event = source({ coaches: [], coachFramingParagraph: 'Original team framing.', coachTeamBullets: [{ text: 'Original team contribution.' }] })
    const html = renderToStaticMarkup(TripTeamBlock({ variant: 'cards' }, context(event)))
    expect(html).toContain('Original team framing.')
    expect(html).toContain('Original team contribution.')
    expect(html).not.toContain('PHOTO')
    expect(renderToStaticMarkup(TripTeamBlock({ variant: 'cards' }, context(source())))).toBe('')
  })

  it.each(['overview', 'cards', 'prose'])('keeps existing highlights alongside mined highlights with the %s variant', variant => {
    const event = source({
      highlights: [{ text: 'Original structured highlight.' }],
      tripDetail: { sections: [{ kind: 'highlights', heading: 'Original mined heading', body: rich('Original mined highlight.') }] },
    })
    const html = renderToStaticMarkup(TripContentBlock({ section: 'highlights', variant }, context(event)))
    expect(html).toContain('Original structured highlight.')
    expect(html).toContain('Original mined heading')
    expect(html).toContain('Original mined highlight.')
    expect(html.match(/Original structured highlight\./g)).toHaveLength(1)
    expect(html.match(/Original mined highlight\./g)).toHaveLength(1)
  })

  it('keeps partner and demo content even when no unmatched prose remains', () => {
    const event = source({
      partnerHeadline: 'Original partner headline', partnerDescription: 'Original partner description.',
      partnerBenefits: [{ text: 'Original partner benefit.' }],
      demoEnabled: true, demoHeading: 'Original demo heading', demoBody: rich('Original demo body.'),
      demoCta: { label: 'Original demo action', url: '/original-demo' },
    })
    const ctx = context(event)
    expect(defaultTripLayout(ctx.trip)).toContainEqual({ blockType: 'tripContent', section: 'remaining', variant: 'prose' })
    const html = renderToStaticMarkup(TripContentBlock({ section: 'remaining' }, ctx))
    for (const text of ['Original partner headline', 'Original partner description.', 'Original partner benefit.', 'Original demo heading', 'Original demo body.', 'Original demo action']) expect(html).toContain(text)
    expect(html).toContain('href="/original-demo"')
    expect(html).not.toContain('More about this trip')
  })

  it('keeps unmatched rich text and additional sections alongside partner content', () => {
    const event = source({ content: rich('Original unmatched main content.'), additionalInfo: [{ heading: 'Original additional heading', body: rich('Original additional body.') }], partnerDescription: 'Original partner copy.' })
    const html = renderToStaticMarkup(TripContentBlock({ section: 'remaining' }, context(event)))
    for (const text of ['Original unmatched main content.', 'Original additional heading', 'Original additional body.', 'Original partner copy.']) expect(html).toContain(text)
    expect(html).toContain('<details>')
    expect(html).not.toContain('Try before you commit')
  })
})
