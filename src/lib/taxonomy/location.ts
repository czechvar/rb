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

export const locationTaxonomy = {
  locationKind: {
    'sport-climbing-area': { en: 'Sport climbing area' },
    'bouldering-area': { en: 'Bouldering area' },
    'multi-pitch-area': { en: 'Multi-pitch area' },
    'mixed-climbing-area': { en: 'Mixed climbing area' },
    'alpine-climbing-area': { en: 'Alpine climbing area' },
    online: { en: 'Online' },
  },
  destinationScope: {
    crag: { en: 'Crag' },
    area: { en: 'Area' },
    region: { en: 'Region' },
    country: { en: 'Country' },
    indoor: { en: 'Indoor' },
    unknown: { en: 'Unknown' },
  },
  climbingStyles: {
    sport: { en: 'Sport climbing' },
    bouldering: { en: 'Bouldering' },
    'multi-pitch': { en: 'Multi-pitch' },
    trad: { en: 'Trad climbing' },
    'deep-water-soloing': { en: 'Deep water soloing' },
  },
  rockTypes: {
    limestone: { en: 'Limestone' },
    sandstone: { en: 'Sandstone' },
    granite: { en: 'Granite' },
    conglomerate: { en: 'Conglomerate' },
    gneiss: { en: 'Gneiss' },
    dolomite: { en: 'Dolomite' },
  },
  rockFeatures: {
    tufas: { en: 'Tufas' },
    caves: { en: 'Caves' },
    overhangs: { en: 'Overhangs' },
    slabs: { en: 'Slabs' },
    pockets: { en: 'Pockets' },
    crimps: { en: 'Crimps' },
    cracks: { en: 'Cracks' },
    roofs: { en: 'Roofs' },
  },
  settingTags: {
    coastal: { en: 'Coastal' },
    island: { en: 'Island' },
    'gorge-canyon': { en: 'Gorge or canyon' },
    forest: { en: 'Forest' },
    mountain: { en: 'Mountain' },
    valley: { en: 'Valley' },
  },
  seasons: {
    spring: { en: 'Spring' },
    summer: { en: 'Summer' },
    autumn: { en: 'Autumn' },
    winter: { en: 'Winter' },
    'year-round': { en: 'Year-round' },
  },
  accommodationTags: {
    campsite: { en: 'Campsite' },
    hotel: { en: 'Hotel' },
    'guesthouse-b-and-b': { en: 'Guesthouse / B&B' },
    apartment: { en: 'Apartment' },
    hostel: { en: 'Hostel' },
    'refuge-hut': { en: 'Refuge / hut' },
    villa: { en: 'Villa' },
    'rural-cottage': { en: 'Rural cottage' },
    luxury: { en: 'Luxury stay' },
  },
  transportTags: {
    'car-recommended': { en: 'Car recommended' },
    'public-transport-possible': { en: 'Public transport possible' },
    'flight-access': { en: 'Flight access' },
    'ferry-access': { en: 'Ferry access' },
    'walkable-local-access': { en: 'Walkable local access' },
  },
  contentCompleteness: {
    enriched: { en: 'Enriched from sources' },
    partial: { en: 'Partial source coverage' },
    'insufficient-source': { en: 'Insufficient source coverage' },
    'manual-review': { en: 'Needs manual review' },
  },
} as const satisfies Record<string, Record<string, TaxonomyLabel>>

export type LocationTaxonomyField = keyof typeof locationTaxonomy

export function getLocationTaxonomyLabel(
  field: LocationTaxonomyField,
  value: string,
  locale: Locale = 'en',
): string {
  const values: Record<string, TaxonomyLabel> = locationTaxonomy[field]
  const labels = values[value]

  return labels?.[locale] ?? labels?.en ?? value
}

function optionsFor(field: LocationTaxonomyField): SelectOption[] {
  return Object.keys(locationTaxonomy[field]).map((value) => ({
    label: getLocationTaxonomyLabel(field, value),
    value,
  }))
}

export const locationTaxonomyOptions = {
  locationKind: optionsFor('locationKind'),
  destinationScope: optionsFor('destinationScope'),
  climbingStyles: optionsFor('climbingStyles'),
  rockTypes: optionsFor('rockTypes'),
  rockFeatures: optionsFor('rockFeatures'),
  settingTags: optionsFor('settingTags'),
  bestSeasons: optionsFor('seasons'),
  avoidSeasons: optionsFor('seasons'),
  accommodationTags: optionsFor('accommodationTags'),
  transportTags: optionsFor('transportTags'),
  contentCompleteness: optionsFor('contentCompleteness'),
} satisfies Record<string, SelectOption[]>
