import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const TripGridBlockConfig: Block = {
  slug: 'tripGrid',
  labels: { singular: 'Trip Grid', plural: 'Trip Grids' },
  fields: [
    ...headingFields({ headingRequired: true, eyebrowDefault: 'Trips', bodyName: 'intro' }),
    selectField('source', {
      defaultValue: 'featured',
      values: [
        { label: 'Featured trips', value: 'featured' },
        { label: 'Upcoming trips', value: 'upcoming' },
        { label: 'Manual selection', value: 'manual' },
        { label: 'By program', value: 'byProgram' },
        { label: 'By location', value: 'byLocation' },
      ],
    }),
    {
      name: 'events',
      type: 'relationship',
      relationTo: 'events',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData.source === 'manual',
      },
    },
    {
      name: 'program',
      type: 'relationship',
      relationTo: 'programs',
      filterOptions: () => ({ active: { equals: true } }),
      admin: {
        condition: (_, siblingData) => siblingData.source === 'byProgram',
      },
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      filterOptions: () => ({ active: { equals: true } }),
      admin: {
        condition: (_, siblingData) => siblingData.source === 'byLocation',
      },
    },
    {
      name: 'limit',
      type: 'number',
      min: 1,
      max: 12,
      defaultValue: 6,
      required: true,
    },
    selectField('variant', {
      defaultValue: 'cards',
      values: [
        { label: 'Cards', value: 'cards' },
        { label: 'Compact', value: 'compact' },
        { label: 'Editorial lead', value: 'editorial' },
        { label: 'Feature lead', value: 'featureLead' },
      ],
    }),
  ],
}

export const TripGridBlock = TripGridBlockConfig
