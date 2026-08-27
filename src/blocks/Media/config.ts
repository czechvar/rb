import type { Block } from 'payload'
import { headingFields, selectField, textareaField } from '../fields'

export const MediaBlockConfig: Block = {
  slug: 'mediaBlock',
  labels: { singular: 'Media', plural: 'Media blocks' },
  fields: [
    ...headingFields(),
    selectField('source', {
      defaultValue: 'upload',
      values: [
        { label: 'Payload upload', value: 'upload' },
        { label: 'External video URL', value: 'externalVideo' },
      ],
    }),
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
    textareaField('caption'),
    selectField('variant', {
      defaultValue: 'wide',
      values: [
        { label: 'Wide', value: 'wide' },
        { label: 'Contained', value: 'contained' },
        { label: 'Split text/media', value: 'split' },
      ],
    }),
  ],
}

export const MediaBlock = MediaBlockConfig
