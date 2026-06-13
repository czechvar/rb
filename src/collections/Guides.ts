import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'

export const Guides: CollectionConfig = {
  slug: 'guides',
  labels: { singular: 'Guide', plural: 'Guides' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'People' },
  hooks: revalidateOnChange(TAGS.guides),
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'role', type: 'text', admin: { description: 'e.g. Head coach, Pro climber, Physiotherapist' } },
    {
      name: 'section',
      type: 'select',
      options: [
        { label: 'Rockbusters Team', value: 'team' },
        { label: 'Friends & Ambassadors', value: 'friends' },
      ],
      defaultValue: 'team',
      required: true,
    },
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
