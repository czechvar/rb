import type { Field } from 'payload'

/** Lowercase, hyphenated, alphanumeric-only slug. */
export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * A required, unique slug field. Auto-fills from `source` when left blank.
 * @param source name of the field to derive the slug from (default: 'title')
 */
export const slugField = (source = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: { position: 'sidebar' },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (value) return value
        const src = data?.[source]
        return src ? slugify(String(src)) : value
      },
    ],
  },
})
