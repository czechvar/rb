import type { CollectionConfig, FieldAccess } from 'payload'
import { isAdmin, isAuthenticated } from '../access'
import { isAdminOrOwner, canUpdateStateField } from './orders/access'
import { ORDER_STATES } from './orders/state-machine'
import { deriveCountsAndTotal, allocateOrderNumber, stampNotes } from './orders/hooks'

const adminOnlyField: FieldAccess = ({ req }) => req.user?.role === 'admin'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Order', plural: 'Orders' },
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Sales',
    defaultColumns: ['orderNumber', 'state', 'eventDate', 'user', 'totalPrice', 'createdAt'],
  },
  access: {
    read: isAdminOrOwner,
    create: isAuthenticated,
    update: isAdminOrOwner,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [deriveCountsAndTotal],
    beforeChange: [allocateOrderNumber, stampNotes],
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'eventDate',
      type: 'relationship',
      relationTo: 'event-dates',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'participants',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text', required: true },
      ],
    },
    {
      name: 'participantCount',
      type: 'number',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'billingAddress',
      type: 'group',
      admin: { readOnly: true },
      fields: [
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
        { name: 'street', type: 'text', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'postalCode', type: 'text', required: true },
        { name: 'country', type: 'text', required: true },
        {
          name: 'company',
          type: 'group',
          fields: [
            { name: 'companyName', type: 'text' },
            { name: 'ico', type: 'text' },
            { name: 'dic', type: 'text' },
          ],
        },
      ],
    },
    { name: 'unitPrice', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'vat', type: 'number', required: true, admin: { readOnly: true } },
    {
      name: 'currency',
      type: 'select',
      required: true,
      options: [
        { label: 'EUR', value: 'EUR' },
        { label: 'CZK', value: 'CZK' },
      ],
      admin: { readOnly: true },
    },
    { name: 'totalPrice', type: 'number', required: true, admin: { readOnly: true } },
    {
      name: 'state',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      admin: { position: 'sidebar' },
      access: { update: canUpdateStateField },
      options: ORDER_STATES.map((v) => ({ label: v[0].toUpperCase() + v.slice(1), value: v })),
    },
    {
      name: 'customerNote',
      type: 'textarea',
      admin: { description: 'Optional note from the customer at booking time.' },
    },
    {
      name: 'notes',
      type: 'array',
      access: {
        read: adminOnlyField,
        create: adminOnlyField,
        update: () => false,
      },
      admin: {
        description: 'Admin-only notes. Entries cannot be edited after save.',
      },
      fields: [
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          admin: { readOnly: true },
        },
        {
          name: 'createdAt',
          type: 'date',
          required: true,
          admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
        },
        { name: 'body', type: 'textarea', required: true },
      ],
    },
  ],
}
