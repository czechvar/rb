import type { Block } from 'payload'

export const TripDatesBlockConfig: Block = {
  slug: 'tripDates',
  labels: { singular: 'Trip Dates', plural: 'Trip Dates blocks' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Dates & Pricing',
    },
  ],
}

export const TripDatesBlock = TripDatesBlockConfig
