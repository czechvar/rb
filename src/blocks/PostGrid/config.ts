import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const PostGridBlockConfig: Block = {
  slug: 'postGrid',
  labels: { singular: 'Post Grid', plural: 'Post Grids' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    selectField('source', {
      defaultValue: 'latest',
      values: [
        { label: 'Latest published posts', value: 'latest' },
        { label: 'By category', value: 'byCategory' },
        { label: 'Manual selection', value: 'manual' },
      ],
    }),
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'post-categories',
      admin: { condition: (_, siblingData) => siblingData?.source === 'byCategory' },
    },
    {
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
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

export const PostGridBlock = PostGridBlockConfig
