import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Payment-gateway transactions. Mirrors the `Transaction` domain type in
 * `src/payments/gateway.ts` — see that file's header for the full state
 * machine and field meanings. This collection is written to only by server
 * code via the local API with `overrideAccess: true` (see
 * `src/payments/order-payment-service.ts`); it has no public write surface.
 */
export const Transactions: CollectionConfig = {
  slug: 'transactions',
  labels: { singular: 'Transaction', plural: 'Transactions' },
  admin: {
    useAsTitle: 'uuid',
    group: 'Sales',
    defaultColumns: ['uuid', 'order', 'state', 'paymentMethod', 'amount', 'currency', 'createdAt'],
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'uuid', type: 'text', required: true, unique: true, index: true },
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, index: true },
    {
      name: 'amount',
      type: 'number',
      required: true,
      admin: { description: 'Total amount, VAT inclusive, in whole currency units (e.g. 199 for €199).' },
    },
    { name: 'amountWithoutVat', type: 'number', required: true },
    {
      name: 'currency',
      type: 'select',
      required: true,
      options: [
        { label: 'EUR', value: 'EUR' },
        { label: 'CZK', value: 'CZK' },
      ],
    },
    { name: 'label', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    {
      name: 'state',
      type: 'select',
      required: true,
      defaultValue: 'created',
      options: [
        { label: 'Created', value: 'created' },
        { label: 'Begun', value: 'begun' },
        { label: 'Pending payment', value: 'pending-payment' },
        { label: 'Paid', value: 'paid' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      options: [
        { label: 'PayPal', value: 'paypal' },
        { label: 'MuzaPay', value: 'muzapay' },
        { label: 'Comgate — card', value: 'comgate-card' },
        { label: 'Comgate — bank transfer', value: 'comgate-transfer' },
        { label: 'Bank transfer', value: 'bank-transfer' },
      ],
    },
    {
      name: 'payload',
      type: 'json',
      admin: { description: 'Gateway data captured from begin() (e.g. redirectUrl, gatewayTransactionId).' },
    },
    {
      name: 'callbackPayload',
      type: 'json',
      admin: { description: 'Raw data from the last gateway webhook/callback.' },
    },
  ],
}
