import type { Block } from 'payload'
import { selectField } from '../fields'

export const TripHeroBlockConfig: Block = {
  slug: 'tripHero',
  labels: { singular: 'Trip Hero', plural: 'Trip Heroes' },
  fields: [
    selectField('variant', { defaultValue: 'default', values: [{'label': 'Default', 'value': 'default'}, {'label': 'Editorial', 'value': 'editorial'}] }),
    {
      name: 'anchor',
      type: 'text',
      admin: {
        description: 'Optional section anchor for in-page links.',
      },
    },
  ],
}

export const TripHeroBlock = TripHeroBlockConfig
