import type { Block } from 'payload'

export const ContactDetailsBlock: Block = {
  slug: 'contact-details',
  labels: { singular: 'Contact Details', plural: 'Contact Details' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'emailLabel', type: 'text', defaultValue: 'Email' },
    { name: 'email', type: 'email', required: true },
    { name: 'emailNote', type: 'textarea' },
    { name: 'phoneLabel', type: 'text', defaultValue: 'Phone & WhatsApp' },
    {
      name: 'desks', type: 'array', minRows: 1, maxRows: 10,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'phone', type: 'text', required: true, admin: { description: 'Public international number, including country code.' } },
        { name: 'whatsapp', type: 'checkbox', defaultValue: true },
      ],
    },
  ],
}
