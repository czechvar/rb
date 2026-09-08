import type { Block } from 'payload'

export const DestinationLogisticsBlockConfig: Block = {
  slug: 'destinationLogistics',
  labels: { singular: 'Destination Logistics', plural: 'Destination Logistics blocks' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Logistics',
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Plan the trip',
    },
    {
      name: 'intro',
      type: 'textarea',
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'all',
      options: [
        { label: 'All logistics', value: 'all' },
        { label: 'Gear', value: 'gearGroups' },
        { label: 'Transport', value: 'transportOptions' },
        { label: 'Accommodation', value: 'accommodationOptions' },
        { label: 'Costs', value: 'costItems' },
      ],
    },
  ],
}

export const DestinationLogisticsBlock = DestinationLogisticsBlockConfig
