import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'

export const Difficulties: CollectionConfig = {
  slug: 'difficulties',
  labels: { singular: 'Difficulty', plural: 'Difficulties' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  hooks: revalidateOnChange(TAGS.difficulties),
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
