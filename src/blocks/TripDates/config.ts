import type { Block } from 'payload'
import { selectField } from '../fields'

export const TripDatesBlockConfig: Block = {
  slug: 'tripDates',
  labels: { singular: 'Trip Dates', plural: 'Trip Dates blocks' },
  fields: [
    selectField('variant', { defaultValue: 'default', values: [{'label': 'Default', 'value': 'default'}, {'label': 'Rows', 'value': 'rows'}] }),
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Dates & Pricing',
    },
  ],
}

export const TripDatesBlock = TripDatesBlockConfig
