import type { Block } from 'payload'

export const CTABlock: Block = {
  slug: 'cta',
  labels: { singular: 'CTA', plural: 'CTAs' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'dark',
      required: true,
      options: [
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' },
        { label: 'Red', value: 'red' },
      ],
    },
    {
      name: 'primaryAction',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'secondaryAction',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
  ],
}
