import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'question', group: 'Catalogue' },
  hooks: revalidateOnChange(TAGS.faqs),
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'richText', required: true },
    // An FAQ may be tied to a specific Event, a Type (category-level FAQ),
    // both, or neither (global library). All relations are optional.
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
    },
    {
      name: 'program',
      type: 'relationship',
      relationTo: 'programs',
      filterOptions: () => ({ active: { equals: true } }),
    },
    { name: 'position', type: 'number', defaultValue: 0 },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
