import type { CollectionConfig, FieldAccess, CollectionBeforeValidateHook } from 'payload'
import { isAdmin, isAdminUser, isAuthenticated } from '../access'
import { isAdminOrOwner, canUpdateStateField } from './orders/access'
import { ORDER_STATES } from './orders/state-machine'
import { deriveCountsAndTotal, allocateOrderNumber, stampNotes } from './orders/hooks'
import { capacityCheck } from './orders/capacity-hook'
import { validateStateTransition } from './orders/state-hook'
import { dispatchLifecycleEmails } from './orders/emails-hook'

const adminOnlyField: FieldAccess = ({ req }) => isAdminUser(req.user)

const validateOrderShape: CollectionBeforeValidateHook = ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  if (!data) return data
  const grouped = data.checkout || originalDoc?.checkout
  if (grouped && !req.context.checkoutEngine)
    throw new Error('Use checkout operations for grouped bookings.')
  if (operation === 'create' && !grouped) {
    if (!data.user || !Array.isArray(data.participants) || !data.participants.length)
      throw new Error('A customer and participants are required.')
    for (const participant of data.participants)
      if (
        !participant.firstName ||
        !participant.lastName ||
        !participant.email ||
        !participant.phone
      )
        throw new Error('Participant details are required.')
    for (const field of ['firstName', 'lastName', 'street', 'city', 'postalCode', 'country'])
      if (!data.billingAddress?.[field]) throw new Error('Billing details are required.')
  }
  return data
}

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
    beforeValidate: [validateOrderShape, deriveCountsAndTotal],
    beforeChange: [validateStateTransition, allocateOrderNumber, capacityCheck, stampNotes],
    afterChange: [dispatchLifecycleEmails],
  },
  fields: [
    {
      name: 'checkout',
      type: 'relationship',
      relationTo: 'checkouts',
      index: true,
      admin: { readOnly: true },
    },
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
      fields: [
        { name: 'firstName', type: 'text' },
        { name: 'lastName', type: 'text' },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
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
        { name: 'firstName', type: 'text' },
        { name: 'lastName', type: 'text' },
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'postalCode', type: 'text' },
        { name: 'country', type: 'text' },
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
    {
      name: 'unitPriceCzk',
      type: 'number',
      admin: {
        readOnly: true,
        description:
          'CZK price per person, snapshotted from the event date at booking time. Null when the trip has no CZK price.',
      },
    },
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
      name: 'totalPriceCzk',
      type: 'number',
      admin: {
        readOnly: true,
        description:
          'CZK order total, derived with the same discount formula as totalPrice. Used only as the Benefit+ payment amount. Null when the trip has no CZK price.',
      },
    },
    {
      name: 'discountCode',
      type: 'relationship',
      relationTo: 'discount-codes',
      admin: { readOnly: true, description: 'Discount code applied at booking time (snapshot).' },
    },
    {
      name: 'referral',
      type: 'relationship',
      relationTo: 'referrals',
      admin: {
        readOnly: true,
        description: 'Referral source captured from URL at booking time (snapshot).',
      },
    },
    {
      name: 'discountAmount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description:
          'How much the order was reduced by the applied discount, in the order currency.',
      },
    },
    {
      name: 'discountCommission',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Commission accrued for the discount-code partner, in the order currency.',
      },
    },
    {
      name: 'referralCommission',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Commission accrued for the referral partner, in the order currency.',
      },
    },
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
