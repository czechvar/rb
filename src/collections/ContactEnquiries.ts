import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/** Operational visitor enquiries, deliberately excluded from content seeds. */
export const ContactEnquiries: CollectionConfig = {
  slug: 'contact-enquiries',
  access: { create: () => false, read: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    group: 'Sales',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'interest', 'status', 'notificationStatus', 'createdAt'],
  },
  timestamps: true,
  fields: [
    {
      name: 'submissionId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    { name: 'payloadDigest', type: 'text', required: true, admin: { hidden: true } },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'level', type: 'text' },
    { name: 'interest', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
    {
      name: 'preferredContact',
      type: 'select',
      required: true,
      options: ['email', 'phone', 'whatsapp'],
    },
    { name: 'phone', type: 'text' },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'contact-page',
      options: ['contact-page'],
      admin: { readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: ['new', 'handled'],
    },
    {
      name: 'notificationStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: ['pending', 'sent', 'failed', 'notConfigured'],
      admin: { readOnly: true },
    },
    { name: 'notifiedAt', type: 'date', admin: { readOnly: true } },
  ],
}
