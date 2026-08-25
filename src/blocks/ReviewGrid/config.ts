import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const ReviewGridBlockConfig: Block = {
  slug: 'reviewGrid',
  labels: { singular: 'Review Grid', plural: 'Review Grids' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    selectField('source', {
      defaultValue: 'global',
      values: [
        { label: 'Global reviews', value: 'global' },
        { label: 'By Event', value: 'byEvent' },
        { label: 'By Program', value: 'byProgram' },
        { label: 'Manual selection', value: 'manual' },
      ],
    }),
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      admin: { condition: (_, siblingData) => siblingData?.source === 'byEvent' },
      filterOptions: () => ({ state: { equals: 'published' } }),
    },
    {
      name: 'program',
      type: 'relationship',
      relationTo: 'programs',
      admin: { condition: (_, siblingData) => siblingData?.source === 'byProgram' },
      filterOptions: () => ({ active: { equals: true }, state: { equals: 'published' } }),
    },
    {
      name: 'reviews',
      type: 'relationship',
      relationTo: 'reviews',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
      filterOptions: () => ({ active: { equals: true } }),
    },
    { name: 'limit', type: 'number', min: 1, max: 12, defaultValue: 3 },
    selectField('variant', {
      defaultValue: 'cards',
      values: [
        { label: 'Cards', value: 'cards' },
        { label: 'Compact', value: 'compact' },
      ],
    }),
  ],
}

export const ReviewGridBlock = ReviewGridBlockConfig
