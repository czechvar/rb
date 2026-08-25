import type { Block } from 'payload'

export const TripGridBlock: Block = {
  slug: 'tripGrid',
  labels: { singular: 'Trip Grid', plural: 'Trip Grids' },
  fields: [
    { name: 'eyebrow', type: 'text', defaultValue: 'Trips' },
    { name: 'heading', type: 'text', required: true },
    { name: 'intro', type: 'textarea' },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'featured',
      required: true,
      options: [
        { label: 'Featured trips', value: 'featured' },
        { label: 'Upcoming trips', value: 'upcoming' },
        { label: 'Manual selection', value: 'manual' },
        { label: 'By program', value: 'byProgram' },
        { label: 'By location', value: 'byLocation' },
      ],
    },
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
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'cards',
      required: true,
      options: [
        { label: 'Cards', value: 'cards' },
        { label: 'Compact', value: 'compact' },
        { label: 'Editorial lead', value: 'editorial' },
      ],
    },
  ],
}
