import type { Block } from 'payload'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  labels: { singular: 'Media', plural: 'Media blocks' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'body', type: 'textarea' },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'upload',
      required: true,
      options: [
        { label: 'Payload upload', value: 'upload' },
        { label: 'External video URL', value: 'externalVideo' },
      ],
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData.source === 'upload',
      },
    },
    {
      name: 'videoUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData.source === 'externalVideo',
      },
    },
    { name: 'caption', type: 'textarea' },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'wide',
      required: true,
      options: [
        { label: 'Wide', value: 'wide' },
        { label: 'Contained', value: 'contained' },
        { label: 'Split text/media', value: 'split' },
      ],
    },
  ],
}
