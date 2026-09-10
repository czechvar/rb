import type { Block } from 'payload'
import { selectField } from './fields'

export const TripContentBlockConfig: Block = {
  slug: 'tripContent',
  labels: { singular: 'Trip Content Section', plural: 'Trip Content Sections' },
  fields: [
    selectField('section', { defaultValue: 'overview', values: [
      'overview', 'learning', 'itinerary', 'requirements', 'equipment', 'audience', 'highlights', 'notes', 'remaining',
    ].map(value => ({ label: value === 'remaining' ? 'Additional trip information' : value, value })) }),
    selectField('variant', { defaultValue: 'prose', values: [
      { label: 'Prose', value: 'prose' }, { label: 'Cards', value: 'cards' },
      { label: 'Timeline', value: 'timeline' }, { label: 'Overview with facts', value: 'overview' },
    ] }),
  ],
}

export const TripFactsBlockConfig: Block = {
  slug: 'tripFacts', labels: { singular: 'Trip Facts', plural: 'Trip Facts' },
  fields: [selectField('variant', { defaultValue: 'heroBar', values: [
    { label: 'Hero bar', value: 'heroBar' }, { label: 'Grid', value: 'grid' },
  ] })],
}
export const TripVenueBlockConfig: Block = {
  slug: 'tripVenue', labels: { singular: 'Trip Venues', plural: 'Trip Venues' },
  fields: [selectField('variant', { defaultValue: 'default', values: [
    { label: 'Default', value: 'default' }, { label: 'Editorial', value: 'editorial' },
  ] })],
}
export const TripTeamBlockConfig: Block = {
  slug: 'tripTeam', labels: { singular: 'Trip Team', plural: 'Trip Teams' },
  fields: [selectField('variant', { defaultValue: 'default', values: [
    { label: 'Default', value: 'default' }, { label: 'Cards', value: 'cards' },
  ] })],
}
