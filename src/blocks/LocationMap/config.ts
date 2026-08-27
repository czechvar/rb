import type { Block } from 'payload'

export const LocationMapBlockConfig: Block = {
  slug: 'locationMap',
  labels: { singular: 'Location Map', plural: 'Location Maps' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Where it is',
    },
  ],
}

export const LocationMapBlock = LocationMapBlockConfig
