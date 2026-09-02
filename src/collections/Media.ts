import type { CollectionConfig } from 'payload'
import { randomUUID } from 'node:crypto'
import { anyone, isAdmin } from '../access'
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'

export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { group: 'Library' },
  hooks: revalidateOnChange(TAGS.media),
  upload: true,
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
      unique: true,
      defaultValue: () => `med_${randomUUID().replaceAll('-', '')}`,
      admin: {
        hidden: true,
      },
    },
    { name: 'alt', type: 'text', required: true },
  ],
}
