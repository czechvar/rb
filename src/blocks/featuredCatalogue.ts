import type { Block, CollectionSlug, Field } from 'payload'
import { headingFields, selectField } from './fields'

type RelationshipField = Extract<Field, { type: 'relationship' }>

const variantField = selectField('variant', {
  defaultValue: 'card',
  values: [
    { label: 'Card', value: 'card' },
    { label: 'Feature', value: 'feature' },
    { label: 'Compact', value: 'compact' },
    { label: 'Media led', value: 'mediaLed' },
  ],
})

function currentContextSourceField(label: string) {
  return selectField('source', {
    defaultValue: 'manual',
    values: [
      { label: `Manual ${label}`, value: 'manual' },
      { label: 'Current page context', value: 'currentContext' },
    ],
  })
}

function manualRelationshipField({
  name,
  relationTo,
  filterOptions,
}: {
  name: string
  relationTo: CollectionSlug
  filterOptions?: RelationshipField['filterOptions']
}): RelationshipField {
  return {
    name,
    type: 'relationship',
    relationTo,
    admin: {
      condition: (_, siblingData) => siblingData?.source !== 'currentContext',
    },
    filterOptions,
  }
}

export const FeaturedTripBlockConfig: Block = {
  slug: 'featuredTrip',
  labels: { singular: 'Featured Trip', plural: 'Featured Trips' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    currentContextSourceField('trip'),
    manualRelationshipField({
      name: 'event',
      relationTo: 'events',
      filterOptions: () => ({ state: { equals: 'published' } }),
    }),
    variantField,
  ],
}

export const FeaturedProgramBlockConfig: Block = {
  slug: 'featuredProgram',
  labels: { singular: 'Featured Program', plural: 'Featured Programs' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    currentContextSourceField('program'),
    manualRelationshipField({
      name: 'program',
      relationTo: 'programs',
      filterOptions: () => ({ active: { equals: true }, state: { equals: 'published' } }),
    }),
    variantField,
  ],
}

export const FeaturedLocationBlockConfig: Block = {
  slug: 'featuredLocation',
  labels: { singular: 'Featured Location', plural: 'Featured Locations' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    currentContextSourceField('location'),
    manualRelationshipField({
      name: 'location',
      relationTo: 'locations',
      filterOptions: () => ({ active: { equals: true } }),
    }),
    variantField,
  ],
}

export const FeaturedGuideBlockConfig: Block = {
  slug: 'featuredGuide',
  labels: { singular: 'Featured Guide', plural: 'Featured Guides' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    currentContextSourceField('guide'),
    manualRelationshipField({
      name: 'guide',
      relationTo: 'guides',
      filterOptions: () => ({ active: { equals: true } }),
    }),
    variantField,
  ],
}

export const FeaturedPostBlockConfig: Block = {
  slug: 'featuredPost',
  labels: { singular: 'Featured Post', plural: 'Featured Posts' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    currentContextSourceField('post'),
    manualRelationshipField({
      name: 'post',
      relationTo: 'posts',
      filterOptions: () => ({ state: { equals: 'published' } }),
    }),
    variantField,
  ],
}

export const FeaturedEventDateBlockConfig: Block = {
  slug: 'featuredEventDate',
  labels: { singular: 'Featured Event Date', plural: 'Featured Event Dates' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    manualRelationshipField({
      name: 'eventDate',
      relationTo: 'event-dates',
      filterOptions: () => ({ active: { equals: true } }),
    }),
    variantField,
  ],
}
