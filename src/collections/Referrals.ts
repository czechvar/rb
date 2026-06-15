import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Referrals: CollectionConfig = {
  slug: 'referrals',
  labels: { singular: 'Referral', plural: 'Referrals' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'code',
    group: 'Sales',
    defaultColumns: ['code', 'name', 'discountPercent', 'commissionPercent', 'active'],
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeValidate: [
          ({ value }) =>
            typeof value === 'string' ? value.trim().toUpperCase() : value,
        ],
      },
    },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    {
      name: 'discountPercent',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      admin: { description: 'Discount given to the customer using this referral (0 = commission only).' },
    },
    {
      name: 'commissionPercent',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      admin: { description: 'Commission paid to the referrer, as % of order subtotal.' },
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
  timestamps: true,
}
