import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    {
      name: 'backgroundMedia',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'overlay',
      required: true,
      options: [
        { label: 'Image overlay', value: 'overlay' },
        { label: 'Editorial', value: 'editorial' },
        { label: 'Simple', value: 'simple' },
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
  ],
}
