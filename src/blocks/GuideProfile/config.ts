import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const GuideProfileBlockConfig: Block = {
  slug: 'guideProfile',
  labels: { singular: 'Guide Profile', plural: 'Guide Profiles' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    selectField('source', {
      defaultValue: 'manual',
      values: [
        { label: 'Manual guide', value: 'manual' },
        { label: 'Current guide context', value: 'currentGuide' },
      ],
    }),
    {
      name: 'guide',
      type: 'relationship',
      relationTo: 'guides',
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
      filterOptions: () => ({ active: { equals: true } }),
    },
    selectField('variant', {
      defaultValue: 'feature',
      values: [
        { label: 'Feature', value: 'feature' },
        { label: 'Compact', value: 'compact' },
      ],
    }),
  ],
}

export const GuideProfileBlock = GuideProfileBlockConfig
