import type { Block } from 'payload'

export const LocationContentBlockConfig: Block = {
  slug: 'locationContent',
  labels: { singular: 'Location Content', plural: 'Location Content blocks' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'The Venue',
    },
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Destination',
    },
  ],
}

export const LocationContentBlock = LocationContentBlockConfig
