import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { type BlockRenderContext, RenderBlocks } from '@/components/blocks/RenderBlocks'
import type { Event, EventDate, Faq, Guide, Media, Partner, Review } from '@/payload-types'

type RenderBlocksInput = Parameters<typeof RenderBlocks>[0]

const richText = (text: string): Record<string, unknown> => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', version: 1, text }],
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
})

describe('Homepage layout blocks', () => {
  it('renders coded homepage sections from a shared homepage context', async () => {
    const event = {
      id: 9501,
      title: 'POC Homepage Trip',
      slug: 'poc-homepage-trip',
      shortDescription: 'A homepage trip rendered from shared context.',
      state: 'published',
      locations: [{ id: 9502, name: 'Arco, Italy' }],
    } as Event
    const date = {
      id: 9503,
      event: event.id,
      dateFrom: '2026-09-01T00:00:00.000Z',
      dateTo: '2026-09-07T00:00:00.000Z',
      price: 990,
      currency: 'EUR',
      active: true,
    } as EventDate
    const review = {
      id: 9504,
      quote: 'The coaching made the trip click.',
      resultLine: 'A clear breakthrough week.',
      reviewerName: 'POC Climber',
      active: true,
    } as Review
    const faq = {
      id: 9505,
      question: 'Can I use the homepage builder?',
      answer: richText('Yes, through coded blocks.'),
      active: true,
    } as Faq
    const partner = { id: 9506, name: 'POC Partner', active: true } as Partner
    const pro = { id: 9507, name: 'POC Pro Climber', active: true } as Guide
    const founder = { id: 9508, name: 'POC Founder', role: 'Founder', active: true } as Guide

    const element = await RenderBlocks({
      blocks: [
        { blockType: 'homeHero' },
        { blockType: 'homeStats' },
        { blockType: 'homeFeaturedTrips' },
        { blockType: 'homeProClimbers' },
        { blockType: 'homeTestimonials' },
        { blockType: 'homeTeam' },
        { blockType: 'homeFAQ' },
        { blockType: 'homePartners' },
        { blockType: 'homeFinalCTA' },
      ] as RenderBlocksInput['blocks'],
      context: {
        homepage: {
          heroMedia: null as Media | null,
          events: [event],
          allDates: [date],
          reviews: [review],
          faqs: [faq],
          partners: [partner],
          proClimbers: [pro],
          founder,
        },
      } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))

    expect(markup).toContain('CLIMB')
    expect(markup).toContain('POC Homepage Trip')
    expect(markup).toContain('POC Pro Climber')
    expect(markup).toContain('The coaching made the trip click.')
    expect(markup).toContain('Can I use the homepage builder?')
    expect(markup).toContain('POC Partner')
    expect(markup).toContain('POC Founder')
    expect(markup).toContain('YOUR NEXT LEVEL')
  })
})
