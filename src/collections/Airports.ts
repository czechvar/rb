import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Airports: CollectionConfig = {
  slug: 'airports',
  labels: { singular: 'Airport', plural: 'Airports' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: { useAsTitle: 'name', group: 'Taxonomy' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'iata', type: 'text', required: true },
    { name: 'country', type: 'text' },
    { name: 'continent', type: 'text' },
    { name: 'coordinates', type: 'point', label: 'Coordinates [lng, lat]' },
    { name: 'size', type: 'number' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
