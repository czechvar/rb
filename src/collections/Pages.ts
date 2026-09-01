import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminUser } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { revalidateOnChange } from './hooks/revalidate'
import { pageBlocks } from '../blocks'
import { TAGS } from '@/lib/cache'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  access: {
    read: ({ req }) => {
      if (isAdminUser(req.user)) return true
      return { status: { equals: 'published' } }
    },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
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
      name: 'structuredData',
      type: 'group',
      label: 'Structured data',
      admin: {
        description: 'Optional schema.org settings for this CMS page JSON-LD.',
      },
      fields: [
        {
          name: 'schemaType',
          type: 'select',
          defaultValue: 'WebPage',
          options: [
            { label: 'Web page', value: 'WebPage' },
            { label: 'About page', value: 'AboutPage' },
            { label: 'Contact page', value: 'ContactPage' },
            { label: 'Collection page', value: 'CollectionPage' },
            { label: 'FAQ page', value: 'FAQPage' },
          ],
          admin: {
            description: 'Controls the top-level page type emitted for generic CMS page JSON-LD.',
          },
        },
      ],
    },
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
