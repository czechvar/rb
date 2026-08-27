import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { programLayoutBlocks } from '../blocks'
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'

export const Programs: CollectionConfig = {
  slug: 'programs',
  labels: { singular: 'Program', plural: 'Programs' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  hooks: revalidateOnChange(TAGS.programs),
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),

    // Hero / overview
    { name: 'shortDescription', type: 'textarea' },
    { name: 'content', type: 'richText' },
    { name: 'mainPicture', type: 'upload', relationTo: 'media' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
    { name: 'vimeoId', type: 'text' },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Program page layout',
      blocks: programLayoutBlocks,
      admin: {
        description: 'Optional block-driven layout for this public program page. Empty uses the current default layout.',
        initCollapsed: true,
      },
    },

    // Trip Highlights grid
    {
      name: 'highlights',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },

    // Who-This-Camp-Is-For — 3-card grid (skill / goals / mindset)
    {
      name: 'audienceCards',
      type: 'array',
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        { name: 'highlighted', type: 'checkbox', defaultValue: false },
      ],
    },
    { name: 'soloNote', type: 'text' },
    { name: 'redirectCallout', type: 'richText' },

    // What You'll Work On — curriculum pillars (3-pillar grid)
    {
      name: 'curriculumPillars',
      type: 'array',
      fields: [
        { name: 'icon', type: 'text' },
        { name: 'title', type: 'text', required: true },
        {
          name: 'bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },

    // Program & Daily Flow — "performance lab" framing + mix-and-match + focus tracks
    {
      name: 'flow',
      type: 'group',
      fields: [
        { name: 'framingParagraph', type: 'textarea' },
        {
          name: 'mixAndMatchBlocks',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'tagline', type: 'textarea' },
            {
              name: 'bullets',
              type: 'array',
              fields: [{ name: 'text', type: 'text', required: true }],
            },
          ],
        },
        {
          name: 'tailoredToYou',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        {
          name: 'focusTracks',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            {
              name: 'colorTag',
              type: 'select',
              options: [
                { label: 'Red', value: 'red' },
                { label: 'Blue', value: 'blue' },
                { label: 'Green', value: 'green' },
              ],
            },
            {
              name: 'bullets',
              type: 'array',
              fields: [{ name: 'text', type: 'text', required: true }],
            },
          ],
        },
      ],
    },

    // One Week or Two — variant comparison
    {
      name: 'weekVariants',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
    { name: 'weekRecommendation', type: 'textarea' },

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
          name: 'foodBeverages',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        {
          name: 'notIncluded',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
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

    // Coaches (rich card on category page — relation; framing paragraph for the intro)
    { name: 'coachFramingParagraph', type: 'textarea' },
    {
      name: 'coaches',
      type: 'relationship',
      relationTo: 'guides',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },

    // Results You Can Expect — outcome cards grid
    {
      name: 'results',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },

    // Status / sidebar / SEO
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'active', type: 'checkbox', defaultValue: false },
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
