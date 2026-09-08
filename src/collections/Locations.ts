import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { locationLayoutBlocks } from '../blocks'
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'
import { locationTaxonomyOptions } from '@/lib/taxonomy/location'

const structuredSourceStatusOptions = [
  { label: 'Curated seed', value: 'curated' },
  { label: 'Curated-derived', value: 'curated-derived' },
  { label: 'Design-derived', value: 'design-derived' },
  { label: 'Mixed', value: 'mixed' },
]

const destinationToneOptions = [
  { label: 'Neutral', value: 'neutral' },
  { label: 'Positive', value: 'positive' },
  { label: 'Strong', value: 'strong' },
  { label: 'Limited', value: 'limited' },
  { label: 'Warning', value: 'warning' },
  { label: 'Critical', value: 'critical' },
  { label: 'Peak', value: 'peak' },
  { label: 'Good', value: 'good' },
  { label: 'Avoid', value: 'avoid' },
]

const sourceStatusField = {
  name: 'sourceStatus',
  type: 'select' as const,
  dbName: 'loc_dest_src_status',
  options: structuredSourceStatusOptions,
}

const needsVerificationField = {
  name: 'needsVerification',
  type: 'checkbox' as const,
  dbName: 'needs_verify',
  defaultValue: false,
}

const simpleActionFields = [
  { name: 'label', type: 'text' as const },
  { name: 'href', type: 'text' as const },
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
      name: 'destinationDetail',
      type: 'group',
      label: 'Destination detail structured content',
      admin: {
        description:
          'Structured content for the default destination detail renderer. Canonical location facts remain on the parent Location record.',
      },
      fields: [
        {
          name: 'hero',
          type: 'group',
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'heading', type: 'text' },
            { name: 'accentWord', type: 'text' },
            { name: 'body', type: 'textarea' },
            {
              name: 'primaryAction',
              type: 'group',
              fields: simpleActionFields,
            },
            {
              name: 'heroStats',
              type: 'array',
              dbName: 'loc_dest_hero_stats',
              fields: [
                { name: 'value', type: 'text', required: true },
                { name: 'label', type: 'text', required: true },
                { name: 'derivedFrom', type: 'text' },
                { name: 'format', type: 'text' },
                { name: 'note', type: 'textarea' },
                sourceStatusField,
              ],
            },
          ],
        },
        {
          name: 'sections',
          type: 'array',
          dbName: 'loc_dest_sections',
          fields: [
            { name: 'key', type: 'text', required: true },
            { name: 'navLabel', type: 'text' },
            { name: 'heading', type: 'text', required: true },
            { name: 'body', type: 'textarea' },
            { name: 'keyCharacteristics', type: 'text', hasMany: true },
            sourceStatusField,
          ],
        },
        {
          name: 'audience',
          type: 'array',
          dbName: 'loc_dest_audience',
          label: 'Audience suitability cards',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'gradeRange', type: 'text' },
            { name: 'body', type: 'textarea' },
            { name: 'badge', type: 'text' },
            { name: 'tone', type: 'select', options: destinationToneOptions },
            sourceStatusField,
            needsVerificationField,
          ],
        },
        {
          name: 'sectors',
          type: 'array',
          dbName: 'loc_dest_sectors',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'badges', type: 'text', hasMany: true },
            { name: 'gradeRange', type: 'text' },
            { name: 'body', type: 'textarea' },
            sourceStatusField,
            needsVerificationField,
          ],
        },
        {
          name: 'seasonMonths',
          type: 'array',
          dbName: 'loc_dest_season_months',
          fields: [
            { name: 'month', type: 'number', min: 1, max: 12, required: true },
            { name: 'label', type: 'text', required: true },
            { name: 'score', type: 'number', min: 0, max: 5, required: true },
            { name: 'temperature', type: 'text' },
            { name: 'conditions', type: 'text' },
            { name: 'tone', type: 'select', options: destinationToneOptions },
            { name: 'notes', type: 'textarea' },
            sourceStatusField,
          ],
        },
        {
          name: 'gearGroups',
          type: 'array',
          dbName: 'loc_dest_gear_groups',
          fields: [
            { name: 'heading', type: 'text', required: true },
            { name: 'items', type: 'text', hasMany: true },
            sourceStatusField,
            needsVerificationField,
          ],
        },
        {
          name: 'transportOptions',
          type: 'array',
          dbName: 'loc_dest_transport_opts',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'type', type: 'text' },
            { name: 'duration', type: 'text' },
            { name: 'body', type: 'textarea' },
            { name: 'recommended', type: 'checkbox', defaultValue: false },
            sourceStatusField,
            needsVerificationField,
          ],
        },
        {
          name: 'accommodationOptions',
          type: 'array',
          dbName: 'loc_dest_accom_opts',
          fields: [
            { name: 'type', type: 'text' },
            { name: 'name', type: 'text', required: true },
            { name: 'body', type: 'textarea' },
            { name: 'href', type: 'text' },
            { name: 'actionLabel', type: 'text' },
            { name: 'priceHint', type: 'text' },
            sourceStatusField,
            needsVerificationField,
          ],
        },
        {
          name: 'restDayIdeas',
          type: 'array',
          dbName: 'loc_dest_rest_days',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'body', type: 'textarea' },
            { name: 'distance', type: 'text' },
            sourceStatusField,
            needsVerificationField,
          ],
        },
        {
          name: 'accessRules',
          type: 'array',
          dbName: 'loc_dest_access_rules',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'body', type: 'textarea' },
            { name: 'tone', type: 'select', options: destinationToneOptions },
            sourceStatusField,
            needsVerificationField,
          ],
        },
        {
          name: 'safetyItems',
          type: 'array',
          dbName: 'loc_dest_safety_items',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'value', type: 'text' },
            { name: 'body', type: 'textarea' },
            sourceStatusField,
            needsVerificationField,
          ],
        },
        {
          name: 'costItems',
          type: 'array',
          dbName: 'loc_dest_cost_items',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'unit', type: 'text' },
            { name: 'budget', type: 'text' },
            { name: 'midRange', type: 'text' },
            sourceStatusField,
            needsVerificationField,
          ],
        },
        {
          name: 'destinationFaqs',
          type: 'array',
          dbName: 'loc_dest_faqs',
          fields: [
            { name: 'question', type: 'text', required: true },
            { name: 'answer', type: 'textarea', required: true },
            sourceStatusField,
            needsVerificationField,
          ],
        },
        {
          name: 'tripPromos',
          type: 'array',
          dbName: 'loc_dest_trip_promos',
          fields: [
            { name: 'type', type: 'text' },
            { name: 'title', type: 'text', required: true },
            { name: 'body', type: 'textarea' },
            {
              name: 'action',
              type: 'group',
              fields: simpleActionFields,
            },
            sourceStatusField,
            needsVerificationField,
          ],
        },
        {
          name: 'relatedLocations',
          type: 'relationship',
          relationTo: 'locations',
          hasMany: true,
          filterOptions: () => ({ active: { equals: true } }),
        },
        {
          name: 'relatedDestinationCards',
          type: 'array',
          dbName: 'loc_dest_related_cards',
          admin: {
            description:
              'Fallback display cards for related destinations when matching Location records are not available yet.',
          },
          fields: [
            { name: 'slug', type: 'text' },
            { name: 'name', type: 'text', required: true },
            { name: 'country', type: 'text' },
            { name: 'region', type: 'text' },
            { name: 'summary', type: 'text' },
            sourceStatusField,
            needsVerificationField,
          ],
        },
        {
          name: 'cta',
          type: 'group',
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'heading', type: 'text' },
            { name: 'body', type: 'textarea' },
            {
              name: 'primaryAction',
              type: 'group',
              fields: simpleActionFields,
            },
            {
              name: 'secondaryAction',
              type: 'group',
              fields: simpleActionFields,
            },
            sourceStatusField,
          ],
        },
      ],
    },
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
