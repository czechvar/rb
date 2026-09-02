import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { locationLayoutBlocks } from '../blocks'
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'
import { locationTaxonomyOptions } from '@/lib/taxonomy/location'

const sectionStatusOptions = [
  { label: 'Enriched from sources', value: 'enriched' },
  { label: 'Mixed legacy and sources', value: 'mixed' },
  { label: 'Legacy only', value: 'legacy' },
  { label: 'Missing', value: 'missing' },
  { label: 'Not applicable', value: 'not-applicable' },
]

export const Locations: CollectionConfig = {
  slug: 'locations',
  labels: { singular: 'Location', plural: 'Locations' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  hooks: revalidateOnChange(TAGS.locations),
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'content', type: 'richText' },
    { name: 'address', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'country', type: 'text' },
    { name: 'coordinates', type: 'point', label: 'Coordinates [lng, lat]' },
    {
      name: 'locationKind',
      type: 'select',
      label: 'Location kind',
      options: locationTaxonomyOptions.locationKind,
      admin: {
        description: 'Primary editor-facing classification, stored as a canonical ID.',
      },
    },
    {
      name: 'destinationScope',
      type: 'select',
      label: 'Destination scope',
      options: locationTaxonomyOptions.destinationScope,
      admin: {
        description:
          'Scale of the public destination page: crag, area, region, country, indoor, or unknown.',
      },
    },
    {
      name: 'contentCompleteness',
      type: 'select',
      label: 'Content completeness',
      options: locationTaxonomyOptions.contentCompleteness,
      admin: {
        description: 'Editorial status for imported or manually reviewed destination content.',
      },
    },
    {
      name: 'climbingStyles',
      type: 'select',
      label: 'Climbing styles',
      hasMany: true,
      options: locationTaxonomyOptions.climbingStyles,
    },
    {
      name: 'rockTypes',
      type: 'select',
      label: 'Rock types',
      hasMany: true,
      options: locationTaxonomyOptions.rockTypes,
    },
    {
      name: 'rockFeatures',
      type: 'select',
      label: 'Rock features',
      hasMany: true,
      options: locationTaxonomyOptions.rockFeatures,
    },
    {
      name: 'settingTags',
      type: 'select',
      label: 'Setting tags',
      hasMany: true,
      options: locationTaxonomyOptions.settingTags,
    },
    {
      name: 'bestSeasons',
      type: 'select',
      label: 'Best seasons',
      hasMany: true,
      options: locationTaxonomyOptions.bestSeasons,
    },
    {
      name: 'avoidSeasons',
      type: 'select',
      label: 'Avoid seasons',
      hasMany: true,
      options: locationTaxonomyOptions.avoidSeasons,
    },
    {
      name: 'accommodationTags',
      type: 'select',
      label: 'Accommodation tags',
      hasMany: true,
      options: locationTaxonomyOptions.accommodationTags,
    },
    {
      name: 'transportTags',
      type: 'select',
      label: 'Transport tags',
      hasMany: true,
      options: locationTaxonomyOptions.transportTags,
    },
    {
      name: 'nearestAirports',
      type: 'array',
      label: 'Nearest airports',
      admin: {
        description:
          'Normalized airport city labels retained from mined source material for editorial traceability.',
        initCollapsed: true,
      },
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      name: 'airportRefs',
      type: 'relationship',
      relationTo: 'airports',
      hasMany: true,
      label: 'Airport references',
      filterOptions: () => ({ active: { equals: true } }),
      admin: {
        description: 'Canonical airport relations resolved from nearest-airport labels where possible.',
      },
    },
    { name: 'gradeRange', type: 'text', label: 'Grade range' },
    { name: 'routeCount', type: 'number', label: 'Route count' },
    { name: 'problemCount', type: 'number', label: 'Problem count' },
    { name: 'sectorCount', type: 'number', label: 'Sector count' },
    { name: 'seasonSummary', type: 'textarea', label: 'Season summary' },
    { name: 'transportSummary', type: 'textarea', label: 'Transport summary' },
    { name: 'accommodationSummary', type: 'textarea', label: 'Accommodation summary' },
    {
      name: 'contentSections',
      type: 'array',
      label: 'Mined content sections',
      admin: {
        description:
          'Structured destination content extracted from legacy data and research. Missing sections are kept for editorial traceability.',
        initCollapsed: true,
      },
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'heading', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: sectionStatusOptions,
        },
        { name: 'body', type: 'textarea' },
        { name: 'sourceRefs', type: 'json', label: 'Source refs' },
        { name: 'warnings', type: 'json' },
      ],
    },
    {
      name: 'sourceReferences',
      type: 'array',
      label: 'Source references',
      admin: {
        description: 'Traceability for mined or enriched destination facts.',
        initCollapsed: true,
      },
      fields: [
        { name: 'sourceId', type: 'text', label: 'Source ID' },
        { name: 'title', type: 'text' },
        { name: 'url', type: 'text' },
        { name: 'publisher', type: 'text' },
        { name: 'accessedAt', type: 'date', label: 'Accessed at' },
        { name: 'notes', type: 'textarea' },
      ],
    },
    { name: 'mainPicture', type: 'upload', relationTo: 'media' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Location page layout',
      blocks: locationLayoutBlocks,
      admin: {
        description:
          'Optional block-driven layout for this public destination page. Empty uses the current default layout.',
        initCollapsed: true,
      },
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'active', type: 'checkbox', defaultValue: false },
    seoFields,
  ],
}
