import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'
import { revalidateOnChange } from './hooks/revalidate'
import { TAGS } from '@/lib/cache'

export const EventDates: CollectionConfig = {
  slug: 'event-dates',
  labels: { singular: 'Event Date', plural: 'Event Dates' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'dateFrom', group: 'Catalogue' },
  hooks: revalidateOnChange(TAGS.eventDates),
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
    { name: 'price', type: 'number', required: true, min: 0 },
    { name: 'vat', type: 'number', required: true, defaultValue: 0, min: 0, max: 100 },
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
    { name: 'capacity', type: 'number', required: true, min: 0 },
    { name: 'minParticipants', type: 'number', defaultValue: 0, min: 0 },
    { name: 'extraContent', type: 'richText' },
    {
      name: 'logisticsOverrides',
      type: 'group',
      label: 'Logistics overrides',
      admin: {
        description:
          'Optional date-specific logistics copy when this occurrence differs from the parent event or location defaults.',
      },
      fields: [
        { name: 'accommodation', type: 'richText' },
        { name: 'food', type: 'richText' },
        { name: 'included', type: 'richText' },
        { name: 'excluded', type: 'richText' },
        { name: 'note', type: 'richText' },
      ],
    },
    { name: 'active', type: 'checkbox', defaultValue: false },
    {
      name: 'bookedSeats',
      type: 'number',
      virtual: true,
      admin: { readOnly: true, description: 'Sum of participants in pending+confirmed+paid orders.' },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.id) return 0
            const res = await req.payload.find({
              collection: 'orders',
              where: {
                and: [
                  { eventDate: { equals: data.id } },
                  { state: { in: ['pending', 'confirmed', 'paid'] } },
                ],
              },
              limit: 10_000, depth: 0, req,
            })
            return res.docs.reduce(
              (sum, o) => sum + ((o as { participantCount?: number }).participantCount ?? 0),
              0,
            )
          },
        ],
      },
    },
    {
      name: 'remainingSeats',
      type: 'number',
      virtual: true,
      admin: { readOnly: true },
      hooks: {
        afterRead: [
          ({ data }) => {
            const cap = (data as { capacity?: number })?.capacity ?? 0
            const booked = (data as { bookedSeats?: number })?.bookedSeats ?? 0
            return Math.max(0, cap - booked)
          },
        ],
      },
    },
  ],
}
