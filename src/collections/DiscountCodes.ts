import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const DiscountCodes: CollectionConfig = {
  slug: 'discount-codes',
  labels: { singular: 'Discount Code', plural: 'Discount Codes' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'code',
    group: 'Sales',
    defaultColumns: ['code', 'title', 'discountPercent', 'validFrom', 'validUntil', 'active'],
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
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'discountPercent',
      type: 'number',
      required: true,
      min: 1,
      max: 99,
      admin: { description: 'Whole-number percent (1–99).' },
    },
    { name: 'validFrom', type: 'date', required: true },
    { name: 'validUntil', type: 'date', required: true },
    { name: 'commissionEmail', type: 'email' },
    {
      name: 'commissionPercent',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 0,
      admin: { description: 'Commission paid out per redemption, as % of order subtotal.' },
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data?.validFrom || !data?.validUntil) return data
        if (new Date(data.validUntil as string) <= new Date(data.validFrom as string)) {
          throw new Error('validUntil must be later than validFrom.')
        }
        return data
      },
    ],
  },
  timestamps: true,
}
