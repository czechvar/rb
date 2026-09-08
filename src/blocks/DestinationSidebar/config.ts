import type { Block } from 'payload'

export const DestinationSidebarBlockConfig: Block = {
  slug: 'destinationSidebar',
  labels: { singular: 'Destination Sidebar', plural: 'Destination Sidebar blocks' },
  fields: [
    {
      name: 'includeCta',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'includeQuickFacts',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'includeAccommodationLinks',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'includeResources',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'includeEmergencyContacts',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}

export const DestinationSidebarBlock = DestinationSidebarBlockConfig
