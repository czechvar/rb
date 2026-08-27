import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const SectionIntroBlockConfig: Block = {
  slug: 'section-intro',
  labels: { singular: 'Section Intro', plural: 'Section Intros' },
  fields: [
    ...headingFields({ headingRequired: true }),
    selectField('alignment', {
      defaultValue: 'left',
      values: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
      ],
    }),
  ],
}

export const SectionIntroBlock = SectionIntroBlockConfig
