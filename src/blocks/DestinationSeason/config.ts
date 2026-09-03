import type { Block } from 'payload'

export const DestinationSeasonBlockConfig: Block = {
  slug: 'destinationSeason',
  labels: { singular: 'Destination Season', plural: 'Destination Season blocks' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Season',
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'When to go',
    },
    {
      name: 'intro',
      type: 'textarea',
    },
  ],
}

export const DestinationSeasonBlock = DestinationSeasonBlockConfig
