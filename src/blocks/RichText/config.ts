import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const RichTextBlockConfig: Block = {
  slug: 'rich-text',
  labels: { singular: 'Rich Text', plural: 'Rich Text blocks' },
  fields: [
    ...headingFields().filter((field) => 'name' in field && field.name !== 'body'),
    { name: 'content', type: 'richText', required: true },
    selectField('width', {
      defaultValue: 'standard',
      values: [
        { label: 'Standard', value: 'standard' },
        { label: 'Wide', value: 'wide' },
      ],
    }),
  ],
}

export const RichTextBlock = RichTextBlockConfig
