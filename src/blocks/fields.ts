import type { Field } from 'payload'
import { isSafeActionHref } from '@/lib/safe-url'

type TextFieldOptions = {
  defaultValue?: string
  required?: boolean
}

type SelectOption = {
  label: string
  value: string
}

const validateActionHref = (value: unknown): true | string => {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return true
  if (isSafeActionHref(value)) return true
  return 'Use an internal path starting with / or a full https:// URL.'
}

const validateGa4Name = (value: unknown): true | string => {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return true
  if (typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(value)) return true
  return 'Use a GA4-safe name: letters, numbers, and underscores, starting with a letter.'
}

export function textField(name: string, options: TextFieldOptions = {}): Field {
  return {
    name,
    type: 'text',
    ...options,
  }
}

export function textareaField(name: string, options: TextFieldOptions = {}): Field {
  return {
    name,
    type: 'textarea',
    ...options,
  }
}

export function headingFields(options: {
  headingRequired?: boolean
  headingDefault?: string
  eyebrowDefault?: string
  bodyName?: 'body' | 'intro'
} = {}): Field[] {
  const bodyName = options.bodyName ?? 'body'

  return [
    textField('eyebrow', { defaultValue: options.eyebrowDefault }),
    textField('heading', {
      defaultValue: options.headingDefault,
      required: options.headingRequired,
    }),
    textareaField(bodyName),
  ]
}

export function actionField(name: string, label?: string): Field {
  return {
    name,
    label,
    type: 'group',
    fields: [
      textField('label'),
      {
        name: 'href',
        type: 'text',
        validate: validateActionHref,
      },
      {
        name: 'analytics',
        type: 'group',
        admin: {
          description: 'Optional click tracking metadata for this action.',
        },
        fields: [
          {
            name: 'enabled',
            label: 'Track clicks',
            type: 'checkbox',
            defaultValue: true,
          },
          {
            name: 'eventName',
            label: 'Event name',
            type: 'text',
            defaultValue: 'cta_click',
            validate: validateGa4Name,
            admin: {
              description: 'Defaults to cta_click. Keep names stable once reporting depends on them.',
            },
          },
          {
            name: 'actionId',
            label: 'Action ID',
            type: 'text',
            validate: validateGa4Name,
            admin: {
              description: 'Stable reporting ID, for example homepage_hero_find_trip.',
            },
          },
          {
            name: 'location',
            type: 'select',
            options: [
              { label: 'Automatic', value: 'auto' },
              { label: 'Header', value: 'header' },
              { label: 'Hero', value: 'hero' },
              { label: 'Body CTA', value: 'body_cta' },
              { label: 'Sidebar', value: 'sidebar' },
              { label: 'Footer', value: 'footer' },
            ],
            defaultValue: 'auto',
          },
          {
            name: 'intent',
            type: 'select',
            options: [
              { label: 'Navigation', value: 'navigation' },
              { label: 'Lead', value: 'lead' },
              { label: 'Booking', value: 'booking' },
              { label: 'Contact', value: 'contact' },
              { label: 'Social', value: 'social' },
              { label: 'Download', value: 'download' },
            ],
            defaultValue: 'navigation',
          },
          textField('customLabel'),
        ],
      },
    ],
  }
}

export function mediaUploadField(name: string): Field {
  return {
    name,
    type: 'upload',
    relationTo: 'media',
  }
}

export function selectField(
  name: string,
  options: {
    defaultValue: string
    values: SelectOption[]
  },
): Field {
  return {
    name,
    type: 'select',
    defaultValue: options.defaultValue,
    required: true,
    options: options.values,
  }
}
