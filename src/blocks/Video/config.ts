import type { Block } from 'payload'
import { headingFields, selectField, textareaField, textField } from '../fields'

export const VideoBlockConfig: Block = {
  slug: 'video',
  labels: { singular: 'Video', plural: 'Video blocks' },
  fields: [
    ...headingFields(),
    textField('videoUrl', { required: true }),
    textareaField('caption'),
    selectField('variant', {
      defaultValue: 'wide',
      values: [
        { label: 'Wide', value: 'wide' },
        { label: 'Contained', value: 'contained' },
      ],
    }),
  ],
}

export const VideoBlock = VideoBlockConfig
