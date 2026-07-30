import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Review', plural: 'Reviews' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'reviewerName', group: 'Catalogue' },
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'reviewerName', type: 'text', required: true },
    { name: 'reviewerLocation', type: 'text' },
    { name: 'resultLine', type: 'text' },
    // Same pattern as FAQs: a Review can belong to a specific Event, a Type,
    // both, or neither.
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
