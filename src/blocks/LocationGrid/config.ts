import type { Block } from 'payload'
import { headingFields, selectField, textField } from '../fields'

export const LocationGridBlockConfig: Block = {
  slug: 'locationGrid',
  labels: { singular: 'Location Grid', plural: 'Location Grids' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    selectField('source', {
      defaultValue: 'featured',
      values: [
        { label: 'Featured locations', value: 'featured' },
        { label: 'All active locations', value: 'all' },
        { label: 'By country', value: 'byCountry' },
        { label: 'Manual selection', value: 'manual' },
      ],
    }),
    textField('country'),
    {
      name: 'locations',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
      filterOptions: () => ({ active: { equals: true } }),
    },
    { name: 'limit', type: 'number', min: 1, max: 24, defaultValue: 8 },
    selectField('variant', {
      defaultValue: 'cards',
      values: [
        { label: 'Cards', value: 'cards' },
        { label: 'Compact', value: 'compact' },
      ],
    }),
  ],
}

export const LocationGridBlock = LocationGridBlockConfig
