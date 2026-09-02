import type { Block } from 'payload'
import { selectField, textField } from '../fields'

export const SectionIntroBlockConfig: Block = {
  slug: 'section-intro',
  labels: { singular: 'Section Intro', plural: 'Section Intros' },
  fields: [
    textField('eyebrow'),
    textField('heading', { required: true }),
    { name: 'body', type: 'richText' },
    selectField('alignment', {
      defaultValue: 'left',
      values: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
      ],
    }),
    selectField('variant', {
      defaultValue: 'light',
      values: [
        { label: 'Light', value: 'light' },
        { label: 'Dark split', value: 'darkSplit' },
      ],
    }),
  ],
}

export const SectionIntroBlock = SectionIntroBlockConfig
