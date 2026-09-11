import type { Field } from 'payload'

export const tripSectionKeys = [
  'overview',
  'dates',
  'gallery',
  'audience',
  'learning',
  'itinerary',
  'comparison',
  'venue',
  'team',
  'reviews',
  'logistics',
  'package',
  'faq',
  'booking',
] as const
export const editorialContentKeys = [
  'title',
  'shortDescription',
  'content',
  'tripDetail',
  'additionalInfo',
  'audienceCards',
  'prerequisites',
  'equipmentIntro',
  'essentialEquipment',
  'whatYouLearn',
  'comparison',
  'itinerary',
  'accommodation',
  'transport',
  'coachFramingParagraph',
  'coachTeamBullets',
] as const

const text = (name: string, type: 'text' | 'textarea' = 'text'): Field =>
  type === 'textarea' ? { name, type: 'textarea' } : { name, type: 'text' }
const parts = (name: string): Field => ({
  name,
  type: 'array',
  admin: {
    description:
      'Consecutive text fragments: spaces are preserved. Accent can apply to part of a word. Break before starts a new line.',
  },
  fields: [
    { name: 'text', type: 'text', required: true },
    { name: 'accent', type: 'checkbox' },
    { name: 'breakBefore', type: 'checkbox' },
  ],
})
const facts = (name: string): Field => ({
  name,
  type: 'array',
  fields: [text('label'), text('value'), text('description', 'textarea')],
})

/** Reuse existing content fields without introducing shared database table names. */
export function tripEditorialField(scope: 'event' | 'date', sourceFields: Field[]): Field {
  const tableNames = new Set<string>()
  const tableName = (path: string[]): string => {
    // Stable across added/reordered fields, short enough for PostgreSQL FK suffixes.
    const canonical = path.join('.')
    let hash = 2166136261
    for (const char of canonical) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0
    const label = path
      .map((part) => part.replace(/([A-Z])/g, '_$1').toLowerCase())
      .join('_')
      .slice(0, 21)
    const name = `${scope}_ed_${label}_${hash.toString(16).padStart(8, '0')}`
    if (tableNames.has(name)) throw new Error('Duplicate trip editorial array table name')
    tableNames.add(name)
    return name
  }
  const clone = (field: Field, parentPath: string[] = []): Field => {
    const path = 'name' in field ? [...parentPath, field.name] : parentPath
    const copy = { ...field } as Field
    if ('dbName' in copy) delete copy.dbName
    if ('type' in copy && copy.type === 'array') copy.dbName = tableName(path)
    if ('fields' in copy)
      copy.fields = copy.fields
        .filter(
          (child) =>
            !('name' in child) ||
            ![
              'editorial.content.itinerary.days.image',
              'editorial.content.transport.airports',
            ].includes([...path, child.name].join('.')),
        )
        .map((child) => clone(child, path))
    return copy
  }
  const content = sourceFields
    .filter(
      (field) =>
        'name' in field &&
        editorialContentKeys.includes(field.name as (typeof editorialContentKeys)[number]),
    )
    .map((field) => ({ ...field, required: false }) as Field)
  const field: Field = {
    name: 'editorial',
    type: 'group',
    label: 'Trip editorial copy',
    admin: {
      description:
        'Optional copy overrides without replacing the page layout. Empty values inherit. Event Date copy applies only to that selected occurrence. Prices, capacity, guides and locations remain on their existing fields.',
    },
    fields: [
      {
        name: 'sections',
        type: 'array',
        admin: { initCollapsed: true },
        validate: (value) => {
          if (!Array.isArray(value)) return true
          const keys = value
            .map((row) => (row && typeof row === 'object' && 'key' in row ? row.key : null))
            .filter(Boolean)
          return new Set(keys).size === keys.length || 'Each section may appear only once.'
        },
        fields: [
          { name: 'key', type: 'select', required: true, options: [...tripSectionKeys] },
          text('eyebrow'),
          text('heading'),
          parts('headingParts'),
          text('intro', 'textarea'),
          {
            name: 'visibility',
            type: 'select',
            options: ['inherit', 'show', 'hide'],
            defaultValue: 'inherit',
          },
          ...['Eyebrow', 'Heading', 'Intro'].map(
            (name) =>
              ({
                name: `clear${name}`,
                type: 'checkbox',
                label: `Clear inherited ${name.toLowerCase()}`,
              }) as Field,
          ),
        ],
      },
      {
        name: 'hero',
        type: 'group',
        fields: [
          parts('titleParts'),
          text('description', 'textarea'),
          text('hashtag'),
          text('primaryLabel'),
          text('secondaryLabel'),
          { name: 'secondaryTarget', type: 'select', options: ['programme', 'dates'] },
          { name: 'clearHashtag', type: 'checkbox' },
        ],
      },
      {
        name: 'dailySchedule',
        type: 'array',
        fields: [text('time'), text('title'), text('description', 'textarea')],
      },
      facts('overviewFacts'),
      {
        name: 'venue',
        type: 'group',
        fields: [
          { name: 'paragraphs', type: 'array', fields: [text('text', 'textarea')] },
          facts('facts'),
        ],
      },
      {
        name: 'practicalCards',
        type: 'array',
        fields: [text('heading'), text('body', 'textarea')],
      },
      { name: 'packageItems', type: 'array', fields: [text('text')] },
      text('packageNote', 'textarea'),
      {
        name: 'booking',
        type: 'group',
        fields: [text('primaryLabel'), text('secondaryLabel'), text('support', 'textarea')],
      },
      { name: 'faqs', type: 'array', fields: [text('question'), text('answer', 'textarea')] },
      {
        name: 'previewReviews',
        type: 'array',
        admin: {
          description:
            'Design preview testimonials only. Renderer must visibly identify these as unverified preview content.',
        },
        fields: [text('name'), text('quote', 'textarea'), text('context')],
      },
      {
        name: 'coachProfiles',
        type: 'array',
        fields: [
          { name: 'guide', type: 'relationship', relationTo: 'guides' },
          text('role'),
          text('bio', 'textarea'),
        ],
      },
      {
        name: 'clearContentFields',
        type: 'select',
        hasMany: true,
        options: [
          ...editorialContentKeys.filter((key) => key !== 'title'),
          'tripDetail.sections',
        ].map((key) => ({ label: key, value: key })),
        admin: {
          description:
            'Explicitly clear inherited content fields for this view. This takes precedence over their supplied content.',
        },
      },
      {
        name: 'content',
        type: 'group',
        admin: {
          description:
            'Optional replacements for existing structured content. Non-empty arrays replace the inherited array; empty values inherit. Use section Hide to suppress inherited content.',
        },
        fields: content,
      },
    ],
  }
  return clone(field)
}
