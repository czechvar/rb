import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Types: CollectionConfig = {
  slug: 'types',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
