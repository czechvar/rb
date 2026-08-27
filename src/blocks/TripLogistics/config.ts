import type { Block } from 'payload'

export const TripLogisticsBlockConfig: Block = {
  slug: 'tripLogistics',
  labels: { singular: 'Trip Logistics', plural: 'Trip Logistics blocks' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Everything Sorted',
      admin: {
        description: 'Uses the accommodation and transport content from the current Event.',
      },
    },
  ],
}

export const TripLogisticsBlock = TripLogisticsBlockConfig
