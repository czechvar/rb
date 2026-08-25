import type { Block } from 'payload'

export const FAQBlock: Block = {
  slug: 'faq',
  labels: { singular: 'FAQ', plural: 'FAQ blocks' },
  fields: [
    { name: 'eyebrow', type: 'text', defaultValue: 'Quick answers' },
    { name: 'heading', type: 'text', defaultValue: 'FAQ', required: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'global',
      required: true,
      options: [
        { label: 'Global active FAQs', value: 'global' },
        { label: 'Manual FAQ selection', value: 'manual' },
        { label: 'Inline manual entries', value: 'inline' },
        { label: 'By event', value: 'byEvent' },
        { label: 'By program', value: 'byProgram' },
      ],
    },
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
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'twoColumn',
      required: true,
      options: [
        { label: 'Two column', value: 'twoColumn' },
        { label: 'Single column', value: 'singleColumn' },
      ],
    },
  ],
}
