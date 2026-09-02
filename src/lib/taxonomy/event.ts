type Locale = 'en' | 'cs' | 'de'

type TaxonomyLabel = {
  en: string
  cs?: string
  de?: string
}

type SelectOption = {
  label: string
  value: string
}

export const eventTaxonomy = {
  climbingStyles: {
    sport: { en: 'Sport climbing' },
    bouldering: { en: 'Bouldering' },
    trad: { en: 'Trad climbing' },
    'multi-pitch': { en: 'Multi-pitch' },
    'deep-water-soloing': { en: 'Deep water soloing' },
  },
  audienceTags: {
    'beginner-friendly': { en: 'Beginner friendly' },
    'kids-friendly': { en: 'Kids friendly' },
    'women-only': { en: 'Women only' },
    intermediate: { en: 'Intermediate' },
    advanced: { en: 'Advanced' },
    expert: { en: 'Expert' },
  },
  formatTags: {
    'private-guiding': { en: 'Private guiding' },
    coaching: { en: 'Coaching' },
    'learn-to-lead': { en: 'Learn to lead' },
    'road-trip': { en: 'Road trip' },
    'demo-test': { en: 'Demo / test' },
    'family-youth': { en: 'Family / youth' },
  },
  partnerTags: {
    evolv: { en: 'Evolv' },
    'singing-rock': { en: 'Singing Rock' },
    'the-send': { en: 'The Send' },
  },
} as const satisfies Record<string, Record<string, TaxonomyLabel>>

export type EventTaxonomyField = keyof typeof eventTaxonomy

export function getEventTaxonomyLabel(
  field: EventTaxonomyField,
  value: string,
  locale: Locale = 'en',
): string {
  const values: Record<string, TaxonomyLabel> = eventTaxonomy[field]
  const labels = values[value]

  return labels?.[locale] ?? labels?.en ?? value
}

function optionsFor(field: EventTaxonomyField): SelectOption[] {
  return Object.keys(eventTaxonomy[field]).map((value) => ({
    label: getEventTaxonomyLabel(field, value),
    value,
  }))
}

export const eventTaxonomyOptions = {
  climbingStyles: optionsFor('climbingStyles'),
  audienceTags: optionsFor('audienceTags'),
  formatTags: optionsFor('formatTags'),
  partnerTags: optionsFor('partnerTags'),
}
