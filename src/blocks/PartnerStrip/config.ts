import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const PartnerStripBlockConfig: Block = {
  slug: 'partnerStrip',
  labels: { singular: 'Partner Strip', plural: 'Partner Strips' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    selectField('source', {
      defaultValue: 'featured',
      values: [
        { label: 'Featured partners', value: 'featured' },
        { label: 'All active partners', value: 'all' },
        { label: 'Manual selection', value: 'manual' },
      ],
    }),
    {
      name: 'partners',
      type: 'relationship',
      relationTo: 'partners',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
      filterOptions: () => ({ active: { equals: true } }),
    },
    { name: 'limit', type: 'number', min: 1, max: 12, defaultValue: 6 },
    selectField('variant', {
      defaultValue: 'logos',
      values: [
        { label: 'Logo strip', value: 'logos' },
        { label: 'Cards', value: 'cards' },
      ],
    }),
  ],
}

export const PartnerStripBlock = PartnerStripBlockConfig
