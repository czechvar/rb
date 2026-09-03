import type { Block } from 'payload'

export const DestinationCardGridBlockConfig: Block = {
  slug: 'destinationCardGrid',
  labels: { singular: 'Destination Card Grid', plural: 'Destination Card Grid blocks' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Destination',
    },
    {
      name: 'heading',
      type: 'text',
    },
    {
      name: 'intro',
      type: 'textarea',
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'audience',
      options: [
        { label: 'Audience', value: 'audience' },
        { label: 'Sectors', value: 'sectors' },
        { label: 'Rest days', value: 'restDayIdeas' },
        { label: 'Access rules', value: 'accessRules' },
        { label: 'Safety items', value: 'safetyItems' },
        { label: 'Destination FAQs', value: 'destinationFaqs' },
        { label: 'Trip promos', value: 'tripPromos' },
        { label: 'Related location records', value: 'relatedLocations' },
        { label: 'Related destination cards', value: 'relatedDestinationCards' },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      required: true,
      defaultValue: 'auto',
      options: [
        { label: 'Auto', value: 'auto' },
        { label: 'Two', value: '2' },
        { label: 'Three', value: '3' },
      ],
    },
  ],
}

export const DestinationCardGridBlock = DestinationCardGridBlockConfig
