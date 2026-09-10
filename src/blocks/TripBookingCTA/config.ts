import type { Block } from 'payload'
import { headingFields, selectField } from '../fields'

export const TripBookingCTABlockConfig: Block = {
  slug: 'tripBookingCTA',
  labels: { singular: 'Trip Booking CTA', plural: 'Trip Booking CTA blocks' },
  fields: [
    selectField('variant', { defaultValue: 'default', values: [{ label: 'Default', value: 'default' }, { label: 'Image banner', value: 'image' }] }),
    ...headingFields({
      headingDefault: 'Ready to join?',
      eyebrowDefault: 'Reserve Your Place',
    }),
  ],
}

export const TripBookingCTABlock = TripBookingCTABlockConfig
