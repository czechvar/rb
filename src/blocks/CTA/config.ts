import type { Block } from 'payload'
import { actionField, headingFields, selectField } from '../fields'

export const CTABlockConfig: Block = {
  slug: 'cta',
  labels: { singular: 'CTA', plural: 'CTAs' },
  fields: [
    ...headingFields({ headingRequired: true }),
    selectField('variant', {
      defaultValue: 'dark',
      values: [
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' },
        { label: 'Red', value: 'red' },
        { label: 'Final red', value: 'finalRed' },
      ],
    }),
    actionField('primaryAction'),
    actionField('secondaryAction'),
  ],
}

export const CTABlock = CTABlockConfig
