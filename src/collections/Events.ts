import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'title', group: 'Catalogue' },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'shortDescription', type: 'textarea' },
    { name: 'content', type: 'richText' },
    {
      name: 'additionalInfo',
      type: 'array',
      label: 'Additional info sections',
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'richText' },
      ],
    },
    { name: 'mainPicture', type: 'upload', relationTo: 'media' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
    { name: 'vimeoId', type: 'text' },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },
    {
      name: 'difficulties',
      type: 'relationship',
      relationTo: 'difficulties',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },
    {
      name: 'types',
      type: 'relationship',
      relationTo: 'types',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    {
      name: 'state',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    seoFields,
  ],
}
