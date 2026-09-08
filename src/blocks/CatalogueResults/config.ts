import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const catalogueFacetValues = [
  { label: 'Type (category)', value: 'category' },
  { label: 'Difficulty', value: 'difficulty' },
  { label: 'Destination', value: 'location' },
  { label: 'Month', value: 'month' },
  { label: 'Guide', value: 'guide' },
]

export const CatalogueResultsBlockConfig: Block = {
  slug: 'catalogueResults',
  labels: { singular: 'Catalogue Results', plural: 'Catalogue Results' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    {
      name: 'enabledFacets',
      label: 'Visible filters',
      type: 'select',
      hasMany: true,
      defaultValue: catalogueFacetValues.map((facet) => facet.value),
      options: catalogueFacetValues,
      admin: {
        description: 'Type uses the trip category taxonomy. Filters without matching trips are hidden automatically.',
      },
    },
    selectField('defaultSort', {
      defaultValue: 'date',
      values: [
        { label: 'Soonest date', value: 'date' },
        { label: 'Lowest price', value: 'priceAsc' },
        { label: 'Highest price', value: 'priceDesc' },
        { label: 'Trip name', value: 'title' },
      ],
    }),
    { name: 'resultLimit', label: 'Results per page', type: 'number', min: 1, max: 48, defaultValue: 12 },
    selectField('paginationMode', {
      defaultValue: 'showMore',
      values: [
        { label: 'Show more', value: 'showMore' },
        { label: 'Show all', value: 'all' },
      ],
    }),
    selectField('presentation', {
      defaultValue: 'calendar',
      values: [
        { label: 'Calendar cards', value: 'calendar' },
        { label: 'Compact list', value: 'compact' },
      ],
    }),
    {
      name: 'stickyFilters',
      label: 'Keep filters visible while scrolling',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}

export const CatalogueResultsBlock = CatalogueResultsBlockConfig
