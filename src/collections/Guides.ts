import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { guideLayoutBlocks } from '../blocks'
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'

export const Guides: CollectionConfig = {
  slug: 'guides',
  labels: { singular: 'Guide', plural: 'Guides' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'People' },
  hooks: revalidateOnChange(TAGS.guides),
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'role', type: 'text', admin: { description: 'e.g. Head coach, Pro climber, Physiotherapist' } },
    {
      name: 'tagline',
      type: 'textarea',
      admin: { description: 'Punchy one-liner shown on team cards and the profile hero.' },
    },
    {
      name: 'tags',
      type: 'array',
      admin: { description: 'Short badges, ~3 max. e.g. "Sport 9b", "Basque", "UIAGM".' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'section',
      type: 'select',
      options: [
        { label: 'Rockbusters Team', value: 'team' },
        { label: 'Friends & Ambassadors', value: 'friends' },
      ],
      defaultValue: 'team',
      required: true,
    },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText' },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Guide page layout',
      blocks: guideLayoutBlocks,
      admin: {
        description: 'Optional block-driven layout for this public guide page. Empty uses the current default layout.',
        initCollapsed: true,
      },
    },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'vimeoId', type: 'text' },
    { name: 'heroSub', type: 'textarea', admin: { description: 'Hero subtitle paragraph under the name. Falls back to tagline when empty.' } },
    { name: 'heroCaption', type: 'text', admin: { description: 'Photo credit, e.g. "Jany · Pince Sans Rire 7b+".' } },
    {
      name: 'stats',
      type: 'array',
      admin: { description: 'Stats bar under the hero, ~4 items (value "25+", label "Years Climbing & Coaching").' },
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ],
    },
    {
      name: 'about',
      type: 'group',
      admin: { description: 'About section. Bio paragraphs come from the content richtext field.' },
      fields: [
        { name: 'headline', type: 'textarea', admin: { description: 'One display line per row; wrap a line in *asterisks* to render it red.' } },
        {
          name: 'facts',
          type: 'array',
          admin: { description: 'Facts card rows. Never put email/phone here — public pages must not leak contacts.' },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'value', type: 'text', required: true },
          ],
        },
        { name: 'quote', type: 'textarea' },
        { name: 'quoteAttribution', type: 'text', admin: { description: 'e.g. "— Jany, on how he coaches"' } },
      ],
    },
    {
      name: 'coaching',
      type: 'group',
      admin: { description: '"What X coaches" numbered pillars.' },
      fields: [
        { name: 'intro', type: 'textarea' },
        {
          name: 'pillars',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'body', type: 'textarea', required: true },
          ],
        },
      ],
    },
    {
      name: 'achievements',
      type: 'group',
      admin: { description: '"On the rock" route list.' },
      fields: [
        { name: 'intro', type: 'textarea' },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'route', type: 'text', required: true },
            { name: 'location', type: 'text' },
            { name: 'grade', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'testimonial',
      type: 'group',
      admin: { description: 'Single client testimonial (always rendered with five stars).' },
      fields: [
        { name: 'quote', type: 'textarea' },
        { name: 'name', type: 'text' },
        { name: 'tripLine', type: 'text', admin: { description: 'e.g. "Rockbusters Road Trip Client"' } },
      ],
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    {
      name: 'isFounder',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Mark the founder card on the homepage.' },
    },
    { name: 'active', type: 'checkbox', defaultValue: false },
    seoFields,
  ],
}
