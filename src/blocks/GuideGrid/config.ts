import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const GuideGridBlockConfig: Block = {
  slug: 'guideGrid',
  labels: { singular: 'Guide Grid', plural: 'Guide Grids' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    selectField('source', {
      defaultValue: 'team',
      values: [
        { label: 'Rockbusters team', value: 'team' },
        { label: 'Friends & ambassadors', value: 'friends' },
        { label: 'Featured guides', value: 'featured' },
        { label: 'Manual selection', value: 'manual' },
      ],
    }),
    {
      name: 'guides',
      type: 'relationship',
      relationTo: 'guides',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
      filterOptions: () => ({ active: { equals: true } }),
    },
    { name: 'limit', type: 'number', min: 1, max: 12, defaultValue: 6 },
    selectField('variant', {
      defaultValue: 'cards',
      values: [
        { label: 'Cards', value: 'cards' },
        { label: 'Compact', value: 'compact' },
      ],
    }),
  ],
}

export const GuideGridBlock = GuideGridBlockConfig
