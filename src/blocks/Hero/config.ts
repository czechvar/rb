import type { Block } from 'payload'
import { actionField, headingFields, mediaUploadField, selectField } from '../fields'

export const HeroBlockConfig: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    ...headingFields({ headingRequired: true }),
    mediaUploadField('backgroundMedia'),
    selectField('variant', {
      defaultValue: 'overlay',
      values: [
        { label: 'Image overlay', value: 'overlay' },
        { label: 'Editorial', value: 'editorial' },
        { label: 'Simple', value: 'simple' },
        { label: 'Brand editorial', value: 'brandEditorial' },
      ],
    }),
    {
      name: 'accentWords',
      label: 'Accent words',
      type: 'array',
      admin: {
        description: 'Words or phrases in the heading to render in the brand accent color.',
        condition: (_, siblingData) => siblingData?.variant === 'brandEditorial',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
    actionField('primaryAction'),
  ],
}

export const HeroBlock = HeroBlockConfig
