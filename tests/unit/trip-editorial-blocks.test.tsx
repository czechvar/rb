import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Event, Review } from '@/payload-types'
import type { TripDetailView } from '@/lib/trip-detail'
import { FAQBlock } from '@/components/blocks/FAQBlock'
import { ReviewGridBlock } from '@/components/blocks/ReviewGridBlock'
import { TripLogisticsBlock } from '@/components/blocks/TripLogisticsBlock'
import { resolveFAQs } from '@/lib/block-resolvers/faq'
import { resolveReviewGridReviews } from '@/lib/block-resolvers/domain-grids'
vi.mock('@/lib/block-resolvers/faq', () => ({ resolveFAQs: vi.fn(async () => []) }))
vi.mock('@/lib/block-resolvers/domain-grids', () => ({ resolveReviewGridReviews: vi.fn(async () => []) }))

const event = { id: 8, accommodation: { included: [{ text: 'Legacy coaching' }], notIncluded: [{ text: 'Flights' }] } } as Event
const view = (editorial: TripDetailView['editorial']) => ({ event, editorial, accommodation: event.accommodation } as TripDetailView)

describe('occurrence editorial block boundaries', () => {
  it('keeps explicit other-event FAQ/reviews sources independent of current-trip overrides', async () => {
    const trip = view({ sections: [{ key: 'faq', visibility: 'hide', hide: true }, { key: 'reviews', hide: true }], faqs: [{ question: 'Kalymnos only', answer: 'Preview' }], previewReviews: [{ quote: 'Kalymnos preview' }] })
    await FAQBlock({ blockType: 'faq', heading: 'Questions', limit: 10, variant: 'singleColumn', source: 'byEvent', event: 99 }, { event, trip })
    expect(resolveFAQs).toHaveBeenLastCalledWith(expect.objectContaining({ event: 99 }))
    vi.mocked(resolveReviewGridReviews).mockResolvedValueOnce([{ id: 1, quote: 'Other event review', reviewerName: 'Reviewer' } as Review])
    const html = renderToStaticMarkup(await ReviewGridBlock({ blockType: 'reviewGrid', variant: 'cards', source: 'byEvent', event: 99 }, { event, trip }))
    expect(resolveReviewGridReviews).toHaveBeenLastCalledWith(expect.objectContaining({ event: 99 }))
    expect(html).toContain('Other event review')
    expect(html).not.toContain('Kalymnos preview')
  })

  it('renders current occurrence FAQ introduction and FAQ content', async () => {
    const trip = view({ sections: [{ key: 'faq', intro: 'Before your trip' }], faqs: [{ question: 'What now?', answer: 'Go climbing.' }] })
    const html = renderToStaticMarkup(await FAQBlock({ blockType: 'faq', heading: 'Questions', limit: 10, variant: 'singleColumn', source: 'byEvent' }, { event, trip }))
    expect(html).toContain('Before your trip')
    expect(html).toContain('Go climbing.')
  })

  it('renders package-only copy with legacy included/excluded content exactly once', () => {
    const trip = view({ sections: [{ key: 'package', heading: 'Your package' }] })
    const html = renderToStaticMarkup(TripLogisticsBlock({}, { event, trip }))
    expect(html).toContain('Your package')
    expect(html.match(/Legacy coaching/g)).toHaveLength(1)
    expect(html.match(/Flights/g)).toHaveLength(1)
  })

  it('renders package items without requiring practical cards, retaining exclusions', () => {
    const trip = view({ packageItems: [{ text: 'New package coaching' }] })
    const html = renderToStaticMarkup(TripLogisticsBlock({}, { event, trip }))
    expect(html).toContain('New package coaching')
    expect(html).not.toContain('Legacy coaching')
    expect(html).toContain('Flights')
  })

  it('keeps package independent when logistics is hidden and hides it explicitly', () => {
    const trip = view({ sections: [{ key: 'logistics', hide: true }], practicalCards: [{ heading: 'Travel card', body: 'Details' }] })
    const html = renderToStaticMarkup(TripLogisticsBlock({}, { event, trip }))
    expect(html).toContain('Legacy coaching')
    expect(html).not.toContain('Travel card')
    trip.editorial!.sections!.push({ key: 'package', hide: true })
    expect(renderToStaticMarkup(TripLogisticsBlock({}, { event, trip }))).toBe('')
  })
})
