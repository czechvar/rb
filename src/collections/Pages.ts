import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { revalidateOnChange } from './hooks/revalidate'
import { pageBlocks } from '../blocks'
import { TAGS } from '@/lib/cache'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
  },
  hooks: revalidateOnChange(TAGS.pages),
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    {
      name: 'status',
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
    {
      name: 'layout',
      type: 'blocks',
      blocks: pageBlocks,
      minRows: 1,
      admin: {
        initCollapsed: true,
      },
    },
  ],
}
