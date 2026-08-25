import type { Field } from 'payload'

type TextFieldOptions = {
  defaultValue?: string
  required?: boolean
}

type SelectOption = {
  label: string
  value: string
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
      textField('href'),
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
