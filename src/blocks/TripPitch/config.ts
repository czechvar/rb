import type { Block } from 'payload'

export const TripPitchBlockConfig: Block = {
  slug: 'tripPitch',
  labels: { singular: 'Trip Pitch', plural: 'Trip Pitch blocks' },
  fields: [
    {
      name: 'anchor',
      type: 'text',
      defaultValue: 'overview',
      admin: {
        description: 'Optional section anchor for in-page links.',
      },
    },
  ],
}

export const TripPitchBlock = TripPitchBlockConfig
