import type { Block } from 'payload'

export const ContactFormBlock: Block = {
  slug: 'contact-form',
  labels: { singular: 'Contact Form', plural: 'Contact Forms' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    { name: 'facts', type: 'array', maxRows: 6, fields: [{ name: 'text', type: 'text', required: true }] },
    { name: 'submitLabel', type: 'text', defaultValue: 'Send Message' },
    { name: 'privacyNote', type: 'textarea', admin: { description: 'Explain how enquiry details are used. Do not promise an unconfirmed response time.' } },
  ],
}
