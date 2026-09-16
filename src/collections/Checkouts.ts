import type { CollectionConfig } from 'payload'
import { isAdminUser } from '../access'

export const Checkouts: CollectionConfig = {
  slug: 'checkouts',
  admin: {
    group: 'Sales',
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'state', 'customerKind', 'expiresAt', 'createdAt'],
    description: 'Open a checkout and use its Operations tab to review and manage the reservation.',
    components: {
      beforeList: [
        '/components/admin/checkouts/CheckoutOperationsQueueView#CheckoutOperationsListLink',
      ],
      views: {
        operations: {
          Component:
            '/components/admin/checkouts/CheckoutOperationsQueueView#CheckoutOperationsQueueView',
          path: '/operations',
        },
        edit: {
          operations: {
            Component: '/components/admin/checkouts/CheckoutOperationsView#CheckoutOperationsView',
            path: '/operations',
            tab: { href: '/operations', label: 'Operations', order: 200 },
          },
        },
      },
    },
  },
  access: {
    read: ({ req }) =>
      isAdminUser(req.user) ? true : req.user ? { user: { equals: req.user.id } } : false,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        if (!req.context.checkoutEngine) throw new Error('Use checkout operations.')
        return data
      },
    ],
  },
  fields: [
    { name: 'reference', type: 'text', required: true, unique: true },
    {
      name: 'submissionKey',
      type: 'text',
      required: true,
      unique: true,
      access: { read: () => false },
    },
    { name: 'requestDigest', type: 'text', required: true, access: { read: () => false } },
    {
      name: 'state',
      type: 'select',
      required: true,
      options: [
        'unverified',
        'awaitingReview',
        'approved',
        'reserved',
        'cancelled',
        'expired',
        'reconciliation',
      ],
      index: true,
    },
    { name: 'customerKind', type: 'select', required: true, options: ['new', 'returning'] },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
      ],
    },
    { name: 'items', type: 'json', required: true },
    { name: 'currency', type: 'select', required: true, options: ['EUR', 'CZK'] },
    { name: 'billingAddress', type: 'json' },
    { name: 'expiresAt', type: 'date', index: true },
    { name: 'paymentMethod', type: 'select', options: ['comgate-card', 'muzapay'] },
    { name: 'verificationHash', type: 'text', index: true, access: { read: () => false } },
    { name: 'verificationExpiresAt', type: 'date' },
    { name: 'verifiedAt', type: 'date' },
    { name: 'invitationHash', type: 'text', access: { read: () => false } },
    { name: 'invitationExpiresAt', type: 'date' },
    { name: 'invitedAt', type: 'date' },
    { name: 'approvedAt', type: 'date' },
    { name: 'reviewedBy', type: 'relationship', relationTo: 'users' },
    { name: 'reviewNote', type: 'textarea' },
    { name: 'discountCode', type: 'text' },
    { name: 'referralCode', type: 'text' },
    {
      name: 'notificationStatus',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'sent', 'failed', 'notConfigured'],
    },
    { name: 'reconciliationReason', type: 'textarea' },
  ],
}
