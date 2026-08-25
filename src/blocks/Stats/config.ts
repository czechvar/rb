import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const StatsBlockConfig: Block = {
  slug: 'stats',
  labels: { singular: 'Stats', plural: 'Stats blocks' },
  fields: [
    ...headingFields(),
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'body', type: 'textarea' },
      ],
    },
    selectField('variant', {
      defaultValue: 'light',
      values: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ],
    }),
  ],
}

export const StatsBlock = StatsBlockConfig
