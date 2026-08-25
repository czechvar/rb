import type { Block } from 'payload'

export const TripHighlightsBlockConfig: Block = {
  slug: 'tripHighlights',
  labels: { singular: 'Trip Highlights', plural: 'Trip Highlights blocks' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Trip Highlights',
    },
  ],
}

export const TripHighlightsBlock = TripHighlightsBlockConfig
