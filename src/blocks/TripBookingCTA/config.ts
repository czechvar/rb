import type { Block } from 'payload'
import { headingFields } from '../fields'

export const TripBookingCTABlockConfig: Block = {
  slug: 'tripBookingCTA',
  labels: { singular: 'Trip Booking CTA', plural: 'Trip Booking CTA blocks' },
  fields: [
    ...headingFields({
      headingDefault: 'Ready to join?',
      eyebrowDefault: 'Reserve Your Place',
    }),
  ],
}

export const TripBookingCTABlock = TripBookingCTABlockConfig
