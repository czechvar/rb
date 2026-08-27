import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { locationLayoutBlocks } from '../blocks'
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'

export const Locations: CollectionConfig = {
  slug: 'locations',
  labels: { singular: 'Location', plural: 'Locations' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  hooks: revalidateOnChange(TAGS.locations),
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'content', type: 'richText' },
    { name: 'address', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'country', type: 'text' },
    { name: 'coordinates', type: 'point', label: 'Coordinates [lng, lat]' },
    { name: 'mainPicture', type: 'upload', relationTo: 'media' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Location page layout',
      blocks: locationLayoutBlocks,
      admin: {
        description: 'Optional block-driven layout for this public destination page. Empty uses the current default layout.',
        initCollapsed: true,
      },
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'active', type: 'checkbox', defaultValue: false },
    seoFields,
  ],
}
