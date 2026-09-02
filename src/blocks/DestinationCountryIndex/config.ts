import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const DestinationCountryIndexBlockConfig: Block = {
  slug: 'destinationCountryIndex',
  labels: {
    singular: 'Destination Country Index',
    plural: 'Destination Country Indexes',
  },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    selectField('source', {
      defaultValue: 'all',
      values: [
        { label: 'All active locations', value: 'all' },
        { label: 'Featured locations', value: 'featured' },
      ],
    }),
    selectField('variant', {
      defaultValue: 'photoCards',
      values: [
        { label: 'Photo cards', value: 'photoCards' },
        { label: 'Flag cards', value: 'flagCards' },
      ],
    }),
    {
      name: 'showJumpBar',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}

export const DestinationCountryIndexBlock = DestinationCountryIndexBlockConfig
