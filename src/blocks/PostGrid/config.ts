import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const PostGridBlockConfig: Block = {
  slug: 'postGrid',
  labels: { singular: 'Post Grid', plural: 'Post Grids' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'latest',
      options: [
        { label: 'Latest published posts', value: 'latest' },
        { label: 'By category', value: 'byCategory' },
        { label: 'Manual selection', value: 'manual' },
      ],
      admin: { condition: (_, data) => data?.variant !== 'index' },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'post-categories',
      admin: {
        condition: (_, siblingData) =>
          siblingData?.variant !== 'index' && siblingData?.source === 'byCategory',
      },
    },
    {
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      admin: {
        condition: (_, siblingData) =>
          siblingData?.variant === 'index' || siblingData?.source === 'manual',
        description:
          'For the full blog index, the first selected published post is featured. Leave empty to feature the newest post.',
      },
      filterOptions: () => ({ state: { equals: 'published' } }),
    },
    {
      name: 'limit',
      type: 'number',
      min: 1,
      max: 12,
      defaultValue: 3,
      admin: { condition: (_, data) => data?.variant !== 'index' },
    },
    selectField('variant', {
      defaultValue: 'cards',
      values: [
        { label: 'Cards', value: 'cards' },
        { label: 'Compact', value: 'compact' },
        { label: 'Full blog index (filters, featured story, statistics)', value: 'index' },
      ],
    }),
  ],
}

export const PostGridBlock = PostGridBlockConfig
