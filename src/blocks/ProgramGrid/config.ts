import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const ProgramGridBlockConfig: Block = {
  slug: 'programGrid',
  labels: { singular: 'Program Grid', plural: 'Program Grids' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    selectField('source', {
      defaultValue: 'featured',
      values: [
        { label: 'Featured programs', value: 'featured' },
        { label: 'All active programs', value: 'all' },
        { label: 'Manual selection', value: 'manual' },
      ],
    }),
    {
      name: 'programs',
      type: 'relationship',
      relationTo: 'programs',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
      filterOptions: () => ({ active: { equals: true }, state: { equals: 'published' } }),
    },
    { name: 'limit', type: 'number', min: 1, max: 12, defaultValue: 6 },
    selectField('variant', {
      defaultValue: 'cards',
      values: [
        { label: 'Cards', value: 'cards' },
        { label: 'Compact', value: 'compact' },
        { label: 'Dark compact', value: 'darkCompact' },
      ],
    }),
  ],
}

export const ProgramGridBlock = ProgramGridBlockConfig
