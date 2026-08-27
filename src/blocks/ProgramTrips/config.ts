import type { Block } from 'payload'

export const ProgramTripsBlockConfig: Block = {
  slug: 'programTrips',
  labels: { singular: 'Program Trips', plural: 'Program Trips blocks' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Upcoming Dates',
    },
  ],
}

export const ProgramTripsBlock = ProgramTripsBlockConfig
