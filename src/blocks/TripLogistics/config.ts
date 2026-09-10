import type { Block } from 'payload'
import { selectField } from '../fields'

export const TripLogisticsBlockConfig: Block = {
  slug: 'tripLogistics',
  labels: { singular: 'Trip Logistics', plural: 'Trip Logistics blocks' },
  fields: [
    selectField('variant', { defaultValue: 'default', values: [{'label': 'Default', 'value': 'default'}, {'label': 'Cards', 'value': 'cards'}] }),
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
