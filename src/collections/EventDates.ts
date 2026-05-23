import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const EventDates: CollectionConfig = {
  slug: 'event-dates',
  labels: { singular: 'Event Date', plural: 'Event Dates' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'dateFrom', group: 'Catalogue' },
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'events', required: true },
    { name: 'dateFrom', type: 'date', required: true },
    { name: 'dateTo', type: 'date', required: true },
    {
      name: 'locations',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },
    {
      name: 'guides',
      type: 'relationship',
      relationTo: 'guides',
      hasMany: true,
      filterOptions: () => ({ active: { equals: true } }),
    },
    {
      name: 'airportFrom',
      type: 'relationship',
      relationTo: 'airports',
      filterOptions: () => ({ active: { equals: true } }),
    },
    {
      name: 'airportTo',
      type: 'relationship',
      relationTo: 'airports',
      filterOptions: () => ({ active: { equals: true } }),
    },
    { name: 'price', type: 'number', required: true },
    { name: 'vat', type: 'number', required: true, defaultValue: 0 },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'EUR',
      options: [
        { label: 'EUR', value: 'EUR' },
        { label: 'CZK', value: 'CZK' },
      ],
    },
    { name: 'capacity', type: 'number', required: true },
    { name: 'minParticipants', type: 'number', defaultValue: 0 },
    { name: 'extraContent', type: 'richText' },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ],
}
