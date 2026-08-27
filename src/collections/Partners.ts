import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Partner', plural: 'Partners' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'People' },
  hooks: revalidateOnChange(TAGS.partners),
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'link', type: 'text' },
    { name: 'description', type: 'richText' },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
