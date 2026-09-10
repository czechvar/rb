import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Event, Guide } from '@/payload-types'
import { TripContentBlock, TripTeamBlock } from '@/components/blocks/TripContentBlocks'
import { resolveTripDetail } from '@/lib/trip-detail'
import { SectionIntro } from '@/components/sections/SectionIntro'
import { EventAccommodationLogistics } from '@/components/sections/EventAccommodationLogistics'
import { AudienceCards } from '@/components/sections/AudienceCards'
import { defaultTripLayout } from '@/lib/trip-layout'
import { WhatYouLearn } from '@/components/sections/WhatYouLearn'

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
  it('preserves an equipment introduction without manufacturing equipment items', () => {
    const html = renderToStaticMarkup(TripContentBlock({ section: 'equipment' }, context(source({ equipmentIntro: 'Original equipment introduction.' }))))
    expect(html).toContain('Original equipment introduction.')
    expect(html).not.toContain('<li')
  })
  it('renders optional comparison alongside the programme, and omits incomplete comparisons', () => {
    const comparison = { heading: 'Source comparison', leftHeading: 'First', rightHeading: 'Second', rows: [{ label: 'Source feature', left: 'Original left', right: 'Original right' }] }
    const html = renderToStaticMarkup(TripContentBlock({ section: 'itinerary', variant: 'timeline' }, context(source({ comparison }))))
    expect(html).toContain('<table>')
    expect(html).toContain('scope="row">Source feature')
    expect(html).toContain('Original left')
    expect(html).toContain('Original right')
    const empty = renderToStaticMarkup(TripContentBlock({ section: 'itinerary', variant: 'timeline' }, context(source({ comparison: { ...comparison, rows: [] } }))))
    expect(empty).not.toContain('<table>')
    expect(empty).not.toContain('Source comparison')
  })

  it('supports a third learning pillar without creating missing pillar content', () => {
    const html = renderToStaticMarkup(<WhatYouLearn variant="pillars" data={{ box1Heading: 'One', box1Bullets: [{ text: 'First source' }], box3Heading: 'Three', box3Bullets: [{ text: 'Third source' }] }} />)
    expect(html).toContain('Third source')
    expect(html.match(/<h3/g)).toHaveLength(2)
    expect(html).not.toContain('Mental Game')
  })

  it('keeps team bullets and framing when there are no populated guide records', () => {
    const event = source({ coaches: [], coachFramingParagraph: 'Original team framing.', coachTeamBullets: [{ text: 'Original team contribution.' }] })
    const html = renderToStaticMarkup(TripTeamBlock({ variant: 'cards' }, context(event)))
    expect(html).toContain('Original team framing.')
    expect(html).toContain('Original team contribution.')
    expect(html).not.toContain('PHOTO')
    expect(renderToStaticMarkup(TripTeamBlock({ variant: 'cards' }, context(source())))).toBe('')
  })


  it('reuses the shared photo guide cards with the selected occurrence team and original photo metadata', () => {
    const eventGuide = { id: 1, name: 'Event guide', slug: 'event-guide' } as Guide
    const selectedGuide = { id: 2, name: 'Selected guide', slug: 'selected-guide', role: 'Original role', tagline: 'Original tagline',
      photo: { id: 'unit-guide-photo', url: '/unit-guide.jpg', alt: 'Original guide photo', createdAt: '', updatedAt: '' } } as Guide
    const event = source({ coaches: [eventGuide], coachFramingParagraph: 'Original team framing.' })
    const ctx = context(event)
    ctx.trip.guides = [selectedGuide]
    const html = renderToStaticMarkup(TripTeamBlock({ variant: 'cards' }, ctx))
    expect(html).toContain('href="/team/selected-guide"')
    expect(html).toContain('Original role')
    expect(html).toContain('Original tagline')
    expect(html).toContain('Original guide photo')
    expect(html).toContain('Meet guide')
    expect(html).not.toContain('Event guide')
    expect(html).not.toContain('/team/event-guide')
    const defaultHtml = renderToStaticMarkup(TripTeamBlock({}, ctx))
    expect(defaultHtml).toContain('Selected guide')
    expect(defaultHtml).not.toContain('Meet guide')
  })


  it('opts trip fallback headings into the embedded variant while shared defaults remain unchanged', () => {
    const cards = [{ heading: 'Original audience', body: 'Original audience text.' }]
    const event = source({ audienceCards: cards })
    const tripHtml = renderToStaticMarkup(TripContentBlock({ section: 'audience' }, context(event)))
    const defaultHtml = renderToStaticMarkup(<AudienceCards cards={cards} />)
    expect(tripHtml).toContain('Original audience text.')
    expect(tripHtml).toMatch(/class="[^"]*embedded/)
    expect(defaultHtml).not.toMatch(/class="[^"]*embedded/)
    const heading = renderToStaticMarkup(<SectionIntro title="Original heading" variant="embedded" />)
    expect(heading).toContain('Original heading')
    expect(heading).toMatch(/class="[^"]*embedded/)
  })


  it('renders inclusion-only cards without inventing an Accommodation group and keeps the default grouping', () => {
    const accommodation = { included: [{ text: 'Original included item.' }], notIncluded: [{ text: 'Original excluded item.' }] }
    const cards = renderToStaticMarkup(<EventAccommodationLogistics accommodation={accommodation} variant="cards" />)
    const defaultHtml = renderToStaticMarkup(<EventAccommodationLogistics accommodation={accommodation} />)
    expect(cards).not.toContain('<h3>Accommodation</h3>')
    expect(cards).toContain('Included in our price')
    expect(cards).toContain('Not included')
    expect(defaultHtml).toContain('<h3>Accommodation</h3>')
    for (const html of [cards, defaultHtml]) {
      expect(html.match(/Original included item\./g)).toHaveLength(1)
      expect(html.match(/Original excluded item\./g)).toHaveLength(1)
    }
    expect(defaultHtml.indexOf('Accommodation')).toBeLessThan(defaultHtml.indexOf('Original included item.'))
  })

  it('places inclusion cards after primary logistics without duplicating source descriptions', () => {
    const html = renderToStaticMarkup(<EventAccommodationLogistics variant="cards"
      accommodation={{ description: rich('Original accommodation body.'), included: [{ text: 'Original price inclusion.' }] }}
      transport={{ description: rich('Original transport body.') }} />)
    for (const text of ['Original accommodation body.', 'Original transport body.', 'Original price inclusion.']) {
      expect(html.split(text)).toHaveLength(2)
    }
    expect(html.indexOf('Original transport body.')).toBeLessThan(html.indexOf('Included in our price'))
  })

  it.each(['cards', undefined] as const)('preserves occurrence inclusion overrides and hides replaced Event lists for %s', variant => {
    const html = renderToStaticMarkup(<EventAccommodationLogistics variant={variant}
      accommodation={{ included: [{ text: 'Replaced Event inclusion.' }], notIncluded: [{ text: 'Replaced Event exclusion.' }] }}
      logisticsOverrides={{ included: rich('Original date inclusion.'), excluded: rich('Original date exclusion.'), note: rich('Original date note.') }} />)
    for (const text of ['Original date inclusion.', 'Original date exclusion.', 'Original date note.']) expect(html.split(text)).toHaveLength(2)
    expect(html).not.toContain('Replaced Event inclusion.')
    expect(html).not.toContain('Replaced Event exclusion.')
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

  it('adds the overview eyebrow and resolved booking or inquiry action without changing the source', () => {
    const event = source({ tripDetail: { sections: [{ kind: 'overview', heading: 'Original overview heading', body: rich('Original overview copy.') }] } })
    const before = structuredClone(event)
    for (const bookingHref of ['/book/42', null]) {
      const ctx = context(event)
      ctx.trip.bookingHref = bookingHref
      const html = renderToStaticMarkup(TripContentBlock({ section: 'overview', variant: 'overview', eyebrow: 'About This Course' }, ctx))
      expect(html).toContain('data-eyebrow="section"')
      expect(html).toContain('About This Course')
      expect(html).toContain('Original overview copy.')
      expect(html).toContain(`href="${bookingHref ?? 'mailto:info@rockbusters.net'}"`)
      expect(html).toContain(bookingHref ? 'Book Your Spot' : 'Ask a Question')
    }
    expect(event).toEqual(before)
  })

  it('keeps partner and demo content even when no unmatched prose remains', () => {
    const event = source({
      partnerHeadline: 'Original partner headline', partnerDescription: 'Original partner description.',
      partnerBenefits: [{ text: 'Original partner benefit.' }],
      demoEnabled: true, demoHeading: 'Original demo heading', demoBody: rich('Original demo body.'),
      demoCta: { label: 'Original demo action', url: '/original-demo' },
    })
    const ctx = context(event)
    expect(defaultTripLayout(ctx.trip)).toContainEqual(expect.objectContaining({ blockType: 'tripContent', section: 'remaining', variant: 'prose' }))
    const html = renderToStaticMarkup(TripContentBlock({ section: 'remaining' }, ctx))
    for (const text of ['Original partner headline', 'Original partner description.', 'Original partner benefit.', 'Original demo heading', 'Original demo body.', 'Original demo action']) expect(html).toContain(text)
    expect(html).toContain('href="/original-demo"')
    expect(html).not.toContain('More about this trip')
  })

  it('keeps unmatched rich text and additional sections alongside partner content', () => {
    const event = source({ content: rich('Original unmatched main content.'), additionalInfo: [{ heading: 'Original additional heading', body: rich('Original additional body.') }], partnerDescription: 'Original partner copy.' })
    const html = renderToStaticMarkup(TripContentBlock({ section: 'remaining' }, context(event)))
    for (const text of ['Original unmatched main content.', 'Original additional heading', 'Original additional body.', 'Original partner copy.']) expect(html).toContain(text)
    expect(html).not.toContain('<details>')
    expect(html).toContain('More about this trip')
    expect(html).not.toContain('Try before you commit')
  })
})
