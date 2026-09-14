import type { CollectionConfig, Field } from 'payload'
import { TAGS } from '@/lib/cache'
import { tripEditorialField } from '../fields/tripEditorial'
import { anyone, isAdmin } from '../access'
import { Events } from './Events'
import { revalidateOnChange } from './hooks/revalidate'
import { protectTripVariantIdentity } from './hooks/tripVariantIdentity'

const logisticsFields: Field[] = [
  { name: 'accommodation', type: 'richText' },
  { name: 'food', type: 'richText' },
  { name: 'included', type: 'richText' },
  { name: 'excluded', type: 'richText' },
  { name: 'note', type: 'richText' },
]

export const TripVariants: CollectionConfig = {
  slug: 'trip-variants',
  labels: { singular: 'Trip Variant', plural: 'Trip Variants' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'title', group: 'Catalogue' },
  hooks: {
    ...revalidateOnChange(TAGS.tripVariants),
    beforeChange: [protectTripVariantIdentity],
  },
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'events', required: true, index: true },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Editor-facing label for the location or itinerary represented by this variant.' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Stable public segment, unique within the parent Event. Usually based on the primary Location.',
      },
    },
    {
      name: 'slugAliases',
      type: 'array',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Previous public slugs retained for redirects.',
      },
      fields: [{ name: 'slug', type: 'text', required: true }],
    },
    {
      name: 'locations',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
    {
      name: 'indexable',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Allow this evergreen variant page into search metadata and the sitemap after content review.',
      },
    },
    { name: 'extraContent', type: 'richText' },
    tripEditorialField('variant', Events.fields),
    {
      name: 'logisticsOverrides',
      type: 'group',
      label: 'Stable logistics content',
      admin: {
        description: 'Reusable logistics for this variant. Event Date logistics remain optional occurrence overrides.',
      },
      fields: logisticsFields,
    },
  ],
}
