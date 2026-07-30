import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { group: 'Library' },
  upload: true,
  fields: [{ name: 'alt', type: 'text', required: true }],
}
