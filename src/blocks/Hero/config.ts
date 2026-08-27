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
    actionField('primaryAction'),
  ],
}

export const HeroBlock = HeroBlockConfig
