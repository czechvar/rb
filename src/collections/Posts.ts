import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'
import { postLayoutBlocks } from '@/blocks'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Post', plural: 'Posts' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'title', group: 'Content', defaultColumns: ['title', 'state', 'publishedAt'] },
  hooks: revalidateOnChange(TAGS.posts),
  defaultSort: '-publishedAt',
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'excerpt', type: 'textarea' },
    { name: 'content', type: 'richText' },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Post page layout',
      blocks: postLayoutBlocks,
      admin: {
        description: 'Optional block-driven layout for this public blog post. Empty uses the current default layout.',
        initCollapsed: true,
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'post-categories',
    },
    { name: 'author', type: 'text', defaultValue: 'Rockbusters' },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
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
