import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Category', plural: 'Categories' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'text', type: 'textarea' },
    { name: 'position', type: 'number', defaultValue: 0 },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
