import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const GalleryBlockConfig: Block = {
  slug: 'gallery',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [
    ...headingFields(),
    selectField('source', {
      defaultValue: 'manual',
      values: [
        { label: 'Manual images', value: 'manual' },
        { label: 'Current event gallery', value: 'currentEvent' },
        { label: 'Current location gallery', value: 'currentLocation' },
      ],
    }),
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.source !== 'currentEvent' && siblingData?.source !== 'currentLocation',
      },
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
