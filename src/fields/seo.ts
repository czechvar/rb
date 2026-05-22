import type { Field } from 'payload'

/** Reusable SEO metadata group. */
export const seoFields: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  fields: [
    { name: 'title', type: 'text' },
    { name: 'keywords', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
}
