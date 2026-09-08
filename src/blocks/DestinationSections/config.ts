import type { Block } from 'payload'

export const DestinationSectionsBlockConfig: Block = {
  slug: 'destinationSections',
  labels: { singular: 'Destination Sections', plural: 'Destination Sections blocks' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Overview',
    },
    {
      name: 'heading',
      type: 'text',
      admin: {
        description: 'Optional override. Empty uses the first rendered section heading.',
      },
    },
    {
      name: 'sectionKeys',
      label: 'Section keys',
      type: 'array',
      admin: {
        description: 'Optional filter. Empty renders all destinationDetail.sections.',
      },
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}

export const DestinationSectionsBlock = DestinationSectionsBlockConfig
