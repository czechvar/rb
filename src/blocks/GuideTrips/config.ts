import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const GuideTripsBlockConfig: Block = {
  slug: 'guideTrips',
  labels: { singular: 'Guide Trips', plural: 'Guide Trips' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    selectField('source', {
      defaultValue: 'byGuide',
      values: [
        { label: 'Trips for selected guide', value: 'byGuide' },
        { label: 'Current guide context', value: 'currentGuide' },
        { label: 'Manual selection', value: 'manual' },
      ],
    }),
    {
      name: 'guide',
      type: 'relationship',
      relationTo: 'guides',
      admin: { condition: (_, siblingData) => siblingData?.source === 'byGuide' },
      filterOptions: () => ({ active: { equals: true } }),
    },
    {
      name: 'events',
      type: 'relationship',
      relationTo: 'events',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
      filterOptions: () => ({ state: { equals: 'published' } }),
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

export const GuideTripsBlock = GuideTripsBlockConfig
