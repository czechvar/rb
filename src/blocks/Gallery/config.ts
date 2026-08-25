import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const GalleryBlockConfig: Block = {
  slug: 'gallery',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [
    ...headingFields(),
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
    },
    selectField('variant', {
      defaultValue: 'grid',
      values: [
        { label: 'Grid', value: 'grid' },
        { label: 'Masonry', value: 'masonry' },
      ],
    }),
  ],
}

export const GalleryBlock = GalleryBlockConfig
