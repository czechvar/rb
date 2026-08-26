import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { type BlockRenderContext, RenderBlocks } from '@/components/blocks/RenderBlocks'

type RenderBlocksInput = Parameters<typeof RenderBlocks>[0]

describe('RenderBlocks', () => {
  it('renders nothing for an empty layout', async () => {
    await expect(RenderBlocks({ blocks: [] })).resolves.toBeNull()
    await expect(RenderBlocks({ blocks: null })).resolves.toBeNull()
  })

  it('ignores unknown block types and preserves rendered block order', async () => {
    const element = await RenderBlocks({
      blocks: [
        {
          id: 'first',
          blockType: 'cta',
          heading: 'First CTA',
          variant: 'dark',
        },
        {
          id: 'ignored',
          blockType: 'unsupported',
          heading: 'Do not render',
        },
        {
          id: 'second',
          blockType: 'hero',
          heading: 'Second Hero',
          variant: 'simple',
        },
      ] as RenderBlocksInput['blocks'],
      context: { page: { id: 123, slug: 'test-page' } } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('First CTA')
    expect(markup).toContain('Second Hero')
    expect(markup).not.toContain('Do not render')
    expect(markup.indexOf('First CTA')).toBeLessThan(markup.indexOf('Second Hero'))
  })

  it('renders generic content and media blocks', async () => {
    const element = await RenderBlocks({
      blocks: [
        {
          blockType: 'section-intro',
          eyebrow: 'Generic content',
          heading: 'Reusable intro',
          body: 'Short lead copy.',
          alignment: 'left',
        },
        {
          blockType: 'stats',
          heading: 'Proof points',
          items: [
            { value: '12', label: 'Locations' },
            { value: '98%', label: 'Would return' },
          ],
        },
        {
          blockType: 'video',
          heading: 'Training film',
          videoUrl: 'https://vimeo.com/123456',
          caption: 'A safe external video.',
        },
      ] as RenderBlocksInput['blocks'],
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('Reusable intro')
    expect(markup).toContain('Short lead copy.')
    expect(markup).toContain('12')
    expect(markup).toContain('Would return')
    expect(markup).toContain('https://player.vimeo.com/video/123456')
    expect(markup).toContain('A safe external video.')
  })

  it('does not render unsafe action hrefs', async () => {
    const element = await RenderBlocks({
      blocks: [
        {
          blockType: 'cta',
          heading: 'Unsafe CTA',
          variant: 'dark',
          primaryAction: { label: 'Bad link', href: 'javascript:alert(1)' },
          secondaryAction: { label: 'Good link', href: 'https://example.com' },
        },
      ] as RenderBlocksInput['blocks'],
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).not.toContain('javascript:alert')
    expect(markup).not.toContain('Bad link')
    expect(markup).toContain('https://example.com')
    expect(markup).toContain('Good link')
  })

  it('renders domain-aware catalogue and social proof blocks', async () => {
    const element = await RenderBlocks({
      blocks: [
        {
          blockType: 'programGrid',
          source: 'manual',
          heading: 'Program cards',
          programs: [
            {
              id: 10,
              name: 'Performance Camps',
              slug: 'performance-camps',
              shortDescription: 'Structured coaching weeks.',
              active: true,
              state: 'published',
            },
          ],
        },
        {
          blockType: 'locationGrid',
          source: 'manual',
          heading: 'Location cards',
          locations: [
            {
              id: 20,
              name: 'Frankenjura',
              slug: 'frankenjura',
              city: 'Pottenstein',
              country: 'Germany',
              active: true,
            },
          ],
        },
        {
          blockType: 'guideGrid',
          source: 'manual',
          heading: 'Guide cards',
          guides: [
            {
              id: 30,
              name: 'Jany Novotny',
              slug: 'jany',
              role: 'Founder & Head Coach',
              tagline: 'Direct technical coaching.',
              active: true,
            },
          ],
        },
        {
          blockType: 'reviewGrid',
          source: 'manual',
          heading: 'Review cards',
          reviews: [
            {
              id: 40,
              quote: 'Best week on rock.',
              reviewerName: 'Lucie K.',
              reviewerLocation: 'Brno',
              resultLine: 'First 7a.',
              active: true,
            },
          ],
        },
      ] as RenderBlocksInput['blocks'],
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('Performance Camps')
    expect(markup).toContain('/programs/performance-camps')
    expect(markup).toContain('Frankenjura')
    expect(markup).toContain('/destinations/frankenjura')
    expect(markup).toContain('Jany Novotny')
    expect(markup).toContain('/team/jany')
    expect(markup).toContain('Best week on rock.')
    expect(markup).toContain('Lucie K.')
  })

  it('renders discovery and guide companion blocks', async () => {
    const element = await RenderBlocks({
      blocks: [
        {
          blockType: 'postGrid',
          source: 'manual',
          heading: 'Latest stories',
          posts: [
            {
              id: 50,
              title: 'Training for limestone',
              slug: 'training-for-limestone',
              excerpt: 'A practical prep note.',
              state: 'published',
              publishedAt: '2026-05-15T09:00:00.000Z',
            },
          ],
        },
        {
          blockType: 'calendar',
          source: 'manual',
          heading: 'Upcoming dates',
          eventDates: [
            {
              id: 60,
              dateFrom: '2026-09-12T00:00:00.000Z',
              dateTo: '2026-09-19T00:00:00.000Z',
              price: 1290,
              currency: 'EUR',
              capacity: 8,
              active: true,
              event: {
                id: 61,
                title: 'Deep Blue Psicobloc Camp',
                slug: 'deep-blue-psicobloc',
                state: 'published',
              },
            },
          ],
        },
        {
          blockType: 'partnerStrip',
          source: 'manual',
          heading: 'Trusted partners',
          partners: [
            {
              id: 70,
              name: 'YY Vertical',
              slug: 'yy-vertical',
              link: 'https://yyvertical.com',
              active: true,
              featured: true,
            },
          ],
        },
        {
          blockType: 'guideProfile',
          source: 'manual',
          heading: 'Coach profile',
          guide: {
            id: 80,
            name: 'Jany Novotny',
            slug: 'jany',
            role: 'Founder & Head Coach',
            tagline: 'Direct technical coaching.',
            active: true,
          },
        },
        {
          blockType: 'guideTrips',
          source: 'manual',
          heading: 'Trips with Jany',
          events: [
            {
              id: 90,
              title: 'Sport Climbing Basics',
              slug: 'sport-climbing-basics',
              shortDescription: 'Outdoor lead climbing week.',
              state: 'published',
            },
          ],
        },
      ] as RenderBlocksInput['blocks'],
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('Training for limestone')
    expect(markup).toContain('/blog/training-for-limestone')
    expect(markup).toContain('Deep Blue Psicobloc Camp')
    expect(markup).toContain('/trips/deep-blue-psicobloc')
    expect(markup).toContain('YY Vertical')
    expect(markup).toContain('https://yyvertical.com')
    expect(markup).toContain('Jany Novotny')
    expect(markup).toContain('/team/jany')
    expect(markup).toContain('Sport Climbing Basics')
  })

  it('renders featured single-item catalogue blocks', async () => {
    const element = await RenderBlocks({
      blocks: [
        {
          blockType: 'featuredTrip',
          source: 'manual',
          heading: 'Featured trip',
          event: {
            id: 101,
            title: 'Kalymnos Autumn Camp',
            slug: 'kalymnos-autumn-camp',
            shortDescription: 'A week of sea-cliff sport climbing.',
            state: 'published',
          },
          variant: 'feature',
        },
        {
          blockType: 'featuredProgram',
          heading: 'Featured program',
          program: {
            id: 102,
            name: 'Performance Camps',
            slug: 'performance-camps',
            shortDescription: 'Structured coaching weeks.',
            active: true,
            state: 'published',
          },
          variant: 'card',
        },
        {
          blockType: 'featuredLocation',
          heading: 'Featured location',
          location: {
            id: 103,
            name: 'El Chorro',
            slug: 'el-chorro',
            city: 'Malaga',
            country: 'Spain',
            active: true,
          },
          variant: 'mediaLed',
        },
        {
          blockType: 'featuredGuide',
          source: 'manual',
          heading: 'Featured guide',
          guide: {
            id: 104,
            name: 'Jany Novotny',
            slug: 'jany',
            role: 'Founder & Head Coach',
            tagline: 'Direct technical coaching.',
            active: true,
          },
          variant: 'compact',
        },
        {
          blockType: 'featuredPost',
          heading: 'Featured post',
          post: {
            id: 105,
            title: 'Training for limestone',
            slug: 'training-for-limestone',
            excerpt: 'A practical prep note.',
            state: 'published',
            publishedAt: '2026-05-15T09:00:00.000Z',
          },
          variant: 'card',
        },
        {
          blockType: 'featuredEventDate',
          heading: 'Featured date',
          eventDate: {
            id: 106,
            dateFrom: '2026-09-12T00:00:00.000Z',
            dateTo: '2026-09-19T00:00:00.000Z',
            price: 1290,
            currency: 'EUR',
            capacity: 8,
            active: true,
            event: {
              id: 107,
              title: 'Deep Blue Psicobloc Camp',
              slug: 'deep-blue-psicobloc',
              state: 'published',
            },
          },
          variant: 'card',
        },
      ] as RenderBlocksInput['blocks'],
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('Kalymnos Autumn Camp')
    expect(markup).toContain('/trips/kalymnos-autumn-camp')
    expect(markup).toContain('Performance Camps')
    expect(markup).toContain('/programs/performance-camps')
    expect(markup).toContain('El Chorro')
    expect(markup).toContain('/destinations/el-chorro')
    expect(markup).toContain('Jany Novotny')
    expect(markup).toContain('/team/jany')
    expect(markup).toContain('Training for limestone')
    expect(markup).toContain('/blog/training-for-limestone')
    expect(markup).toContain('Deep Blue Psicobloc Camp')
    expect(markup).toContain('EUR 1290')
  })
})
