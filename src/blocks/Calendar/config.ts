import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const CalendarBlockConfig: Block = {
  slug: 'calendar',
  labels: { singular: 'Calendar', plural: 'Calendars' },
  fields: [
    ...headingFields({ bodyName: 'intro' }),
    selectField('source', {
      defaultValue: 'upcoming',
      values: [
        { label: 'Upcoming dates', value: 'upcoming' },
        { label: 'Dates for one event', value: 'byEvent' },
        { label: 'Manual selection', value: 'manual' },
      ],
    }),
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      admin: { condition: (_, siblingData) => siblingData?.source === 'byEvent' },
      filterOptions: () => ({ state: { equals: 'published' } }),
    },
    {
      name: 'eventDates',
      type: 'relationship',
      relationTo: 'event-dates',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === 'manual' },
      filterOptions: () => ({ active: { equals: true } }),
    },
    { name: 'limit', type: 'number', min: 1, max: 12, defaultValue: 6 },
    selectField('variant', {
      defaultValue: 'cards',
      values: [
        { label: 'Cards', value: 'cards' },
        { label: 'Compact', value: 'compact' },
      ],
    }),
  ],
}

export const CalendarBlock = CalendarBlockConfig
