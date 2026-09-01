import type { CollectionConfig, FieldAccess, Validate } from 'payload'
import { anyone, isAdmin, isAdminOrSelf, isAdminUser } from '../access'
import { verifyEmailTemplate, resetPasswordTemplate } from '../lib/email/templates'

// Field-level access wrapper: admins only. The `Access` (collection-level)
// signature isn't structurally assignable to `FieldAccess`, so we mirror the
// rule here against `req.user.role`.
const isAdminField: FieldAccess = ({ req }) => isAdminUser(req.user)

const phoneRegex = /^\+?[\d\s\-()]{6,20}$/
const icoRegex = /^\d{8}$/
const dicRegex = /^CZ\d{8,10}$/

const validatePhone: Validate<string | null | undefined, unknown, unknown, object> = (value) => {
  if (!value) return 'Phone is required'
  if (!phoneRegex.test(String(value))) return 'Invalid phone number'
  return true
}

const validateIco: Validate<string | null | undefined, unknown, unknown, object> = (value) => {
  if (!value) return true
  if (!icoRegex.test(String(value))) return 'IČO must be 8 digits'
  return true
}

const validateDic: Validate<string | null | undefined, unknown, unknown, object> = (value) => {
  if (!value) return true
  if (!dicRegex.test(String(value))) return 'DIČ must be in the form CZ followed by 8–10 digits'
  return true
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    verify: {
      generateEmailSubject: () => 'Welcome to Rockbusters — please verify your email',
      generateEmailHTML: ({ token, user }) =>
        verifyEmailTemplate({
          token: String(token),
          name:
            typeof (user as { name?: string }).name === 'string'
              ? (user as { name: string }).name
              : 'there',
        }),
    },
    forgotPassword: {
      generateEmailSubject: () => 'Reset your Rockbusters password',
      generateEmailHTML: (args) =>
        resetPasswordTemplate({
          token: String(args?.token ?? ''),
          name:
            typeof (args?.user as { name?: string } | undefined)?.name === 'string'
              ? (args!.user as { name: string }).name
              : 'there',
        }),
    },
    maxLoginAttempts: 5,
    lockTime: 600 * 1000,
    tokenExpiration: 60 * 60 * 24 * 30,
  },
  admin: { useAsTitle: 'email', group: 'Admin' },
  access: {
    read: isAdminOrSelf,
    create: anyone,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true, validate: validatePhone },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'customer',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Admin', value: 'admin' },
      ],
      access: { update: isAdminField },
    },
    {
      name: 'addresses',
      type: 'array',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'isDefault', type: 'checkbox', defaultValue: false },
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
            { name: 'ico', type: 'text', validate: validateIco },
            { name: 'dic', type: 'text', validate: validateDic },
          ],
        },
      ],
    },
    {
      name: 'pendingEmail',
      type: 'text',
      admin: { hidden: true },
      access: { read: isAdminField, update: isAdminField },
    },
    {
      name: 'pendingEmailToken',
      type: 'text',
      admin: { hidden: true },
      access: { read: isAdminField, update: isAdminField },
    },
    {
      name: 'pendingEmailExpiresAt',
      type: 'date',
      admin: { hidden: true },
      access: { read: isAdminField, update: isAdminField },
    },
    {
      name: 'lastVerifyEmailSentAt',
      type: 'date',
      admin: { hidden: true },
      access: { read: isAdminField, update: isAdminField },
    },
  ],
}
