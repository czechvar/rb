import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'

export const Guides: CollectionConfig = {
  slug: 'guides',
  labels: { singular: 'Guide', plural: 'Guides' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'People' },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'vimeoId', type: 'text' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'active', type: 'checkbox', defaultValue: false },
    seoFields,
  ],
}
