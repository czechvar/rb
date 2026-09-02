import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { revalidateOnChange } from './hooks/revalidate'
import { eventLayoutBlocks } from '../blocks'
import { TAGS } from '@/lib/cache'
import { eventTaxonomyOptions } from '@/lib/taxonomy/event'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'title', group: 'Catalogue' },
  hooks: revalidateOnChange(TAGS.events),
  fields: [
    // Identity / hero
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'shortDescription', type: 'textarea' },
    {
      name: 'catalogueCard',
      type: 'group',
      label: 'Catalogue card',
      admin: {
        description:
          'Optional title and teaser for catalogue grids. Public trip pages keep using the main title and short description.',
      },
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
    { name: 'content', type: 'richText' },
    {
      name: 'additionalInfo',
      type: 'array',
      label: 'Additional info sections',
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'richText' },
      ],
    },
    { name: 'mainPicture', type: 'upload', relationTo: 'media' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
    { name: 'vimeoId', type: 'text' },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Trip page layout',
      blocks: eventLayoutBlocks,
      admin: {
        description: 'Optional block-driven layout for this public trip page. Empty uses the current default layout.',
        initCollapsed: true,
      },
    },

    // Taxonomies
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },
    {
      name: 'difficulties',
      type: 'relationship',
      relationTo: 'difficulties',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },
    {
      name: 'programs',
      type: 'relationship',
      relationTo: 'programs',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },
    {
      name: 'climbingStyles',
      type: 'select',
      label: 'Climbing styles',
      hasMany: true,
      options: eventTaxonomyOptions.climbingStyles,
    },
    {
      name: 'audienceTags',
      type: 'select',
      label: 'Audience tags',
      hasMany: true,
      options: eventTaxonomyOptions.audienceTags,
    },
    {
      name: 'formatTags',
      type: 'select',
      label: 'Format tags',
      hasMany: true,
      options: eventTaxonomyOptions.formatTags,
    },
    {
      name: 'partnerTags',
      type: 'select',
      label: 'Partner tags',
      hasMany: true,
      options: eventTaxonomyOptions.partnerTags,
    },

    // Event-level locations (per Martin's note: "event can have more than one location")
    {
      name: 'locations',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },

    // Trip Highlights grid
    {
      name: 'highlights',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },

    // Who-This-Trip-Is-For — rider profile cards
    {
      name: 'audienceCards',
      type: 'array',
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        { name: 'highlighted', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'prerequisites',
      type: 'array',
      label: 'Climber type & prerequisites',
      fields: [{ name: 'text', type: 'text', required: true }],
    },

    // Essential Equipment grid
    { name: 'equipmentIntro', type: 'text' },
    {
      name: 'essentialEquipment',
      type: 'array',
      fields: [
        { name: 'icon', type: 'text' },
        { name: 'name', type: 'text', required: true },
        { name: 'note', type: 'text' },
        { name: 'mandatory', type: 'checkbox', defaultValue: false },
      ],
    },

    // What You Will Learn & Achieve (2-col layout)
    {
      name: 'whatYouLearn',
      type: 'group',
      fields: [
        { name: 'intro', type: 'textarea' },
        { name: 'box1Heading', type: 'text' },
        {
          name: 'box1Bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        { name: 'box2Heading', type: 'text' },
        {
          name: 'box2Bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },

    // Day-by-Day Itinerary (max 14 days per Martin's clarification)
    {
      name: 'itinerary',
      type: 'group',
      fields: [
        { name: 'intro', type: 'textarea' },
        {
          name: 'days',
          type: 'array',
          maxRows: 14,
          fields: [
            { name: 'dayBadge', type: 'text' },
            { name: 'destinationIcon', type: 'text' },
            { name: 'destinationName', type: 'text', required: true },
            { name: 'metaLine', type: 'textarea' },
            { name: 'eyebrow', type: 'text' },
            { name: 'heading', type: 'text' },
            { name: 'description', type: 'textarea' },
            {
              name: 'highlightTags',
              type: 'array',
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              name: 'schedule',
              type: 'array',
              fields: [
                { name: 'time', type: 'text', required: true },
                { name: 'activity', type: 'text', required: true },
              ],
            },
            { name: 'image', type: 'upload', relationTo: 'media' },
          ],
        },
      ],
    },

    // Accommodation & Logistics
    {
      name: 'accommodation',
      type: 'group',
      fields: [
        { name: 'description', type: 'richText' },
        {
          name: 'included',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        {
          name: 'notIncluded',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        { name: 'cuisineHighlights', type: 'richText' },
      ],
    },
    {
      name: 'transport',
      type: 'group',
      fields: [
        { name: 'description', type: 'richText' },
        {
          name: 'airports',
          type: 'relationship',
          relationTo: 'airports',
          hasMany: true,
          filterOptions: () => ({ active: { equals: true } }),
        },
      ],
    },

    // Coaches (minimal card on detail page) — relation + team-wide bullets
    { name: 'coachFramingParagraph', type: 'textarea' },
    {
      name: 'coaches',
      type: 'relationship',
      relationTo: 'guides',
      hasMany: true,
    },
    {
      name: 'coachTeamBullets',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },

    // Gear-demo / Partner block
    {
      name: 'partner',
      type: 'relationship',
      relationTo: 'partners',
      filterOptions: () => ({ active: { equals: true } }),
    },
    { name: 'partnerEyebrow', type: 'text' },
    { name: 'partnerHeadline', type: 'text' },
    { name: 'partnerDescription', type: 'textarea' },
    {
      name: 'partnerBenefits',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },

    // Demo / try-out session (Figma "DOWN DEMO Intro")
    {
      name: 'demoEnabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Show free demo block on detail page',
    },
    { name: 'demoHeading', type: 'text' },
    { name: 'demoBody', type: 'richText' },
    {
      name: 'demoCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },

    // Status / sidebar / SEO
    { name: 'featured', type: 'checkbox', defaultValue: false },
    {
      name: 'state',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    seoFields,
  ],
}
