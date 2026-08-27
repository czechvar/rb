import type { Block } from 'payload'

export const TripHeroBlockConfig: Block = {
  slug: 'tripHero',
  labels: { singular: 'Trip Hero', plural: 'Trip Heroes' },
  fields: [
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
