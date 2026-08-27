import type { Block } from 'payload'

export const ProgramHighlightsBlockConfig: Block = {
  slug: 'programHighlights',
  labels: { singular: 'Program Highlights', plural: 'Program Highlights blocks' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Program Highlights',
    },
  ],
}

export const ProgramHighlightsBlock = ProgramHighlightsBlockConfig
