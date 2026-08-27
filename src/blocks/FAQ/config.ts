import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const FAQBlockConfig: Block = {
  slug: 'faq',
  labels: { singular: 'FAQ', plural: 'FAQ blocks' },
  fields: [
    ...headingFields({
      headingRequired: true,
      headingDefault: 'FAQ',
      eyebrowDefault: 'Quick answers',
    }).filter(
      (field) => 'name' in field && field.name !== 'body',
    ),
    selectField('source', {
      defaultValue: 'global',
      values: [
        { label: 'Global active FAQs', value: 'global' },
        { label: 'Manual FAQ selection', value: 'manual' },
        { label: 'Inline manual entries', value: 'inline' },
        { label: 'By event', value: 'byEvent' },
        { label: 'By program', value: 'byProgram' },
      ],
    }),
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData.source === 'manual',
      },
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      admin: {
        condition: (_, siblingData) => siblingData.source === 'byEvent',
      },
    },
    {
      name: 'program',
      type: 'relationship',
      relationTo: 'programs',
      filterOptions: () => ({ active: { equals: true } }),
      admin: {
        condition: (_, siblingData) => siblingData.source === 'byProgram',
      },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Inline FAQ entries',
      admin: {
        condition: (_, siblingData) => siblingData.source === 'inline',
      },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'richText', required: true },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      min: 1,
      max: 20,
      defaultValue: 6,
      required: true,
    },
    selectField('variant', {
      defaultValue: 'twoColumn',
      values: [
        { label: 'Two column', value: 'twoColumn' },
        { label: 'Single column', value: 'singleColumn' },
        { label: 'Light editorial', value: 'lightEditorial' },
      ],
    }),
  ],
}

export const FAQBlock = FAQBlockConfig
