import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Event, Media } from '@/payload-types'
import { GalleryBlock } from '@/components/blocks/GalleryBlock'
import { ImageTripCard } from '@/components/catalogue/ImageTripCard'
import sharedStyles from '@/components/catalogue/ImageTripCard.module.css'

vi.mock('next/image', () => ({ default: ({ fill: _fill, ...props }: React.ComponentProps<'img'> & { fill?: boolean }) => React.createElement('img', props) }))
const media: Media = { id: 'unit-gallery', url: '/original-gallery.jpg', alt: 'Original gallery description', createdAt: '', updatedAt: '' }

describe('shared trip gallery presentation', () => {
  it.each([1, 2, 5])('renders %i Event images through shared photo cards without trip navigation or commercial text', count => {
    const images = Array.from({ length: count }, (_, index) => ({ ...media, id: `${media.id}-${index}` }))
    const event = { gallery: images } as Event
    const html = renderToStaticMarkup(<GalleryBlock blockType="gallery" source="currentEvent" variant="featureLead" context={{ event }} />)
    expect(html).toContain(`class="${sharedStyles.grid} ${sharedStyles.photoGrid}"`)
    expect(html.match(/<figure /g)).toHaveLength(count)
    expect(html.match(/alt="Original gallery description"/g)).toHaveLength(count)
    expect(html).toContain(sharedStyles.featured)
    expect(html).not.toMatch(/<a[ >]|Upcoming dates|View trip details|Rockbusters trip|aria-hidden/)
  })
  it('limits the detail variant to the first five valid images without mutating the source', () => {
    const images = Array.from({ length: 64 }, (_, index) => ({ ...media, id: `${media.id}-${index}`, alt: `Source photo ${index}` }))
    const source = ['unresolved-media-id', ...images]
    const before = structuredClone(source)
    const html = renderToStaticMarkup(<GalleryBlock blockType="gallery" source="manual" variant="featureLead" images={source} />)
    expect(html.match(/<figure /g)).toHaveLength(5)
    expect([...html.matchAll(/alt="Source photo (\d+)"/g)].map(match => Number(match[1]))).toEqual([0, 1, 2, 3, 4])
    expect(source).toEqual(before)
    for (const variant of ['grid', 'masonry', 'tiles'] as const) {
      const legacy = renderToStaticMarkup(<GalleryBlock blockType="gallery" source="manual" variant={variant} images={source} />)
      expect(legacy.match(/<figure /g)).toHaveLength(64)
    }
  })
  it('keeps the default linked catalogue card unchanged', () => {
    const html = renderToStaticMarkup(<ImageTripCard href="/trips/original" title="Original trip" image={media.url} />)
    expect(html).toContain('href="/trips/original"')
    expect(html).toContain('Original trip')
    expect(html).toContain('View trip details')
    expect(html).toContain('alt=""')
    expect(html).not.toContain('<figure')
  })
  it.each(['grid', 'masonry', 'tiles'] as const)('preserves the existing %s media-only gallery', variant => {
    const html = renderToStaticMarkup(<GalleryBlock blockType="gallery" source="manual" variant={variant} images={[media]} />)
    expect(html).toContain('alt="Original gallery description"')
    expect(html).not.toContain(sharedStyles.photo)
    expect(html).not.toContain('<a ')
  })
  it('omits empty and unresolved galleries', () => {
    expect(renderToStaticMarkup(<GalleryBlock blockType="gallery" source="manual" variant="featureLead" images={[media.id]} />)).toBe('')
  })
})
